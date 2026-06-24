
import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, GeminiResponse, GroundingSource, AnalysisDepth } from '../types';

const getApiKey = () => {
    // Attempt multiple ways to retrieve the key
    const k1 = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined;
    const k2 = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
    
    const key = k1 || k2 || '';
    if (!key) {
        console.error("Critical: GEMINI_API_KEY is not defined. Please set it in Settings -> Secrets or .env file.");
    }
    return key;
};

const getFallbackKey = () => {
    const k1 = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_MY_EXTERNAL_KEY : undefined;
    const k2 = typeof process !== 'undefined' && process.env ? process.env.MY_EXTERNAL_KEY : undefined;
    return k1 || k2 || '';
};

let primaryAi = new GoogleGenAI({ apiKey: getApiKey() });
let fallbackAi: GoogleGenAI | null = null;

const getActiveAi = (useFallback: boolean) => {
    if (useFallback) {
        if (!fallbackAi) {
            const key = getFallbackKey();
            if (key) {
                console.log("[Gemini] Initializing fallback AI instance.");
                fallbackAi = new GoogleGenAI({ apiKey: key });
            }
        }
        return fallbackAi || primaryAi;
    }
    return primaryAi;
};

// Extract grounding sources from the response
const extractSources = (response: any): GroundingSource[] => {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!chunks) return [];
    
    return chunks
        .map((chunk: any) => ({
            title: chunk.web?.title || chunk.maps?.title || 'Source',
            uri: chunk.web?.uri || chunk.maps?.uri
        }))
        .filter((s: GroundingSource) => !!s.uri);
};

import { apiLogger } from './apiLogger';

// bulk functions start
const withRetry = async <T>(fn: (instance: GoogleGenAI) => Promise<T>, label: string, payload?: any, maxRetries = 5, baseDelayMs = 5000): Promise<T> => {
  let attempt = 0;
  let useFallback = false;
  const logId = apiLogger.log(label, payload || { info: "API call initiated" });

  while (attempt < maxRetries) {
    try {
      console.log(`[Gemini] Starting ${label} (Attempt ${attempt + 1}, fallback: ${useFallback})`);
      const instance = getActiveAi(useFallback);
      const result = await fn(instance);
      apiLogger.update(logId, result);
      return result;
    } catch (error: any) {
      const isAuthError = error?.status === 401 || error?.status === 403 || error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key not valid');
      const isRateLimit = 
        error?.status === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      // If it's a fatal or rate limit error and we haven't tried fallback yet, try it
      if (!useFallback && getFallbackKey() && (isAuthError || isRateLimit)) {
          console.warn(`[Gemini] ${label} - Primary key issue (${isAuthError ? 'Auth' : 'Quota'}). Trying fallback key...`);
          useFallback = true;
          // Don't increment attempt, just switch key and retry immediately
          continue; 
      }

      if (isRateLimit) {
        attempt++;
        if (attempt >= maxRetries) {
            console.error(`[Gemini] ${label} failed after maximum retries.`);
            apiLogger.update(logId, undefined, error?.message || String(error));
            throw error;
        }
        
        const delay = (baseDelayMs * Math.pow(2, attempt - 1)) + (Math.random() * 2000);
        console.warn(`[Gemini] ${label} - Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
        apiLogger.update(logId, { status: "Retrying", attempt }, error?.message || String(error));
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`[Gemini] ${label} - Non-retryable error:`, error);
        apiLogger.update(logId, undefined, error?.message || String(error));
        throw error;
      }
    }
  }
  const errorMsg = `[Gemini] ${label} - Max retries exceeded`;
  apiLogger.update(logId, undefined, errorMsg);
  throw new Error(errorMsg);
};

export const analyzePatentAlignment = async (patentClaim: string, targetCompanyRepos: string[]): Promise<any> => {
  try {
    const prompt = `You are a strict patent alignment expert.
Analyze if the following patent claim roughly aligns with ANY of the repositories owned by the target company.
Target Repositories:
${targetCompanyRepos.join('\n')}

Patent Claim:
${patentClaim}

Return a STRICT JSON object in this format (NO markdown):
{
  "isAligned": boolean,
  "reasoning": "brief 2 sentence reasoning",
  "matchingRepos": ["repo_name_1", "repo_name_2"] 
}`;

    const response = await withRetry((instance) => instance.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    }), 'Phase 1 Alignment', { prompt });
    
    const text = (response.text || "").replace(/```json/gi, '').replace(/```/gi, '').trim() || '{}';
    const parsed = JSON.parse(text);
    return { ...parsed, usage: response.usageMetadata };
  } catch (error) {
    console.error("Alignment Phase Error:", error);
    return { isAligned: false, reasoning: "Error analyzing alignment.", matchingRepos: [] };
  }
};

export const rankPatentClaimElements = async (patentClaim: string, targetCompany: string, phase1Reasoning: string, repoContext: string): Promise<any> => {
  try {
      const prompt = `Extract the key elements from this patent claim and evaluate their presence in the open-source repositories of ${targetCompany}.
      
      Previous Analysis regarding alignment:
      ${phase1Reasoning}

      Detailed Repository Context (Fetched from GitHub):
      ======
      ${repoContext}
      ======
      
      Patent Claim:
      ${patentClaim}

      Rank 1: All elements are explicitly or conceptually present in the provided repository context, showing strong overlap.
      Rank 2: Some elements present or partial conceptual overlap.
      Rank 3: No overlap is present.

      Return a STRICT JSON in this format (NO markdown):
      {
        "rank": 1, 
        "elementsOverview": "Comma separated list of key elements",
        "reasoning": "String reasoning for the rank based on the source code structure and concepts provided in the repository context"
      }`;

    const response = await withRetry((instance) => instance.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    }), 'Phase 2 Ranking', { prompt });

    const text = (response.text || "").replace(/```json/gi, '').replace(/```/gi, '').trim() || '{}';
    const parsed = JSON.parse(text);
    if (![1,2,3].includes(parsed.rank)) parsed.rank = 3;
    return { ...parsed, usage: response.usageMetadata };
  } catch (error) {
    console.error("Ranking Phase Error:", error);
    return { rank: 3, reasoning: "Error ranking claim.", elementsOverview: "" };
  }
};

export const detailedClauseAnalysis = async (patentClaim: string, targetCompany: string, elementsContext: string, repoContext: string, phase1Reasoning: string = "", phase2Reasoning: string = ""): Promise<any> => {
  try {
     const prompt = `Break down this patent claim into individual clauses. For each clause, analyze how strongly it overlaps with the specific open source repository context provided below for ${targetCompany}.

     Previous Phase 1 Alignment Reasoning:
     ${phase1Reasoning}

     Previous Phase 2 Elements Ranking Reasoning:
     ${phase2Reasoning}

     Previous phase identified elements:
     ${elementsContext}

     Detailed Repository Context (Fetched from GitHub):
     ======
     ${repoContext}
     ======

     Patent Claim:
     ${patentClaim}

     Return STRICT JSON in this format (NO markdown):
     {
       "overallConclusion": "String conclusion summarizing the overall infringement risk based on the repository content",
       "clauseAnalysis": [
         {
           "clause": "The text of the clause",
           "analysis": "Analysis of overlap explicitly linking to the concepts found in the repository context",
           "overlapDegree": "strong" | "partial" | "weak"
         }
       ]
     }`;

     const response = await withRetry((instance) => instance.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    }), 'Phase 3 Clause Analysis', { prompt });

    const text = (response.text || "").replace(/```json/gi, '').replace(/```/gi, '').trim() || '{}';
    const parsed = JSON.parse(text);
    return { ...parsed, usage: response.usageMetadata };
  } catch (error) {
    console.error("Clause Analysis Error:", error);
    return { overallConclusion: "Error analyzing clauses", clauseAnalysis: [] };
  }
};


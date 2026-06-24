
export type AnalysisDepth = 'quick' | 'balanced' | 'thorough';

export interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
  sha: string;
  size?: number;
}

export interface Repository {
  url: string;
  owner: string;
  repo: string;
  branch: string;
  files: GitHubFile[];
}

export interface ChatAction {
  label: string;
  actionId: string;
  payload?: any;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  actions?: ChatAction[];
  sources?: GroundingSource[];
  timestamp: number;
  contextSnapshot?: {
    files: string[];
    patentIncluded: boolean;
  };
}

export interface AnalysisSession {
  id: string;
  title: string;
  patentSummary: string;
  repositories: Repository[];
  chatHistory: ChatMessage[];
  selectedFiles: string[];
  lastUpdated: number;
}

export interface SuggestedRepository {
  id: number;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponse {
  text: string;
  usage?: UsageMetadata;
  suggestedFiles?: string[];
  groundingSources?: GroundingSource[];
}

// Bulk Analysis Types
export interface PatentData {
  id: string;
  number?: string;
  title: string;
  abstract: string;
  claimText: string;
}

export interface Phase1Result {
  isAligned: boolean;
  reasoning: string;
  matchingRepos: string[]; // Names of repos
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface ClaimElementAnalysis {
  element: string;
  isPresent: boolean;
  reasoning: string;
  referenceFile?: string;
}

export interface Phase2Result {
  rank: 1 | 2 | 3 | null;
  reasoning: string;
  elementsOverview: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface ClauseAnalysisItem {
  clause: string;
  analysis: string;
  overlapDegree: 'strong' | 'partial' | 'none';
}

export interface Phase3Result {
  overallConclusion: string;
  clauseAnalysis: ClauseAnalysisItem[];
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface ApiLog {
  id: string;
  timestamp: number;
  operation: string;
  input: any;
  output?: any;
  error?: string;
  durationMs?: number;
}

export interface BulkAnalysisItem {
  patent: PatentData;
  phase1: Phase1Result;
  phase2: Phase2Result;
  phase3: Phase3Result;
}


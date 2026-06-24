
import React, { useState, useEffect } from 'react';
import type { PatentData, BulkAnalysisItem } from './types';
import BulkInputForm from './components/BulkInputForm';
import BulkAnalysisDashboard from './components/BulkAnalysisDashboard';
import { SunIcon, MoonIcon } from './components/Icons';
import ErrorBoundary from './components/ErrorBoundary';
import { ApiLogsViewer } from './components/ApiLogsViewer';
import { analyzePatentAlignment, rankPatentClaimElements, detailedClauseAnalysis } from './services/geminiService';
import { searchCompanyRepos, fetchRepoContents } from './services/githubService';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  const [workflowStage, setWorkflowStage] = useState<'input' | 'dashboard'>(() => {
    const saved = localStorage.getItem('workflowStage');
    return (saved as 'input' | 'dashboard') || 'input';
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [targetCompany, setTargetCompany] = useState(() => {
    return localStorage.getItem('targetCompany') || '';
  });
  const [analysisItems, setAnalysisItems] = useState<BulkAnalysisItem[]>(() => {
    const saved = localStorage.getItem('analysisItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Reset previously 'analyzing' tasks to 'pending'
        return parsed.map((item: any) => {
            if (item.phase1?.status === 'analyzing') item.phase1.status = 'pending';
            if (item.phase2?.status === 'analyzing') item.phase2.status = 'pending';
            if (item.phase3?.status === 'analyzing') item.phase3.status = 'pending';
            return item;
        });
      } catch (e) {
        console.error("Failed to parse analysis items", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('workflowStage', workflowStage);
  }, [workflowStage]);

  useEffect(() => {
    localStorage.setItem('targetCompany', targetCompany);
  }, [targetCompany]);

  useEffect(() => {
    localStorage.setItem('analysisItems', JSON.stringify(analysisItems));
  }, [analysisItems]);

  // Optionally auto-resume on mount if returning to dashboard
  useEffect(() => {
     if (workflowStage === 'dashboard' && targetCompany && analysisItems.length > 0) {
         const hasPending = analysisItems.some(i => 
             i.phase1.status === 'pending' || 
             (i.phase1.isAligned && i.phase2.status === 'pending') || 
             (i.phase2.rank === 1 && i.phase3.status === 'pending')
         );
         if (hasPending && !isInitializing) {
             console.log("[Workflow] Auto-resuming analysis...");
             // Pass the *current* items to resume where it left off
             processAllPhases(analysisItems, targetCompany);
         }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const handleBulkSubmit = async (patents: PatentData[], company: string) => {
      setIsInitializing(true);
      setTargetCompany(company);

      // Initialize items
      const newItems: BulkAnalysisItem[] = patents.map(p => ({
          patent: p,
          phase1: { status: 'pending', isAligned: false, reasoning: '', matchingRepos: [] },
          phase2: { status: 'pending', rank: null, reasoning: '', elementsOverview: '' },
          phase3: { status: 'pending', overallConclusion: '', clauseAnalysis: [] }
      }));
      setAnalysisItems(newItems);
      setWorkflowStage('dashboard');
      setIsInitializing(false);

      // Start processing Phase 1 for ALL items first
      processAllPhases(newItems, company);
  };

  const processAllPhases = async (items: BulkAnalysisItem[], company: string) => {
      console.log(`[Workflow] Starting analysis for ${items.length} patents targeting company: ${company}`);
      try {
          // Find top repos for the company via GitHub search API
          console.log(`[Workflow] Fetching repositories for ${company}...`);
          const targetCompanyRepos = await searchCompanyRepos(company);
          console.log(`[Workflow] Found ${targetCompanyRepos.length} repositories.`);
          
          const maxConcurrent = 3;
          let activeCount = 0;
          const queue = [...Array(items.length).keys()];

          const processPatent = async (i: number) => {
              // PHASE 1: Run Alignment check
              let isAligned = items[i].phase1.isAligned;
              let phase1Reasoning = items[i].phase1.reasoning;
              let matchingRepos: string[] = items[i].phase1.matchingRepos || [];

              if (items[i].phase1.status !== 'completed') {
                  console.log(`[Workflow] [Phase 1] Item ${i + 1}/${items.length}: ${items[i].patent.id}`);
                  setAnalysisItems(prev => {
                      const updated = [...prev];
                      updated[i] = { ...updated[i], phase1: { ...updated[i].phase1, status: 'analyzing' } };
                      return updated;
                  });

                  try {
                      const res = await analyzePatentAlignment(items[i].patent.claimText, targetCompanyRepos);
                      console.log(`[Workflow] [Phase 1] Item ${i + 1} completed. Aligned: ${res.isAligned}`);
                      isAligned = res.isAligned;
                      phase1Reasoning = res.reasoning;
                      matchingRepos = res.matchingRepos || [];
                      
                      setAnalysisItems(prev => {
                          const updated = [...prev];
                          updated[i] = {
                              ...updated[i],
                              phase1: {
                                  status: 'completed',
                                  isAligned,
                                  reasoning: phase1Reasoning,
                                  matchingRepos
                              }
                          };
                          return updated;
                      });
                  } catch(e) {
                      setAnalysisItems(prev => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], phase1: { ...updated[i].phase1, status: 'error' } };
                          return updated;
                      });
                      return; // Stop processing this patent on error
                  }
              }

              if (!isAligned) {
                  console.log(`[Workflow] [Phase 2] Skipping item ${i + 1} (not aligned).`);
                  return;
              }

              // Wait before phase 2
              await new Promise(r => setTimeout(r, 2000));

              // PHASE 2: Element Ranking
              let rank = items[i].phase2.rank;
              let elementsOverview = items[i].phase2.elementsOverview;
              let phase2Reasoning = items[i].phase2.reasoning;

              let repoContext = "";
              for (const repo of matchingRepos.slice(0, 3)) { // Max 3 repos to avoid massive prompts
                  const fullName = repo.includes('/') ? repo : `${company}/${repo}`;
                  const readme = await fetchRepoContents(fullName);
                  repoContext += `\n\n--- Repository: ${fullName} ---\n${readme.substring(0, 2500)}`;
              }

              if (items[i].phase2.status !== 'completed') {
                  console.log(`[Workflow] [Phase 2] Item ${i + 1}/${items.length}: Ranking elements...`);
                  setAnalysisItems(prev => {
                      const updated = [...prev];
                      updated[i] = { ...updated[i], phase2: { ...updated[i].phase2, status: 'analyzing' } };
                      return updated;
                  });
                  
                  try {
                      const res = await rankPatentClaimElements(items[i].patent.claimText, company, phase1Reasoning, repoContext);
                      console.log(`[Workflow] [Phase 2] Item ${i + 1} completed. Rank: ${res.rank}`);
                      rank = res.rank;
                      elementsOverview = res.elementsOverview;
                      phase2Reasoning = res.reasoning;

                      setAnalysisItems(prev => {
                          const updated = [...prev];
                          updated[i] = {
                              ...updated[i],
                              phase2: {
                                  status: 'completed',
                                  rank,
                                  reasoning: phase2Reasoning,
                                  elementsOverview
                              }
                          };
                          return updated;
                      });
                  } catch(e) {
                      setAnalysisItems(prev => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], phase2: { ...updated[i].phase2, status: 'error' } };
                          return updated;
                      });
                      return;
                  }
              }

              if (rank !== 1) {
                  console.log(`[Workflow] [Phase 3] Skipping item ${i + 1} (rank != 1).`);
                  return;
              }

              // Wait before phase 3
              await new Promise(r => setTimeout(r, 2000));

              // PHASE 3: Detailed Clause Analysis
              if (items[i].phase3.status !== 'completed') {
                  console.log(`[Workflow] [Phase 3] Item ${i + 1}/${items.length}: Detailed analysis...`);
                  setAnalysisItems(prev => {
                      const updated = [...prev];
                      updated[i] = { ...updated[i], phase3: { ...updated[i].phase3, status: 'analyzing' } };
                      return updated;
                  });

                  try {
                      const res = await detailedClauseAnalysis(items[i].patent.claimText, company, elementsOverview, repoContext, phase1Reasoning, phase2Reasoning);
                      console.log(`[Workflow] [Phase 3] Item ${i + 1} completed.`);

                      setAnalysisItems(prev => {
                          const updated = [...prev];
                          updated[i] = {
                              ...updated[i],
                              phase3: {
                                  status: 'completed',
                                  overallConclusion: res.overallConclusion,
                                  clauseAnalysis: res.clauseAnalysis || []
                              }
                          };
                          return updated;
                      });
                  } catch(e) {
                      setAnalysisItems(prev => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], phase3: { ...updated[i].phase3, status: 'error' } };
                          return updated;
                      });
                  }
              }
          };

          const worker = async () => {
              while (queue.length > 0) {
                  const index = queue.shift();
                  if (index !== undefined) {
                      await processPatent(index);
                  }
              }
          };

          const workers = [];
          for (let i = 0; i < Math.min(maxConcurrent, items.length); i++) {
              workers.push(worker());
          }

          await Promise.all(workers);

          console.log(`[Workflow] Full bulk analysis completed!`);
      } catch (err) {
          console.error("Critical error in processAllPhases:", err);
          // Update all pending/analyzing items to error state
          setAnalysisItems(prev => prev.map(item => {
              const updated = { ...item };
              if (updated.phase1.status === 'analyzing') updated.phase1.status = 'error';
              if (updated.phase2.status === 'analyzing') updated.phase2.status = 'error';
              if (updated.phase3.status === 'analyzing') updated.phase3.status = 'error';
              return updated;
          }));
      }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
              <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 h-16 flex justify-between items-center z-20">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => {
                 setWorkflowStage('input');
                 setTargetCompany('');
                 setAnalysisItems([]);
             }}>P</div>
             <h1 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Bulk Patent Analysis</h1>
         </div>
         <div className="flex items-center gap-4">
             {workflowStage === 'dashboard' && (
                 <button 
                     onClick={() => {
                        setWorkflowStage('input');
                        setTargetCompany('');
                        setAnalysisItems([]);
                     }}
                     className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                 >
                     New Analysis
                 </button>
             )}
             <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {theme === 'dark' ? <SunIcon className="w-5 h-5 text-slate-400" /> : <MoonIcon className="w-5 h-5 text-slate-500" />}
             </button>
         </div>
      </header>

      <main className="flex-grow overflow-hidden flex">
          {workflowStage === 'input' ? (
              <div className="m-auto w-full max-w-2xl px-6 py-12 focus-within:ring-0">
                  <ErrorBoundary fallbackTitle="Input Form Error">
                      <BulkInputForm onSubmit={handleBulkSubmit} isLoading={isInitializing} />
                  </ErrorBoundary>
              </div>
          ) : (
              <div className="w-full h-full">
                  <ErrorBoundary fallbackTitle="Dashboard Display Error">
                      <BulkAnalysisDashboard analysisItems={analysisItems} targetCompany={targetCompany} />
                  </ErrorBoundary>
              </div>
          )}
      </main>
      <ApiLogsViewer />
    </div>
  );
};

export default App;


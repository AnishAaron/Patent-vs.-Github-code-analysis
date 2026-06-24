import React, { useState } from 'react';
import { BulkAnalysisItem } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface BulkAnalysisDashboardProps {
  analysisItems: BulkAnalysisItem[];
  targetCompany: string;
}

const BulkAnalysisDashboard: React.FC<BulkAnalysisDashboardProps> = ({ analysisItems, targetCompany }) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Phase 1 stats
  const phase1Completed = analysisItems.filter(item => item.phase1.status === 'completed');
  const alignedCount = phase1Completed.filter(item => item.phase1.isAligned).length;
  const unalignedCount = phase1Completed.length - alignedCount;
  const processingCount = analysisItems.length - phase1Completed.length;
  
  const alignedPercent = analysisItems.length > 0 ? (alignedCount / analysisItems.length) * 100 : 0;
  const unalignedPercent = analysisItems.length > 0 ? (unalignedCount / analysisItems.length) * 100 : 0;
  const processingPercent = analysisItems.length > 0 ? (processingCount / analysisItems.length) * 100 : 0;

  // Phase 2 stats
  const phase2Completed = analysisItems.filter(item => item.phase2.status === 'completed');
  const rank1Count = phase2Completed.filter(item => item.phase2.rank === 1).length;
  const rank2Count = phase2Completed.filter(item => item.phase2.rank === 2).length;
  const rank3Count = phase2Completed.filter(item => item.phase2.rank === 3).length;
  const maxRankCount = Math.max(rank1Count, rank2Count, rank3Count) || 1;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div>
           <h1 className="text-lg font-bold text-slate-800 dark:text-white">Bulk Patent Analysis</h1>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{targetCompany}</span> • {analysisItems.length} Patents</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <button 
             onClick={() => setActiveTab(1)}
             className={`px-4 py-3 text-sm font-bold uppercase tracking-tight transition-all border-b-2 ${activeTab === 1 ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
              Phase 1: Alignment Check
          </button>
          <button 
             onClick={() => setActiveTab(2)}
             className={`px-4 py-3 text-sm font-bold uppercase tracking-tight transition-all border-b-2 ${activeTab === 2 ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
              Phase 2: Element Ranking
          </button>
          <button 
             onClick={() => setActiveTab(3)}
             className={`px-4 py-3 text-sm font-bold uppercase tracking-tight transition-all border-b-2 ${activeTab === 3 ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
              Phase 3: Deep Clause Analysis
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {activeTab === 1 && (
             <div className="space-y-4">
                 <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">Alignment Overview</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Checking if the patents overlap with any repositories from {targetCompany}.</p>
                    </div>
                    
                    {/* Phase 1 Progress Bar */}
                    <div className="w-full md:w-64">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          <span className="text-emerald-600 dark:text-emerald-400">Aligned ({alignedCount})</span>
                          <span className="text-rose-600 dark:text-rose-400">None ({unalignedCount})</span>
                          <span className="text-sky-600 dark:text-sky-400">Wait ({processingCount})</span>
                       </div>
                       <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                          {alignedPercent > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${alignedPercent}%` }} title={`Aligned: ${alignedCount}`} />}
                          {unalignedPercent > 0 && <div className="bg-rose-500 transition-all duration-500" style={{ width: `${unalignedPercent}%` }} title={`No Overlap: ${unalignedCount}`} />}
                          {processingPercent > 0 && <div className="bg-sky-400 opacity-50 transition-all duration-500" style={{ width: `${processingPercent}%` }} title={`Processing: ${processingCount}`} />}
                       </div>
                    </div>
                 </div>
                 
                 <div className="grid gap-4">
                     {analysisItems.map((item, idx) => (
                         <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{item.patent.id} - {item.patent.title || "Untitled Document"}</h3>
                                
                                {item.phase1.status === 'pending' && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Pending</span>}
                                {item.phase1.status === 'analyzing' && <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"/> Analyzing</span>}
                                {item.phase1.status === 'completed' && item.phase1.isAligned && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Aligned</span>}
                                {item.phase1.status === 'completed' && !item.phase1.isAligned && <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">No Overlap</span>}
                                {item.phase1.status === 'error' && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Error</span>}
                             </div>
                             
                             {item.phase1.status === 'completed' && (
                                 <div className="space-y-3">
                                   <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                       <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"><span className="font-semibold">Reasoning:</span> {item.phase1.reasoning}</p>
                                   </div>
                                   {item.phase1.matchingRepos && item.phase1.matchingRepos.length > 0 && (
                                      <div className="text-xs flex flex-wrap gap-2">
                                         <span className="font-semibold text-slate-500 mt-1">Matched Repos:</span> 
                                         {item.phase1.matchingRepos.map((repo, i) => <span key={i} className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{repo}</span>)}
                                      </div>
                                   )}
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
          )}

          {activeTab === 2 && (
             <div className="space-y-4">
                 <div className="mb-6 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">Claim Element Ranking</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Deep checking claim elements against repository code for aligned patents.</p>
                    </div>

                    {/* Phase 2 Bar Chart */}
                    <div className="flex items-end gap-4 h-24 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                       <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-500">{rank1Count}</span>
                          <div className="w-8 bg-emerald-500 rounded-t-sm transition-all duration-500" style={{ height: `${(rank1Count / maxRankCount) * 100}%` }} />
                          <span className="text-[10px] font-bold text-slate-600">R1</span>
                       </div>
                       <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-500">{rank2Count}</span>
                          <div className="w-8 bg-amber-500 rounded-t-sm transition-all duration-500" style={{ height: `${(rank2Count / maxRankCount) * 100}%` }} />
                          <span className="text-[10px] font-bold text-slate-600">R2</span>
                       </div>
                       <div className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-500">{rank3Count}</span>
                          <div className="w-8 bg-rose-500 rounded-t-sm transition-all duration-500" style={{ height: `${(rank3Count / maxRankCount) * 100}%` }} />
                          <span className="text-[10px] font-bold text-slate-600">R3</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid gap-4">
                     {analysisItems.filter(item => item.phase1.isAligned).length === 0 && (
                         <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                             <p className="text-sm text-slate-500 font-medium">No patents have passed Phase 1 yet.</p>
                         </div>
                     )}
                     
                     {analysisItems.filter(item => item.phase1.status === 'completed' && item.phase1.isAligned).map((item, idx) => (
                         <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                             <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{item.patent.id} - Rank {item.phase2.rank || '?'}</h3>
                                
                                {item.phase2.status === 'pending' && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Pending</span>}
                                {item.phase2.status === 'analyzing' && <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"/> Analyzing</span>}
                                {item.phase2.status === 'completed' && item.phase2.rank === 1 && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Rank 1 - Excellent</span>}
                                {item.phase2.status === 'completed' && item.phase2.rank === 2 && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Rank 2 - Partial</span>}
                                {item.phase2.status === 'completed' && item.phase2.rank === 3 && <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Rank 3 - Poor</span>}
                             </div>

                             {item.phase2.status === 'completed' && (
                                 <div className="space-y-3">
                                     <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                       <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"><span className="font-semibold">Reasoning:</span> {item.phase2.reasoning}</p>
                                     </div>
                                     <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                       <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono"><span className="font-semibold font-sans mb-1 block">Elements Overview:</span> {item.phase2.elementsOverview}</p>
                                     </div>
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
          )}

          {activeTab === 3 && (
             <div className="space-y-4">
                 <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1">Clause-by-Clause Deep Analysis</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Detailed breakdown for Rank 1 patents.</p>
                 </div>

                 <div className="grid gap-6">
                     {analysisItems.filter(item => item.phase2.rank === 1).length === 0 && (
                         <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                             <p className="text-sm text-slate-500 font-medium">No Rank 1 patents identified yet.</p>
                         </div>
                     )}

                     {analysisItems.filter(item => item.phase2.status === 'completed' && item.phase2.rank === 1).map((item, idx) => (
                         <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-md">
                             <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{item.patent.id}</h3>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 uppercase tracking-widest">Rank 1 Verified</p>
                                </div>
                                {item.phase3.status === 'pending' && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest">Pending</span>}
                                {item.phase3.status === 'analyzing' && <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"/> Analyzing</span>}
                             </div>

                             {item.phase3.status === 'completed' && (
                                <div className="space-y-4">
                                     <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Overall Conclusion</span>
                                         <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{item.phase3.overallConclusion}</p>
                                     </div>
                                     
                                     <div className="space-y-3 mt-6">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Detailed Clauses</h4>
                                        {item.phase3.clauseAnalysis.map((clause, cIdx) => (
                                            <div key={cIdx} className={`p-4 rounded-lg bg-white dark:bg-slate-800 border ${clause.overlapDegree === 'strong' ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30' : 'border-slate-200 dark:border-slate-700'}`}>
                                                <div className="flex justify-between items-start mb-2 gap-4">
                                                    <div className="flex gap-3">
                                                       {clause.overlapDegree === 'strong' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />}
                                                       {clause.overlapDegree === 'partial' && <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                                                       {clause.overlapDegree === 'weak' && <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />}
                                                       <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{clause.clause}</p>
                                                    </div>
                                                    <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                                        clause.overlapDegree === 'strong' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                        clause.overlapDegree === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                    }`}>
                                                        {clause.overlapDegree}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">{clause.analysis}</p>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
          )}
      </div>

    </div>
  );
};

export default BulkAnalysisDashboard;

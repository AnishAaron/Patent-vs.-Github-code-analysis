
import React from 'react';
import type { AnalysisSession } from '../types';
import { CloseIcon, TrashIcon, ChatIcon, FileIcon, PatentIcon, PlusIcon } from './Icons';

interface HistoryModalProps {
  isOpen: boolean;
  sessions: AnalysisSession[];
  currentSessionId: string;
  onLoadSession: (session: AnalysisSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  sessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onNewSession,
  onClose
}) => {
  if (!isOpen) return null;

  // Sort sessions by lastUpdated desc
  const sortedSessions = [...sessions].sort((a, b) => b.lastUpdated - a.lastUpdated);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                <ChatIcon className="w-4 h-4 text-sky-500" />
            </span>
            Session History
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <CloseIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <button 
                onClick={() => { onNewSession(); onClose(); }}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <PlusIcon className="w-5 h-5" />
                Start New Analysis
            </button>
        </div>

        <main className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                <p className="text-sm">No saved sessions found.</p>
            </div>
          ) : (
            sortedSessions.map(session => (
              <div 
                key={session.id}
                onClick={() => { onLoadSession(session); onClose(); }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                    session.id === currentSessionId 
                    ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' 
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm truncate ${session.id === currentSessionId ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {session.title || 'Untitled Analysis'}
                        </h3>
                        {session.id === currentSessionId && (
                            <span className="text-[9px] font-bold uppercase bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 px-1.5 py-0.5 rounded">
                                Active
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        <span>{formatTime(session.lastUpdated)}</span>
                        {session.patentSummary && (
                            <span className="flex items-center gap-1"><PatentIcon className="w-3 h-3" /> Patent</span>
                        )}
                        {session.repositories.length > 0 && (
                            <span className="flex items-center gap-1"><FileIcon className="w-3 h-3" /> {session.repositories.length} Repos</span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Session"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </main>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl text-center">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                Storage: {sortedSessions.length} / 10 Sessions
             </p>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;

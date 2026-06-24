
import React, { useState } from 'react';
import type { SuggestedRepository } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { CloseIcon, StarIcon, SearchIcon } from './Icons';

interface RepoSuggestionsModalProps {
  isOpen: boolean;
  isLoading: boolean;
  suggestions: SuggestedRepository[];
  onAddRepos: (urls: string[]) => void;
  onClose: () => void;
  searchTerm?: string;
  onSearchGlobal?: () => void;
}

const RepoSuggestionsModal: React.FC<RepoSuggestionsModalProps> = ({
  isOpen,
  isLoading,
  suggestions,
  onAddRepos,
  onClose,
  searchTerm,
  onSearchGlobal
}) => {
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());

  if (!isOpen) {
    return null;
  }

  const handleToggleRepo = (url: string) => {
    setSelectedRepos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const handleAddClick = () => {
    onAddRepos(Array.from(selectedRepos));
    setSelectedRepos(new Set()); // Clear selection after adding
  };
  
  const handleClose = () => {
    onClose();
    setSelectedRepos(new Set());
  }

  return (
    <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity"
        onClick={handleClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
       >
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Suggested Repositories</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <CloseIcon className="w-5 h-5 text-slate-500" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <LoadingSpinner message="Searching GitHub..." />
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="space-y-3">
              {suggestions.map(repo => (
                <li key={repo.id}>
                  <label 
                    htmlFor={`repo-${repo.id}`}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${selectedRepos.has(repo.html_url) ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-500' : 'border-slate-200 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                    <input
                      type="checkbox"
                      id={`repo-${repo.id}`}
                      checked={selectedRepos.has(repo.html_url)}
                      onChange={() => handleToggleRepo(repo.html_url)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                    />
                    <div className="ml-4 flex-grow">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-sky-600 dark:text-sky-400">{repo.full_name}</p>
                            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                <StarIcon className="w-4 h-4 text-amber-400" />
                                <span>{repo.stargazers_count.toLocaleString()}</span>
                            </div>
                        </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{repo.description}</p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
             <div className="flex flex-col items-center justify-center h-52 text-center text-slate-500 dark:text-slate-400">
                <p className="font-semibold mb-1">No relevant repositories found.</p>
                <p className="text-sm mb-4">We couldn't find matches for "{searchTerm}" with the generated keywords.</p>
                
                {searchTerm && onSearchGlobal && (
                    <button 
                        onClick={onSearchGlobal}
                        className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all"
                    >
                        <SearchIcon className="w-4 h-4" />
                        Search "{searchTerm}" Globally
                    </button>
                )}
            </div>
          )}
        </main>

        <footer className="flex justify-end items-center p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
          <button 
            onClick={handleClose} 
            className="px-4 py-2 text-sm font-semibold rounded-md text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors mr-2"
           >
            Cancel
          </button>
          <button
            onClick={handleAddClick}
            disabled={selectedRepos.size === 0}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Add {selectedRepos.size > 0 ? `(${selectedRepos.size})` : ''} Selected Repositories
          </button>
        </footer>
      </div>
    </div>
  );
};

export default RepoSuggestionsModal;

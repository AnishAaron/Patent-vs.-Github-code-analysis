
import React, { useState, useMemo, useEffect } from 'react';
import type { Repository, GitHubFile } from '../types';
import { FileIcon, GithubIcon, ChevronRightIcon, ChevronDownIcon, CloseIcon, TrashIcon, CheckIcon } from './Icons';

interface FileTreeProps {
  repositories: Repository[];
  selectedFiles: Set<string>;
  onFileSelectionChange: (augmentedPath: string, isSelected: boolean) => void;
  onFileView: (augmentedPath: string) => void;
  activeFile: string | null;
  maxFilesToIdentify: number;
  onMaxFilesChange: (count: number) => void;
  onAddRepos: (urls: string[]) => void;
  onRemoveRepo: (url: string) => void;
  isAdding: boolean;
}

const FileTree: React.FC<FileTreeProps> = ({ 
  repositories, 
  selectedFiles, 
  onFileSelectionChange, 
  onFileView, 
  activeFile, 
  maxFilesToIdentify, 
  onMaxFilesChange,
  onAddRepos,
  onRemoveRepo,
  isAdding
}) => {
  const [filter, setFilter] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (repositories.length > 0) {
        setExpandedRepos(prev => {
            const next = new Set(prev);
            repositories.forEach(r => {
                if (!Array.from(prev).some(p => p === r.url)) next.add(r.url);
            });
            return next;
        });
    }
  }, [repositories.length]);
  
  const toggleRepoExpansion = (repoUrl: string) => {
    setExpandedRepos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(repoUrl)) newSet.delete(repoUrl);
        else newSet.add(repoUrl);
        return newSet;
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInput.trim() && !isAdding) {
      const urls = repoInput.split(/[\n,\s]+/).map(u => u.trim()).filter(u => u.length > 0);
      if (urls.length > 0) {
        onAddRepos(urls);
        setRepoInput('');
      }
    }
  };

  const getAugmentedPath = (repo: Repository, file: GitHubFile) => `${repo.owner}/${repo.repo}/${file.path}`;

  const filteredRepositories = useMemo(() => {
    if (!filter) return repositories;
    return repositories
      .map(repo => ({
        ...repo,
        files: repo.files.filter(file => file.path.toLowerCase().includes(filter.toLowerCase())),
      }))
      .filter(repo => repo.files.length > 0);
  }, [repositories, filter]);

  const renderFileItem = (repo: Repository, file: GitHubFile) => {
    const augmentedPath = getAugmentedPath(repo, file);
    const isActive = activeFile === augmentedPath;
    const isChecked = selectedFiles.has(augmentedPath);
    
    return (
        <div key={augmentedPath} className={`flex items-center pl-6 pr-2 py-1 group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-l-2 ${isActive ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/20' : 'border-transparent'}`}>
            <input
                type="checkbox"
                id={augmentedPath}
                checked={isChecked}
                onChange={(e) => onFileSelectionChange(augmentedPath, e.target.checked)}
                className="h-3.5 w-3.5 mr-2 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0 cursor-pointer accent-sky-600"
            />
            <div onClick={() => onFileView(augmentedPath)} className="flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer overflow-hidden">
                <FileIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-sky-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500'}`} />
                <label htmlFor={augmentedPath} className={`cursor-pointer text-xs font-mono truncate transition-colors ${isActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>
                    {file.path}
                </label>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Workspace Header */}
      <div className="flex justify-between items-center">
         <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <GithubIcon className="w-4 h-4" /> 2. Project Workspace
         </h2>
         <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500">
            <span className="text-[10px] text-slate-400 font-normal uppercase tracking-tighter">File Limit:</span>
            <input
                type="number"
                min="1"
                max="100"
                value={maxFilesToIdentify}
                onChange={(e) => onMaxFilesChange(parseInt(e.target.value, 10))}
                className="w-16 bg-transparent text-sm font-normal text-slate-900 dark:text-slate-100 text-center outline-none"
            />
         </div>
      </div>

      {/* Repo Input */}
      <form onSubmit={handleAddSubmit} className="relative">
        <div className="relative group">
            <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder={isAdding ? "Scanning repository..." : "Paste GitHub Repository URL..."}
                className={`w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 pr-12 text-xs outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 ${isAdding ? 'italic text-slate-400 cursor-wait' : ''}`}
                disabled={isAdding}
            />
            <button 
                type="submit" 
                className="absolute right-2 top-2 p-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:scale-105 transition-all disabled:opacity-30 shadow-sm"
                disabled={isAdding || !repoInput.trim()}
            >
                {isAdding ? <span className="block w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
        </div>
      </form>

      {/* Filter */}
      <input
          type="text"
          placeholder="Filter workspace files..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs outline-none transition-all focus:border-sky-500 ${isAdding ? 'opacity-50 pointer-events-none' : ''}`}
      />

      {/* Selected Context Summary */}
      {selectedFiles.size > 0 && (
        <div className="p-3 bg-sky-50/30 dark:bg-sky-900/10 rounded-xl border border-sky-100 dark:border-sky-900/30">
            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2 flex justify-between">
                <span>Active Context</span>
                <span>{selectedFiles.size} Files</span>
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                {Array.from(selectedFiles).map(path => (
                    <div key={path} className="flex items-center justify-between group">
                         <div className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer" onClick={() => onFileView(path)}>
                            <FileIcon className="w-3 h-3 text-sky-400" />
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate">{path}</span>
                         </div>
                         <button onClick={() => onFileSelectionChange(path, false)} className="ml-1 text-slate-300 hover:text-red-500 transition-colors">
                            <CloseIcon className="w-3 h-3" />
                         </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* File Tree List */}
      <div className="space-y-2 relative">
        {isAdding && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-500/30">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Hydrating Files</span>
                </div>
            </div>
        )}
        {repositories.length === 0 && !isAdding ? (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                <GithubIcon className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connect a repository</p>
            </div>
        ) : (
            filteredRepositories.map(repo => (
                <div key={repo.url} className="space-y-1">
                    <div className="group flex items-center justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-default">
                        <div 
                            onClick={() => toggleRepoExpansion(repo.url)}
                            className="flex items-center gap-2 cursor-pointer min-w-0 flex-grow"
                        >
                            {expandedRepos.has(repo.url) ? <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />}
                            <span className="font-bold text-xs text-slate-700 dark:text-slate-200 truncate">
                                {repo.owner}/{repo.repo}
                            </span>
                        </div>
                        <button 
                            onClick={() => onRemoveRepo(repo.url)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {expandedRepos.has(repo.url) && (
                        <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800 ml-3.5">
                            {repo.files.map(file => renderFileItem(repo, file))}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default FileTree;

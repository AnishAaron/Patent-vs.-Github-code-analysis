
import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { CloseIcon } from './Icons';

interface FileViewerProps {
  filePath: string | null;
  content: string | null;
  isLoading: boolean;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ filePath, content, isLoading, onClose }) => {
  if (!filePath) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 shadow-2xl w-full h-full flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 mr-4 font-mono" title={filePath}>
              {filePath}
            </h2>
            <button 
                onClick={onClose} 
                className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700"
                title="Close Viewer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex-grow overflow-auto bg-slate-50 dark:bg-slate-950 p-4 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner message="Loading file..." />
              </div>
            ) : content !== null ? (
               <div className="min-w-full inline-block">
                 <div className="flex font-mono text-sm">
                    <div className="text-right pr-4 text-slate-400 dark:text-slate-600 select-none border-r border-slate-200 dark:border-slate-800 mr-4 bg-slate-50 dark:bg-slate-950 sticky left-0 z-10" aria-hidden="true">
                    {Array.from({ length: content.split('\n').length }, (_, i) => (
                        <div key={i} className="leading-6">{i + 1}</div>
                    ))}
                    </div>
                    <pre className="text-slate-800 dark:text-slate-300 whitespace-pre leading-6 tab-4">
                    <code>{content}</code>
                    </pre>
                </div>
              </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 dark:text-slate-400">File is empty or could not be loaded.</p>
                </div>
            )
            }
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
             Viewing Mode • Read Only
        </div>
      </div>
    </div>
  );
};

export default FileViewer;


import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { SendIcon, TrashIcon, DownloadIcon, SparklesIcon, FileIcon, PatentIcon } from './Icons';

type WorkflowStage = 'patent_input' | 'repo_input' | 'analysis_ready' | 'analyzing';

interface ChatWindowProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  onActionClick: (actionId: string, payload?: any) => void;
  onFileView?: (path: string) => void;
  availableFiles?: string[];
  isLoading: boolean;
  workflowStage: WorkflowStage;
  suggestedQuestions: string[];
  onClearChat: () => void;
  activeFileCount?: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  onActionClick, 
  onFileView,
  availableFiles = [],
  isLoading, 
  workflowStage, 
  suggestedQuestions, 
  onClearChat, 
  activeFileCount = 0 
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && workflowStage === 'analysis_ready') {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative">
      <div className="flex justify-between items-center p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 absolute top-0 left-0 right-0">
         <div className="flex items-center gap-3 px-2">
             <div className="flex items-center gap-1.5">
                 <SparklesIcon className="w-4 h-4 text-sky-500 animate-pulse" />
                 <span className="font-bold text-slate-700 dark:text-slate-200 text-xs tracking-tight">Active Context</span>
             </div>
             {messages.length > 0 && (
                <div className="hidden md:flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        <PatentIcon className="w-3 h-3 text-amber-500" /> Patent: Loaded
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        <FileIcon className="w-3 h-3 text-sky-500" /> Files: {activeFileCount}
                    </div>
                </div>
             )}
         </div>
         <div className="flex items-center gap-1">
             <button onClick={onClearChat} disabled={messages.length === 0 || isLoading} className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30" title="Clear Chat History">
                 <TrashIcon className="w-4 h-4" />
             </button>
         </div>
      </div>

      <div className="flex-grow p-4 md:p-6 overflow-y-auto pt-16 scroll-smooth custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center mb-6 shadow-xl">
                <SparklesIcon className="w-7 h-7 text-white dark:text-slate-900" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Interconnected Assistant</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Step 1: Paste a patent. <br/>
                Step 2: Add GitHub repos. <br/>
                Step 3: Ask questions. I will automatically fetch the right code for you.
            </p>
          </div>
        ) : (
             <>
                {messages.map((msg, index) => (
                <ChatMessage 
                    key={index} 
                    message={msg} 
                    onActionClick={onActionClick} 
                    onFileView={onFileView}
                    availableFiles={availableFiles}
                    isProcessing={isLoading} 
                />
                ))}
                {isLoading && (
                    <div className="flex justify-start ml-11 py-2">
                        <LoadingSpinner message="Evaluating logic tree" />
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
             </>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        {suggestedQuestions.length > 0 && !isLoading && workflowStage === 'analysis_ready' && (
          <div className="pb-3 flex overflow-x-auto gap-2 no-scrollbar">
            {suggestedQuestions.map((q, i) => (
              <button key={i} onClick={() => setInput(q)} className="flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition-all">
                {q}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={workflowStage === 'analysis_ready' ? "Message AI..." : "Set up Patent & Repos first..."}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-3 pl-4 pr-12 resize-none outline-none text-sm transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
            rows={1}
            disabled={isLoading || workflowStage !== 'analysis_ready'}
            style={{ minHeight: '48px', maxHeight: '50vh' }}
          />
          <button type="submit" className="absolute right-2.5 top-2.5 p-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md hover:scale-105 disabled:opacity-20 disabled:scale-100 transition-all shadow-md" disabled={isLoading || !input.trim() || workflowStage !== 'analysis_ready'}>
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

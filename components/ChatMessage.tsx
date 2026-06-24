
import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { CopyIcon, CheckIcon, BotIcon, UserIcon, SparklesIcon, FileIcon } from './Icons';

interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick: (actionId: string, payload?: any) => void;
  onFileView?: (path: string) => void;
  availableFiles?: string[];
  isProcessing: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onActionClick, onFileView, availableFiles = [], isProcessing }) => {
  const [isCopied, setIsCopied] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  const isModel = message.role === 'model';
  const isSystem = message.role === 'system';
  const isUser = message.role === 'user';
  
  const shouldRenderHtml = isModel || isSystem;

  const handleCopyText = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(message.content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const formatContent = (text: string) => {
    if (!shouldRenderHtml) return { html: text, codeContents: [] };
    
    // Protect code blocks first
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const codeBlocks: string[] = [];
    const codeContents: string[] = []; 
    
    html = html.replace(/```(?:(\w+)\n)?([\s\S]*?)```/g, (_, lang, code) => {
        const id = codeBlocks.length;
        const language = lang || 'text';
        const rawCode = code.trim();
        codeContents.push(rawCode);
        const block = `
<div class="code-block-container my-4 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-[#0d1117] group/code">
  <div class="flex items-center justify-between px-3 py-1.5 bg-slate-100/50 dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800/50">
    <div class="flex items-center">
      <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">${language}</span>
    </div>
    <button class="code-copy-btn flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all" data-code-id="${id}">
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
      <span>COPY</span>
    </button>
  </div>
  <pre class="!m-0 !p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-800 dark:text-slate-300 language-${language}"><code>${rawCode}</code></pre>
</div>`.trim();
        codeBlocks.push(block);
        return `\n\n§§CODEBLOCK§${id}§§\n\n`;
    });

    // Detect and hyperlink file paths outside of code blocks
    if (availableFiles.length > 0) {
        availableFiles.forEach(path => {
            // Escaping dots and slashes for regex
            const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escapedPath})\\b`, 'g');
            html = html.replace(regex, `<span class="file-link inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-mono text-[13px] cursor-pointer hover:underline decoration-2 underline-offset-4 decoration-sky-500/30 transition-all px-1 rounded bg-sky-50 dark:bg-sky-900/20" data-file-path="$1"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>$1</span>`);
        });
    }

    const lines = html.split('\n');
    let processedLines = [];
    let listStack: ('ul' | 'ol')[] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
            if (inTable) { processedLines.push('</table></div>'); inTable = false; }
            while (listStack.length > 0) { processedLines.push(`</${listStack.pop()}>`); }
            processedLines.push('<div class="h-2"></div>');
            continue;
        }
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headerMatch) {
            const level = headerMatch[1].length;
            const sizeClasses = ['text-lg font-bold border-b pb-1 mb-3 mt-3', 'text-base font-bold mb-2 mt-3', 'text-sm font-bold mb-2', 'text-xs font-bold mb-1', 'text-xs font-bold', 'text-xs'];
            processedLines.push(`<h${level} class="${sizeClasses[level-1]} text-slate-900 dark:text-white">${headerMatch[2]}</h${level}>`);
            continue;
        }
        if (trimmed.startsWith('|')) {
            if (!inTable) { processedLines.push('<div class="overflow-x-auto my-3 border border-slate-100 dark:border-slate-800 rounded text-xs"><table class="min-w-full">'); inTable = true; }
            const cells = trimmed.split('|').filter(c => c.length > 0).map(c => c.trim());
            processedLines.push(`<tr class="border-b border-slate-100 dark:border-slate-800">${cells.map(c => `<td class="px-2 py-1">${c}</td>`).join('')}</tr>`);
            continue;
        }
        if (trimmed.includes('§§CODEBLOCK§')) { processedLines.push(trimmed); continue; }
        if (trimmed && !trimmed.startsWith('<')) { processedLines.push(`<p class="mb-3 last:mb-0 leading-relaxed text-sm">${line}</p>`); }
        else { processedLines.push(line); }
    }
    html = processedLines.join('\n');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 font-mono text-[12px]">$1</code>');
    codeBlocks.forEach((block, id) => {
        const marker = `§§CODEBLOCK§${id}§§`;
        html = html.split(`<p>${marker}</p>`).join(block).split(marker).join(block);
    });
    return { html, codeContents };
  };

  const { html: formattedHtml, codeContents } = formatContent(message.content);

  useEffect(() => {
    if (shouldRenderHtml && messageRef.current) {
        // Code copy buttons
        const copyBtns = messageRef.current.querySelectorAll('.code-copy-btn');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.getAttribute('data-code-id') || '0', 10);
                if (!isNaN(id) && codeContents[id]) navigator.clipboard.writeText(codeContents[id]);
            });
        });

        // File links
        const fileLinks = messageRef.current.querySelectorAll('.file-link');
        fileLinks.forEach(link => {
            link.addEventListener('click', () => {
                const path = link.getAttribute('data-file-path');
                if (path && onFileView) onFileView(path);
            });
        });

        if ((window as any).Prism) (window as any).Prism.highlightAllUnder(messageRef.current);
    }
  }, [formattedHtml, shouldRenderHtml, codeContents, onFileView]);

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <BotIcon className="w-5 h-5" />}
      </div>
      <div className={`flex flex-col max-w-[92%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div ref={messageRef} className={`p-4 rounded-xl border ${isUser ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 shadow-sm'}`}>
          <div className="text-[14px] leading-relaxed">
             {shouldRenderHtml ? <div className="custom-markdown" dangerouslySetInnerHTML={{ __html: formattedHtml }} /> : message.content}
          </div>
          {message.actions?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.actions.map((action, i) => (
                <button key={i} onClick={() => onActionClick(action.actionId, action.payload)} className="px-3 py-1.5 text-[10px] font-bold rounded bg-sky-600 text-white hover:bg-sky-500 transition-all flex items-center gap-1.5">
                  <SparklesIcon className="w-3 h-3" /> {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

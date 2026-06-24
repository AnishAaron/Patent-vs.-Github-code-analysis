
import React, { useState, useRef } from 'react';
import { PaperClipIcon, SparklesIcon } from './Icons';

interface PatentInputFormProps {
  onSubmit: (claim: string, targetOwner?: string) => void;
  isLoading: boolean;
  onExtractFromPDF?: (base64Data: string) => Promise<string>;
}

const PatentInputForm: React.FC<PatentInputFormProps> = ({ onSubmit, isLoading, onExtractFromPDF }) => {
  const [claim, setClaim] = useState('');
  const [targetOwner, setTargetOwner] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWorking = isUploading || isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (claim.trim() && !isWorking) {
      onSubmit(claim.trim(), targetOwner.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      setIsUploading(true);
      setClaim(`Extracting patent data from "${file.name}"...`);
      
      const reader = new FileReader();
      
      reader.onerror = () => {
          setClaim("Failed to read the file.");
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      };

      reader.onload = async (event) => {
          if (!event.target?.result) {
              setClaim("Failed to read the file content.");
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              return;
          }

          if (onExtractFromPDF) {
              try {
                  const base64String = (event.target.result as string).split(',')[1];
                  const extractedText = await onExtractFromPDF(base64String);
                  setClaim(extractedText);
                  // Automatically trigger the analysis process when extraction works
                  if (extractedText && extractedText.length > 10) {
                      onSubmit(extractedText, targetOwner.trim());
                  }
              } catch (error: any) {
                  console.error("PDF extraction error: ", error);
                  setClaim(`Failed to extract data from PDF. Error: ${error?.message || error}`);
              } finally {
                  setIsUploading(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
              }
          } else {
              setIsUploading(false);
          }
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col space-y-4 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. Patent Analysis</h2>
        {isWorking && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-tighter">Processing</span>
          </div>
        )}
      </div>
      
      {/* Action Row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Manual Entry or PDF Source</span>
        {onExtractFromPDF && (
            <div className="flex items-center">
                <input 
                    type="file" 
                    accept="application/pdf" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    disabled={isWorking}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isWorking}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30 flex items-center gap-1.5 uppercase tracking-widest hover:scale-[1.02] shadow-sm"
                >
                     <PaperClipIcon className="w-3 h-3" />
                     Attach PDF
                </button>
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="relative group">
            <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Paste the patent Abstract and Claims here for review..."
                className={`w-full h-56 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none outline-none font-mono text-xs leading-relaxed ${isWorking ? 'italic text-slate-400' : 'text-slate-900 dark:text-slate-200'}`}
                disabled={isWorking}
            />

            {isWorking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-sky-500 border-t-transparent"></div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-center">
                    {isUploading ? 'Extracting Data...' : 'Analyzing Claim...'}
                  </span>
                </div>
              </div>
            )}
        </div>

        <div className={isWorking ? 'opacity-50' : ''}>
             <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-tight">
                Target Entity (Optional)
            </label>
            <input
                type="text"
                value={targetOwner}
                onChange={(e) => setTargetOwner(e.target.value)}
                placeholder="e.g. Google, facebook/react"
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-xs"
                disabled={isWorking}
            />
        </div>
        
        <button
          type="submit"
          className="bg-sky-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-sky-500 hover:scale-[1.01] active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center shadow-lg text-xs uppercase tracking-[0.15em]"
          disabled={isWorking || !claim.trim()}
        >
          {isLoading ? 'EXECUTING...' : 'ANALYZE PATENT'}
        </button>
      </form>
    </div>
  );
};

export default PatentInputForm;

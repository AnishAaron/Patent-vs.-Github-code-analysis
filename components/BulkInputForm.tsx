import React, { useState, useRef } from 'react';
import { PaperClipIcon } from './Icons';
import * as XLSX from 'xlsx';
import { PatentData } from '../types';

interface BulkInputFormProps {
  onSubmit: (patents: PatentData[], targetCompany: string) => void;
  isLoading: boolean;
}

const BulkInputForm: React.FC<BulkInputFormProps> = ({ onSubmit, isLoading }) => {
  const [targetCompany, setTargetCompany] = useState('');
  const [patents, setPatents] = useState<PatentData[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          if (data.length === 0) {
            setError("The uploaded file is empty.");
            return;
          }

          // Simple mapping logic based on expected headers, fallback to keys
          const mappedPatents: PatentData[] = data.map((row: any, index: number) => {
             const getVal = (possibleKeys: string[]) => {
               for (const key of possibleKeys) {
                 const found = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()));
                 if (found) return row[found];
               }
               return '';
             };

             return {
                 id: getVal(['id', 'number', 'patent']) || `PAT-${index + 1}`,
                 number: getVal(['number', 'id', 'patent']),
                 title: getVal(['title', 'name']),
                 abstract: getVal(['abstract', 'summary']),
                 claimText: getVal(['claim', 'text'])
             };
          });

          // Validation
          const validPatents = mappedPatents.filter(p => p.claimText && p.claimText.trim() !== '');
          
          if (validPatents.length === 0) {
            setError("Could not find any patent claims. Please ensure your Excel/CSV has columns like 'Claim', 'Text', 'Abstract', or 'Summary'.");
          }

          setPatents(validPatents);
        } catch (err: any) {
             setError(`Error parsing file: ${err.message}`);
        }
      };
      
      reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patents.length > 0 && targetCompany.trim() && !isLoading) {
      onSubmit(patents, targetCompany.trim());
    }
  };

  return (
    <div className="flex flex-col space-y-6 relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Setup Bulk Analysis</h2>
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-tighter">Processing</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        
        {/* Step 1: File Upload */}
        <div className="space-y-3">
             <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                1. Upload Patent File (Excel/CSV)
             </label>
             <div className="flex items-center gap-4">
                <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 flex items-center gap-2"
                >
                     <PaperClipIcon className="w-4 h-4" />
                     {fileName ? 'Change File' : 'Select File'}
                </button>
                {fileName && (
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {fileName} <span className="ml-2 text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">{patents.length} Patents Read</span>
                    </div>
                )}
             </div>
             {error && <p className="text-xs text-red-500 font-medium mt-2">{error}</p>}
        </div>

        {/* Preview Table */}
        {patents.length > 0 && (
          <div className="space-y-3">
             <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                Data Preview
             </label>
             <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-4 py-2.5">ID</th>
                            <th className="px-4 py-2.5">Title</th>
                            <th className="px-4 py-2.5">Claim Preview</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {patents.slice(0, 5).map((patent, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{patent.id}</td>
                                <td className="px-4 py-2.5 text-slate-900 dark:text-slate-200 font-medium truncate max-w-[150px]">{patent.title || "No Title"}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{patent.claimText}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {patents.length > 5 && (
                  <div className="px-4 py-2 text-[10px] bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 italic">
                    Showing first 5 of {patents.length} entries...
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Step 2: Target Company */}
        <div className="space-y-3">
             <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                2. Target Company (GitHub)
            </label>
            <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Microsoft, facebook"
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-sm placeholder:text-slate-400 text-slate-900 dark:text-slate-100 font-medium"
                disabled={isLoading}
                required
            />
        </div>
        
        <button
          type="submit"
          className="bg-sky-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-sky-500 hover:scale-[1.01] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center shadow-lg text-sm uppercase tracking-[0.15em] mt-4"
          disabled={isLoading || patents.length === 0 || targetCompany.trim() === ''}
        >
          {isLoading ? 'STARTING BULK ANALYSIS...' : 'START BULK ANALYSIS'}
        </button>
      </form>
    </div>
  );
};

export default BulkInputForm;

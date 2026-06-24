import React, { useEffect, useState, useRef } from 'react';
import { apiLogger } from '../services/apiLogger';
import { ApiLog } from '../types';

export const ApiLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = apiLogger.subscribe((newLogs) => {
      setLogs([...newLogs]);
    });
    return unsubscribe;
  }, []);

  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50 text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        API Logs ({logs.length})
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                API Logs 
                <span className="text-xs font-normal px-2 py-0.5 bg-gray-200 rounded-full">{logs.length} calls</span>
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => apiLogger.clear()}
                  className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-900 px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-1/3 border-r overflow-y-auto bg-gray-50">
                {logs.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 italic text-center mt-10">No interactions yet.</div>
                ) : (
                  logs.map(log => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`w-full text-left p-3 border-b text-sm transition-colors ${selectedLogId === log.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'}`}
                    >
                      <div className="font-medium text-gray-900 truncate" title={log.operation}>
                        {log.operation}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        {log.durationMs !== undefined && (
                          <span className={log.error ? 'text-red-500' : 'text-green-600'}>
                            {log.durationMs}ms
                          </span>
                        )}
                        {log.durationMs === undefined && <span className="text-blue-500 animate-pulse">Running...</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Detail View */}
              <div className="flex-1 overflow-y-auto p-4 bg-white">
                {selectedLog ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Input</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs whitespace-pre-wrap font-mono text-gray-800 break-words max-h-96 overflow-y-auto border">
                        {selectedLog.input?.prompt || JSON.stringify(selectedLog.input, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        {selectedLog.error ? 'Error' : 'Output'}
                      </h3>
                      {selectedLog.error ? (
                        <pre className="bg-red-50 p-3 rounded text-xs whitespace-pre-wrap font-mono text-red-800 break-words border border-red-200">
                          {selectedLog.error}
                        </pre>
                      ) : selectedLog.output ? (
                        <pre className="bg-gray-100 p-3 rounded text-xs whitespace-pre-wrap font-mono text-gray-800 break-words border max-h-[500px] overflow-y-auto">
                          {selectedLog.output?.text ? selectedLog.output.text : JSON.stringify(selectedLog.output, null, 2)}
                        </pre>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          Waiting for response...
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">
                    Select a log to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

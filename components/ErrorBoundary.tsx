import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangleIcon, RefreshCcwIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            The application encountered an unexpected error. This usually happens due to data formatting issues or rate limits.
          </p>
          {this.state.error && (
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-auto max-h-32">
               <code className="text-[10px] font-mono text-red-600 dark:text-red-400 text-left block whitespace-pre-wrap">
                 {this.state.error.toString()}
               </code>
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
          >
            <RefreshCcwIcon className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

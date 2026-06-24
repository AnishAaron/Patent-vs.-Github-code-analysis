import React, { useState, useEffect } from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium min-w-[80px] text-center">{message}{dots}</p>
    </div>
  );
};

export default LoadingSpinner;
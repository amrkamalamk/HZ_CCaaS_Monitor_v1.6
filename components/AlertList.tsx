
import React from 'react';
import { Alert } from '../types';

interface Props {
  alerts: Alert[];
}

const AlertList: React.FC<Props> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-600">
        <i className="fa-solid fa-circle-check text-4xl mb-2 opacity-20"></i>
        <p className="text-sm font-medium">No alerts triggered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="flex-shrink-0 mt-1">
            <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-semibold text-red-900 dark:text-red-300 leading-tight">
              {alert.severity === 'high' ? 'CRITICAL' : 'WARNING'}: {alert.value.toFixed(2)}
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 line-clamp-2">
              {alert.message}
            </p>
            <p className="text-[10px] text-red-400 dark:text-red-500/60 mt-1 uppercase tracking-wider font-black">
              {alert.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertList;

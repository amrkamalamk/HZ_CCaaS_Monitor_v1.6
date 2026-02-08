
import React, { useMemo } from 'react';
import { ReasonBranchData, BranchData, WrapUpData } from '../types';

interface Props {
  reasonBranchData: ReasonBranchData[];
  branchData: BranchData[];
  wrapUpData: WrapUpData[];
}

const ReasonsBranchTab: React.FC<Props> = ({ reasonBranchData, branchData, wrapUpData }) => {
  // Sort reasons and branches by total volume
  const sortedReasons = useMemo(() => 
    [...wrapUpData].sort((a, b) => b.count - a.count).map(r => r.name)
  , [wrapUpData]);

  const sortedBranches = useMemo(() => 
    [...branchData].sort((a, b) => b.offered - a.offered).map(b => b.name)
  , [branchData]);

  // Aggregate matrix: branch -> reason -> { count, percent }
  const matrix = useMemo(() => {
    const data: Record<string, Record<string, {count: number, percent: number}>> = {};
    sortedBranches.forEach(b => {
      data[b] = {};
      const branchTotal = reasonBranchData.filter(d => d.branch === b).reduce((acc, d) => acc + d.count, 0);
      sortedReasons.forEach(r => {
        const item = reasonBranchData.find(d => d.branch === b && d.reason === r);
        const count = item ? item.count : 0;
        data[b][r] = {
          count,
          percent: branchTotal > 0 ? (count / branchTotal) * 100 : 0
        };
      });
    });
    return data;
  }, [reasonBranchData, sortedBranches, sortedReasons]);

  // KPI calculations
  const totalCalls = useMemo(() => wrapUpData.reduce((acc, r) => acc + r.count, 0), [wrapUpData]);
  const topReason = wrapUpData[0];
  const highestBranch = branchData[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Conversations</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{totalCalls.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Call Reason</p>
          <p className="text-lg font-black text-emerald-600 tracking-tight truncate w-full">
            {topReason ? `${topReason.name} (${((topReason.count / totalCalls) * 100).toFixed(1)}%)` : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Highest-Volume Branch</p>
          <p className="text-lg font-black text-slate-900 tracking-tight truncate w-full">{highestBranch?.name || 'N/A'}</p>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
            <i className="fa-solid fa-border-all text-emerald-500"></i> Operational Intensity Matrix
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            Sorted by Total Branch Volume Desc.
          </span>
        </div>
        
        <div className="overflow-x-auto no-scrollbar pb-4">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="p-2 text-[10px] font-black uppercase text-slate-400 text-left bg-slate-50 rounded-lg min-w-[200px]">Reason \ Branch</th>
                {sortedBranches.map(b => (
                  <th key={b} className="p-2 text-[10px] font-black uppercase text-slate-700 text-center bg-slate-50 rounded-lg min-w-[100px] leading-tight">
                    {b.replace(' - Tawn Hyp.', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedReasons.map(r => (
                <tr key={r}>
                  <td className="p-3 text-[11px] font-black text-slate-700 bg-slate-50 rounded-lg border border-slate-100/50 truncate max-w-[200px]">
                    {r}
                  </td>
                  {sortedBranches.map(b => {
                    const val = matrix[b]?.[r]?.percent || 0;
                    const count = matrix[b]?.[r]?.count || 0;
                    
                    // Heat colors based on percentage of branch calls
                    const getBgColor = (p: number) => {
                      if (p === 0) return 'bg-white text-slate-200';
                      if (p < 5) return 'bg-emerald-50 text-emerald-600';
                      if (p < 15) return 'bg-emerald-100 text-emerald-700';
                      if (p < 30) return 'bg-amber-100 text-amber-700';
                      if (p < 50) return 'bg-orange-100 text-orange-700';
                      return 'bg-rose-100 text-rose-700';
                    };

                    return (
                      <td key={b} className={`p-3 text-center rounded-lg transition-all hover:scale-105 border border-transparent hover:border-slate-200 ${getBgColor(val)}`}>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black">{val.toFixed(1)}%</span>
                          <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">{count} Calls</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-6 border-t border-slate-100 pt-6">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Normal (0-5%)</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medium (15-30%)</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">High Intensity (50%+)</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonsBranchTab;

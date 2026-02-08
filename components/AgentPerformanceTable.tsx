
import React from 'react';
import { AgentPerformance } from '../types';

interface Props {
  agents: AgentPerformance[];
}

const AgentPerformanceTable: React.FC<Props> = ({ agents }) => {
  const formatCoverage = (agent: AgentPerformance) => {
    if (!agent.firstActivity || !agent.lastActivity) return '0h 0m';
    const diff = agent.lastActivity.getTime() - agent.firstActivity.getTime();
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  const sortedAgents = [...agents].sort((a, b) => b.answered - a.answered);

  // Totals calculations
  const totalHandled = agents.reduce((acc, a) => acc + a.answered, 0);
  const totalDropped = agents.reduce((acc, a) => acc + a.missed, 0);
  const agentCount = agents.length;

  const calculateTotalCoverage = () => {
    let totalMs = 0;
    agents.forEach(agent => {
      if (agent.firstActivity && agent.lastActivity) {
        totalMs += agent.lastActivity.getTime() - agent.firstActivity.getTime();
      }
    });
    const h = Math.floor(totalMs / (1000 * 60 * 60));
    const m = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  return (
    <div className="overflow-x-auto custom-scrollbar bg-white">
      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            <th className="px-6 py-4">Agent Identity (Name & ID)</th>
            <th className="px-6 py-4 text-center">Session Coverage</th>
            <th className="px-6 py-4 text-center">Handled</th>
            <th className="px-6 py-4 text-center">Dropped</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {sortedAgents.map((agent) => (
            <tr key={agent.userId} className="bg-slate-50/50 hover:bg-slate-100/80 transition-all group">
              <td className="px-6 py-4 rounded-l-2xl border-y border-l border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black uppercase group-hover:scale-110 transition-transform border border-emerald-200/50 shadow-sm">
                    {agent.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-black text-slate-900 text-sm tracking-tight">{agent.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
                      ID: <span className="text-slate-500 font-bold">{agent.userId}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center font-bold text-slate-500 border-y border-slate-100">
                {formatCoverage(agent)}
              </td>
              <td className="px-6 py-4 text-center border-y border-slate-100">
                <span className="text-sm font-black text-emerald-600">{agent.answered}</span>
              </td>
              <td className="px-6 py-4 rounded-r-2xl text-center border-y border-r border-slate-100">
                <span className={`text-sm font-black ${agent.missed > 0 ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-md' : 'text-slate-300'}`}>
                  {agent.missed}
                </span>
              </td>
            </tr>
          ))}
          
          {agents.length > 0 && (
            <tr className="bg-emerald-50/30 border-t-2 border-emerald-500">
              <td className="px-6 py-6 rounded-l-2xl border-y border-l border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black uppercase shadow-md shadow-emerald-500/20">
                    <i className="fa-solid fa-users"></i>
                  </div>
                  <div>
                    <p className="font-black text-slate-900 uppercase tracking-wider text-xs">Total Squad</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{agentCount} Active Agents</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-6 text-center font-black text-slate-700 border-y border-emerald-100">
                {calculateTotalCoverage()}
              </td>
              <td className="px-6 py-6 text-center border-y border-emerald-100">
                <span className="text-lg font-black text-emerald-600">{totalHandled}</span>
              </td>
              <td className="px-6 py-6 rounded-r-2xl text-center border-y border-r border-emerald-100">
                <span className={`text-lg font-black ${totalDropped > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                  {totalDropped}
                </span>
              </td>
            </tr>
          )}

          {agents.length === 0 && (
            <tr>
              <td colSpan={4} className="py-20 text-center opacity-40 font-black uppercase italic tracking-widest text-[11px] text-slate-400">
                <i className="fa-solid fa-satellite-dish animate-pulse mr-2"></i>
                Waiting for agent telemetry stream...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AgentPerformanceTable;

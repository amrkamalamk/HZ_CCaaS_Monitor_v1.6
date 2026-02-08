
import React, { useState, useMemo } from 'react';
import * as XLSX from 'https://esm.sh/xlsx';

interface ForecastInterval {
  hour: number;
  dayOfWeek: number;
  requiredAgents: number; // Baseline (Needed for demand)
  scheduledAgents?: number; // Constrained by concurrent cap
  capacity?: number; // Max calls handled by scheduledAgents
  avgCalls: number;
  avgAht: number;
}

type PlannerViewMode = 'baseline' | 'scheduled' | 'capacity';

const PlannerTab: React.FC<{ queueId: string }> = () => {
  const [forecast, setForecast] = useState<ForecastInterval[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scenario Planning States
  const [maxConcurrentInput, setMaxConcurrentInput] = useState<number>(20);
  const [viewMode, setViewMode] = useState<PlannerViewMode>('baseline');
  const [scenariosGenerated, setScenariosGenerated] = useState(false);

  const UTILIZATION_FACTOR = 0.75; 
  const AVAILABILITY_FACTOR = 0.875; 

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];

  const calculateRequiredAgents = (callsPerHour: number, aht: number): number => {
    if (callsPerHour <= 0 || aht <= 0) return 2; 
    const intensity = (callsPerHour * aht) / 3600;
    const agentsFloor = intensity / UTILIZATION_FACTOR;
    const headcountWithBreaks = Math.ceil(agentsFloor / AVAILABILITY_FACTOR);
    return Math.max(headcountWithBreaks, 2);
  };

  const handleGenerateScenarios = () => {
    if (!forecast) return;
    const peakRequired = Math.max(...forecast.map(i => i.requiredAgents));
    if (peakRequired === 0) return;
    const multiplier = maxConcurrentInput / peakRequired;
    const updatedForecast = forecast.map(i => {
      const scheduled = Math.ceil(i.requiredAgents * multiplier);
      const maxCallsPerAgent = (3600 * UTILIZATION_FACTOR) / (i.avgAht || 300);
      const capacity = i.avgAht > 0 ? Math.floor(scheduled * maxCallsPerAgent) : 0;
      return { ...i, scheduledAgents: scheduled, capacity: capacity };
    });
    setForecast(updatedForecast);
    setScenariosGenerated(true);
    setViewMode('scheduled');
  };

  const getHeatMapColor = (val: number, min: number, max: number) => {
    if (max === min) return '#10b981'; 
    const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
    let r, g, b;
    if (ratio < 0.5) {
      const factor = ratio * 2;
      r = Math.round(16 + (250 - 16) * factor);
      g = Math.round(185 + (204 - 185) * factor);
      b = Math.round(129 + (21 - 129) * factor);
    } else {
      const factor = (ratio - 0.5) * 2;
      r = Math.round(250 + (239 - 250) * factor);
      g = Math.round(204 + (68 - 204) * factor);
      b = Math.round(21 + (68 - 21) * factor);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getStatsForMode = (mode: PlannerViewMode) => {
    if (!forecast) return { min: 0, max: 0 };
    const values = forecast.map(i => {
      if (mode === 'baseline') return i.requiredAgents;
      if (mode === 'scheduled') return i.scheduledAgents || 0;
      return i.capacity || 0;
    });
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  const currentStats = useMemo(() => getStatsForMode(viewMode), [forecast, viewMode]);

  const dayTotals = useMemo(() => {
    if (!forecast) return Array(7).fill(0);
    return days.map((_, dow) => {
      return forecast
        .filter(i => i.dayOfWeek === dow)
        .reduce((sum, i) => {
          if (viewMode === 'baseline') return sum + (i.requiredAgents || 0);
          if (viewMode === 'scheduled') return sum + (i.scheduledAgents || 0);
          return sum + (i.capacity || 0);
        }, 0);
    });
  }, [forecast, viewMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setScenariosGenerated(false);
    setViewMode('baseline');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const callsSheet = workbook.Sheets['Calls'] || workbook.Sheets[workbook.SheetNames[0]];
        const ahtSheet = workbook.Sheets['AHT'] || workbook.Sheets[workbook.SheetNames[1]];
        if (!callsSheet || !ahtSheet) throw new Error('Tabs missing.');
        const callsData: any[][] = XLSX.utils.sheet_to_json(callsSheet, { header: 1 });
        const ahtData: any[][] = XLSX.utils.sheet_to_json(ahtSheet, { header: 1 });
        const intervals: ForecastInterval[] = [];
        for (let dow = 0; dow < 7; dow++) {
          hours.forEach((h) => {
            const row = callsData.find(r => r[0] == h);
            const ahtRow = ahtData.find(r => r[0] == h);
            if (row && ahtRow) {
              const avgCalls = (Number(row[dow + 1]) + Number(row[dow + 8])) / 2 || 0;
              const avgAht = (Number(ahtRow[dow + 1]) + Number(ahtRow[dow + 8])) / 2 || 0;
              intervals.push({ hour: h, dayOfWeek: dow, requiredAgents: calculateRequiredAgents(avgCalls, avgAht), avgCalls, avgAht });
            }
          });
        }
        setForecast(intervals);
      } catch (err: any) { setError(err.message); } finally { setIsProcessing(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportToExcel = () => {
    if (!forecast) return;
    const workbook = XLSX.utils.book_new();
    const generateStyledSheet = (mode: PlannerViewMode, title: string) => {
      const data = hours.map(h => {
        const row: any = { Interval: `${h.toString().padStart(2, '0')}:00` };
        days.forEach((day, dow) => {
          const interval = forecast.find(i => i.dayOfWeek === dow && i.hour === h);
          row[day] = mode === 'baseline' ? interval?.requiredAgents : (mode === 'scheduled' ? interval?.scheduledAgents : interval?.capacity);
        });
        return row;
      });
      if (mode === 'capacity') {
        const totalRow: any = { Interval: 'DAY TOTAL' };
        days.forEach((day, dow) => totalRow[day] = forecast.filter(i => i.dayOfWeek === dow).reduce((sum, i) => sum + (i.capacity || 0), 0));
        data.push(totalRow);
      }
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), title);
    };
    generateStyledSheet('baseline', "Baseline Plan");
    generateStyledSheet('scheduled', "Capped Plan");
    generateStyledSheet('capacity', "Call Capacity");
    XLSX.writeFile(workbook, `Mawsool_Bundle_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="bg-white/5 p-10 rounded-[3.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-zinc-950 shadow-2xl">
              <i className="fa-solid fa-file-import text-3xl"></i>
           </div>
           <div>
              <p className="text-[12px] font-black uppercase text-emerald-400 tracking-[0.3em] leading-none">Local Intelligence Engine</p>
              <h3 className="text-3xl font-black text-white uppercase mt-2 tracking-tight">Staffing Planner</h3>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="group cursor-pointer block">
            <div className="px-10 py-5 bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500 transition-all flex items-center gap-5 shadow-inner">
              <i className="fa-solid fa-cloud-arrow-up text-emerald-500 text-xl group-hover:animate-bounce"></i>
              <div className="text-left">
                <p className="text-[12px] font-black uppercase text-white tracking-widest">Process Data</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">14d Historical Feed</p>
              </div>
              <input type="file" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} />
            </div>
          </label>
          
          {forecast && (
            <button onClick={exportToExcel} className="px-10 py-5 bg-emerald-500 text-zinc-950 rounded-3xl shadow-2xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-4 border border-emerald-400/30">
              <i className="fa-solid fa-file-excel text-xl"></i>
              <span className="text-[12px] font-black uppercase tracking-widest">Export Bundle</span>
            </button>
          )}
        </div>
      </div>

      {forecast && !isProcessing && (
        <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-top-6 duration-500 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2">
              <h4 className="text-base font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                <i className="fa-solid fa-sliders text-emerald-500"></i> Scenario Control
              </h4>
              <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest">Dynamic Heat Mapping & Agent Cap Redistribution</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-emerald-500 uppercase ml-2 tracking-widest">Max Concurrent</label>
                <input 
                  type="number" 
                  min="1" max="250" 
                  value={maxConcurrentInput}
                  onChange={(e) => setMaxConcurrentInput(parseInt(e.target.value) || 1)}
                  className="w-28 px-6 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-base font-black text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>
              <button onClick={handleGenerateScenarios} className="mt-5 lg:mt-0 px-10 py-5 bg-white/10 text-emerald-500 font-black text-[12px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-white/20 active:scale-95 transition-all flex items-center gap-3 border border-white/5">
                <i className="fa-solid fa-layer-group"></i> Apply Constraint
              </button>
            </div>
          </div>

          {scenariosGenerated && (
            <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/5 gap-6">
              <div className="flex bg-black/40 p-2 rounded-2xl border border-white/5 shadow-inner">
                {(['baseline', 'scheduled', 'capacity'] as PlannerViewMode[]).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-emerald-500 text-zinc-950 shadow-2xl' : 'text-zinc-500 hover:text-white'}`}
                  >
                    {mode === 'baseline' ? 'Baseline' : mode === 'scheduled' ? 'Capped Plan' : 'Call Capacity'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b98155]"></div><span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Min</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#fbbf24] shadow-[0_0_10px_#fbbf2455]"></div><span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Mid</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#ef4444] shadow-[0_0_10px_#ef444455]"></div><span className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Max</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {isProcessing ? (
        <div className="py-32 flex flex-col items-center gap-8">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Computing Matrix...</p>
        </div>
      ) : forecast ? (
        <div className="space-y-14">
          <div className="space-y-6">
            <h5 className="text-[13px] font-black uppercase text-emerald-500 tracking-[0.3em] border-l-4 border-purple-500 pl-6 ml-4">
              {viewMode === 'baseline' ? 'Demand-Based Staffing Matrix' : viewMode === 'scheduled' ? 'Constrained Roster Matrix' : 'Available Hourly Call Capacity'}
            </h5>
            <div className="overflow-x-auto custom-scrollbar rounded-[3.5rem] border border-white/5 shadow-2xl bg-black/40">
              <table className="w-full border-collapse text-left min-w-[1000px]">
                <thead>
                  <tr className="bg-zinc-900/60">
                    <th className="p-8 border-b border-r border-white/5 text-[11px] font-black uppercase text-zinc-500 tracking-[0.3em] sticky left-0 z-20 bg-zinc-900 shadow-xl">Interval</th>
                    {days.map((day, i) => (
                      <th key={i} className="p-8 border-b border-white/5 text-center text-[11px] font-black uppercase text-white tracking-[0.2em]">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map((h, hIdx) => {
                    const displayHour = `${h.toString().padStart(2, '0')}:00 - ${(h === 23 ? 0 : h + 1).toString().padStart(2, '0')}:00`;
                    return (
                      <tr key={hIdx} className="hover:bg-white/5 transition-colors">
                        <td className="p-5 border-b border-r border-white/5 font-black text-[11px] text-zinc-400 uppercase tracking-widest sticky left-0 z-10 bg-zinc-950 shadow-2xl">
                          {displayHour}
                        </td>
                        {days.map((_, dow) => {
                          const interval = forecast.find(i => i.dayOfWeek === dow && i.hour === h);
                          let displayValue = 0;
                          if (viewMode === 'baseline') displayValue = interval?.requiredAgents || 2;
                          else if (viewMode === 'scheduled') displayValue = interval?.scheduledAgents || 0;
                          else displayValue = interval?.capacity || 0;
                          const bgColor = getHeatMapColor(displayValue, currentStats.min, currentStats.max);
                          return (
                            <td key={dow} style={{ backgroundColor: bgColor }} className="p-5 border-b border-r border-white/5 text-center transition-all duration-300">
                              <span className="text-sm font-black text-black drop-shadow-md">{displayValue}</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {viewMode === 'capacity' && (
                    <tr className="bg-white text-zinc-950 font-black">
                      <td className="p-8 text-[11px] uppercase tracking-widest sticky left-0 z-10 bg-white border-r border-zinc-200">Day Aggregate</td>
                      {dayTotals.map((total, idx) => (
                        <td key={idx} className="p-8 text-center text-sm border-r border-zinc-200">
                          {Math.round(total).toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center space-y-8 bg-black/20 rounded-[4rem] border border-zinc-800 border-dashed">
           <i className="fa-solid fa-clock-rotate-left text-7xl text-zinc-800"></i>
           <p className="text-sm font-black text-zinc-600 uppercase tracking-[0.4em]">Historical Feed Missing • Upload XLSX to Begin</p>
        </div>
      )}

      <div className="bg-black/20 p-14 rounded-[4rem] border border-white/5 space-y-10 shadow-inner">
        <h4 className="text-[11px] font-black uppercase text-emerald-500 tracking-[0.4em] flex items-center gap-4">
          <i className="fa-solid fa-circle-info text-emerald-500"></i> Operational Guardrails
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Efficiency Model</p>
            <p className="text-sm font-black text-white">75% Fixed Utilization</p>
          </div>
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Availability Buffer</p>
            <p className="text-sm font-black text-white">12.5% Weighted Shrinkage</p>
          </div>
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sync Region</p>
            <p className="text-sm font-black text-white">Baghdad (UTC+3)</p>
          </div>
          <div className="space-y-2 p-6 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Processing Logic</p>
            <p className="text-sm font-black text-white">Linear Intensity Mapping</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerTab;

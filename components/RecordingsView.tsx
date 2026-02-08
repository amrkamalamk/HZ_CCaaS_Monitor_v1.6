
import React, { useMemo } from 'react';
import { InteractionRecord } from '../types';

interface Props {
  recordings: InteractionRecord[];
  fromTime: string;
  toTime: string;
  setFromTime: (t: string) => void;
  setToTime: (t: string) => void;
  onRefresh: () => void;
}

const RecordingsView: React.FC<Props> = ({ recordings, fromTime, toTime, setFromTime, setToTime, onRefresh }) => {
  const REDIRECT_URL = 'https://login.mec1.pure.cloud/?rid=cVXEiT6UVtjG1NboW8cF02ruPKsizt9N7gR_m_IwiRA#/authenticate-adv/org/horizonscope-cx2';

  const baghdadTimeFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baghdad',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }), []);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const handlePlay = () => {
    window.open(REDIRECT_URL, '_blank');
  };

  const setTimeRange = (minutes: number) => {
     const now = new Date();
     const start = new Date(now.getTime() - minutes * 60000);
     
     const getBaghdadTimeString = (date: Date) => {
        const parts = new Intl.DateTimeFormat('en-US', {
           timeZone: 'Asia/Baghdad',
           hour: '2-digit',
           minute: '2-digit',
           hourCycle: 'h23'
        }).formatToParts(date);
        const h = parts.find(p => p.type === 'hour')?.value || '00';
        const m = parts.find(p => p.type === 'minute')?.value || '00';
        return `${h}:${m}`;
     };

     setFromTime(getBaghdadTimeString(start));
     setToTime(getBaghdadTimeString(now));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-1 w-full">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-microphone text-emerald-500"></i> Call Recordings Terminal
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Select 15-minute window or use quick filters
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400">From</label>
            <input 
              type="time" 
              value={fromTime} 
              onChange={e => setFromTime(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400">To</label>
            <input 
              type="time" 
              value={toTime} 
              onChange={e => setToTime(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button 
            onClick={onRefresh}
            className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/10"
          >
            Fetch Range
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <button 
            onClick={() => setTimeRange(15)}
            className="px-3 py-2 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-xl hover:bg-slate-200 transition-all"
          >
            Last 15m
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 border-b border-slate-200">Interaction ID</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Time (Baghdad)</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Direction</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Duration</th>
                <th className="px-6 py-4 border-b border-slate-200 text-center">Playback</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {recordings.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 border-b border-slate-100 font-mono text-[10px] text-slate-400">{rec.id}</td>
                  <td className="px-6 py-4 border-b border-slate-100 text-center font-bold text-slate-900">
                    {baghdadTimeFormatter.format(rec.startTime)}
                  </td>
                  <td className="px-6 py-4 border-b border-slate-100 text-center">
                    <span className={`px-2 py-1 rounded-md font-black uppercase text-[9px] ${rec.direction === 'Inbound' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {rec.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-slate-100 text-center font-medium text-slate-600">
                    {formatDuration(rec.durationMs)}
                  </td>
                  <td className="px-6 py-4 border-b border-slate-100 text-center">
                    <button 
                      onClick={handlePlay}
                      className="w-10 h-10 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center mx-auto"
                      title="Playback in Genesys"
                    >
                      <i className="fa-solid fa-play text-[10px]"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {recordings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <i className="fa-solid fa-satellite-dish text-5xl"></i>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                        No interactions found for this period
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50 flex items-start gap-4">
        <i className="fa-solid fa-lock text-emerald-500 mt-1"></i>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Organization Portal Sync</p>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Recording media for <strong>horizonscope-cx2</strong> is protected. Playback requires an active authenticated session in the UAE (mec1) Cloud. Clicking Play will direct you to the secure playback interface.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordingsView;

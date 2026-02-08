'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UnifiedDataPoint, AgentPerformance, CallerData, InteractionRecord } from '../types';
import { 
  MOS_THRESHOLD_DEFAULT, 
  POLLING_INTERVAL_MS,
  QUEUE_NAME_DEFAULT 
} from '../constants';
import { fetchRealtimeMetrics, getQueueIdByName, fetchRecentInteractions } from '../services/genesysService';
import { analyzeMOSPerformance } from '../services/geminiService';

// Dynamic imports for components that use Recharts to avoid SSR issues
import dynamic from 'next/dynamic';
const MOSChart = dynamic(() => import('../components/MOSChart'), { ssr: false });
const UnifiedDashboardChart = dynamic(() => import('../components/UnifiedDashboardChart'), { ssr: false });
const AgentPerformanceTable = dynamic(() => import('../components/AgentPerformanceTable'), { ssr: false });

type TabType = 'interval' | 'daily';
type SubTabType = 'summary' | 'charts' | 'agents' | 'recordings' | 'aiforensics';

const getRAGColor = (type: 'mos' | 'sl' | 'abandoned', value: number | null, offered?: number) => {
  if (value === null) return 'text-slate-400';
  if (type === 'mos') return value < 4.3 ? 'text-rose-600' : value < 4.7 ? 'text-amber-500' : 'text-emerald-600';
  if (type === 'sl') return value < 80 ? 'text-rose-600' : value < 90 ? 'text-amber-500' : 'text-emerald-600';
  if (type === 'abandoned') { 
    const percent = offered && offered > 0 ? (value / offered) * 100 : 0; 
    return percent > 10 ? 'text-rose-600' : percent > 5 ? 'text-amber-500' : 'text-emerald-600'; 
  }
  return 'text-slate-900';
}

const KPIBox = ({ label, value, icon, color, bg = "bg-white" }: { label: string, value: React.ReactNode, icon: string, color: string, bg?: string }) => (
  <div className={`${bg} p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-slate-50`}>
      <i className={`fa-solid ${icon} ${color} text-sm`}></i>
    </div>
    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">{label}</p>
    <div className={`text-lg font-black tracking-tight truncate w-full ${color}`}>{value}</div>
  </div>
);

export default function Home() {
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [unifiedHistory, setUnifiedHistory] = useState<UnifiedDataPoint[]>([]);
  const [agentStats, setAgentStats] = useState<AgentPerformance[]>([]);
  const [recordings, setRecordings] = useState<InteractionRecord[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('summary');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    queueName: QUEUE_NAME_DEFAULT, threshold: MOS_THRESHOLD_DEFAULT,
  });

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activeQueueId) return;
    setIsFetching(true);
    try {
      // Fix: Removed 'null' credentials and extra empty string argument to match Genesys service signature
      const metrics = await fetchRealtimeMetrics(activeQueueId, selectedDate);
      setUnifiedHistory(metrics.history || []);
      setAgentStats(metrics.agents || []);
      
      // Fix: Removed 'null' credentials argument to match fetchRecentInteractions signature
      const recs = await fetchRecentInteractions(activeQueueId);
      setRecordings(recs);
    } catch (err: any) { 
      setError(err.message);
    } finally { setIsFetching(false); }
  }, [activeQueueId, selectedDate]);

  useEffect(() => {
    if (activeQueueId) {
      fetchData();
      const interval = setInterval(fetchData, POLLING_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [activeQueueId, fetchData]);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      // Fix: Removed 'null' credentials argument to match getQueueIdByName signature
      const { queueId } = await getQueueIdByName(formData.queueName.trim());
      setActiveQueueId(queueId); 
      setIsConfigOpen(false);
    } catch (err: any) { 
       setError(err.message); 
    }
  };

  const handleRunAiAnalysis = async () => {
    try {
      setIsAiAnalyzing(true);
      setAiAnalysisResult(null);
      const result = await analyzeMOSPerformance(unifiedHistory.map(h => ({
        timestamp: h.timestamp,
        mos: h.mos || 0,
        conversationsCount: h.conversationsCount
      })));
      setAiAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "AI Analysis failed.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const metricsSummary = useMemo(() => {
    const totalOffered = unifiedHistory.reduce((acc, d) => acc + d.offered, 0);
    const totalAnswered = unifiedHistory.reduce((acc, d) => acc + d.answered, 0);
    const totalAbandoned = unifiedHistory.reduce((acc, d) => acc + d.abandoned, 0);
    const totalAgents = agentStats.length;
    const avgSL = totalOffered > 0 ? (unifiedHistory.reduce((acc, d) => acc + (d.slPercent || 0), 0) / unifiedHistory.length) : 0;
    const avgMOS = totalOffered > 0 ? (unifiedHistory.reduce((acc, d) => acc + (d.mos || 0), 0) / (unifiedHistory.filter(h => h.mos !== null).length || 1)) : 0;
    const avgAHT = totalAnswered > 0 ? (unifiedHistory.reduce((acc, d) => acc + (d.aht || 0), 0) / (unifiedHistory.filter(h => h.aht !== null).length || 1)) : 0;

    return { mos: avgMOS, sl: avgSL, offered: totalOffered, answered: totalAnswered, abandoned: totalAbandoned, agents: totalAgents, aht: avgAHT };
  }, [unifiedHistory, agentStats]);

  const subTabLabels: Record<SubTabType, string> = { 
    summary: 'Summary', 
    charts: 'Charts', 
    agents: 'Agents', 
    recordings: 'Recordings', 
    aiforensics: 'AI Forensics' 
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isFetching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Syncing Mawsool...</p>
          </div>
        </div>
      )}

      <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Mawsool</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Horizonscope-CX2 Secure Hub</p>
          </div>
        </div>
        {!isConfigOpen && (
          <div className="flex items-center gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none" />
            <button onClick={() => setIsConfigOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"><i className="fa-solid fa-gear"></i></button>
          </div>
        )}
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {isConfigOpen ? (
          <div className="max-w-md mx-auto py-20">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 text-center">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Initialize Hub</h2>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-8">Secure Backend Bridge</p>
              <form onSubmit={handleConnect} className="space-y-6 text-left">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Queue Name</label>
                  <input type="text" value={formData.queueName} onChange={e => setFormData({...formData, queueName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none focus:border-emerald-500" />
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20">Connect Secure Feed</button>
                {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold text-center">{error}</div>}
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {(Object.keys(subTabLabels) as SubTabType[]).map(st => (
                <button key={st} onClick={() => setActiveSubTab(st)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${activeSubTab === st ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                  {subTabLabels[st]}
                </button>
              ))}
            </div>

            {activeSubTab === 'summary' && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <KPIBox label="Avg MOS" value={metricsSummary.mos.toFixed(2)} icon="fa-microphone-lines" color={getRAGColor('mos', metricsSummary.mos)} />
                <KPIBox label="SL%" value={`${metricsSummary.sl.toFixed(1)}%`} icon="fa-bolt" color={getRAGColor('sl', metricsSummary.sl)} />
                <KPIBox label="Offered" value={metricsSummary.offered} icon="fa-phone-volume" color="text-slate-900" />
                <KPIBox label="Answered" value={metricsSummary.answered} icon="fa-headset" color="text-slate-900" />
                <KPIBox label="Abandoned" value={metricsSummary.abandoned} icon="fa-phone-slash" color={getRAGColor('abandoned', metricsSummary.abandoned, metricsSummary.offered)} />
                <KPIBox label="AHT" value={`${metricsSummary.aht.toFixed(0)}s`} icon="fa-clock" color="text-slate-900" />
                <KPIBox label="Agents" value={metricsSummary.agents} icon="fa-users" color="text-slate-900" />
              </div>
            )}

            {activeSubTab === 'charts' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-black uppercase text-slate-900 mb-6">Voice Quality Trend (MOS)</h4>
                  <MOSChart data={unifiedHistory} threshold={formData.threshold} />
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[450px]">
                  <h4 className="text-xs font-black uppercase text-slate-900 mb-6">Traffic & Service Levels</h4>
                  <UnifiedDashboardChart data={unifiedHistory} />
                </div>
              </div>
            )}

            {activeSubTab === 'agents' && (
              <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
                <AgentPerformanceTable agents={agentStats} />
              </div>
            )}

            {activeSubTab === 'aiforensics' && (
              <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                  <i className="fa-solid fa-brain text-3xl"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Quality Forensic Analysis</h3>
                {aiAnalysisResult ? (
                  <div className="max-w-4xl mx-auto text-left prose prose-slate">
                    <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed bg-slate-50 p-8 rounded-2xl border border-slate-100">{aiAnalysisResult}</div>
                    <button onClick={() => setAiAnalysisResult(null)} className="mt-8 px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase">New Analysis</button>
                  </div>
                ) : (
                  <button onClick={handleRunAiAnalysis} disabled={isAiAnalyzing} className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-600 transition-all">
                    {isAiAnalyzing ? 'Analyzing Network Telemetry...' : 'Execute Forensic Analysis'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-300">
        <span>Secure Org Port: 443 (TLS)</span>
        <span>© 2025 Mawsool Hub</span>
      </footer>
    </div>
  );
}

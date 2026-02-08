
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UnifiedDataPoint, AgentPerformance, InteractionRecord } from './types';
import { 
  MOS_THRESHOLD_DEFAULT, 
  POLLING_INTERVAL_MS,
  QUEUE_NAME_DEFAULT 
} from './constants';
import { fetchRealtimeMetrics, getQueueIdByName, fetchRecentInteractions } from './services/genesysService';
import { analyzeMOSPerformance } from './services/geminiService';
import MOSChart from './components/MOSChart';
import UnifiedDashboardChart from './components/UnifiedDashboardChart';
import AgentPerformanceTable from './components/AgentPerformanceTable';

type SubTabType = 'summary' | 'charts' | 'agents' | 'aiforensics';

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

const KPIBox = ({ label, value, icon, color }: { label: string, value: React.ReactNode, icon: string, color: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md">
    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-slate-50">
      <i className={`fa-solid ${icon} ${color} text-sm`}></i>
    </div>
    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">{label}</p>
    <div className={`text-lg font-black tracking-tight truncate w-full ${color}`}>{value}</div>
  </div>
);

const App: React.FC = () => {
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [unifiedHistory, setUnifiedHistory] = useState<UnifiedDataPoint[]>([]);
  const [agentStats, setAgentStats] = useState<AgentPerformance[]>([]);
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
      const metrics = await fetchRealtimeMetrics(activeQueueId, selectedDate);
      setUnifiedHistory(metrics.history || []);
      setAgentStats(metrics.agents || []);
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
      const { queueId } = await getQueueIdByName(formData.queueName.trim());
      setActiveQueueId(queueId); 
      setIsConfigOpen(false);
    } catch (err: any) { 
       setError(err.message); 
    }
  };

  const metricsSummary = useMemo(() => {
    const totalOffered = unifiedHistory.reduce((acc, d) => acc + d.offered, 0);
    const totalAnswered = unifiedHistory.reduce((acc, d) => acc + d.answered, 0);
    const totalAbandoned = unifiedHistory.reduce((acc, d) => acc + d.abandoned, 0);
    const avgSL = totalOffered > 0 ? (unifiedHistory.reduce((acc, d) => acc + (d.slPercent || 0), 0) / unifiedHistory.length) : 0;
    const avgMOS = totalOffered > 0 ? (unifiedHistory.reduce((acc, d) => acc + (d.mos || 0), 0) / (unifiedHistory.filter(h => h.mos !== null).length || 1)) : 0;
    const avgAHT = totalAnswered > 0 ? (unifiedHistory.reduce((acc, d) => acc + (d.aht || 0), 0) / (unifiedHistory.filter(h => h.aht !== null).length || 1)) : 0;

    return { mos: avgMOS, sl: avgSL, offered: totalOffered, answered: totalAnswered, abandoned: totalAbandoned, agents: agentStats.length, aht: avgAHT };
  }, [unifiedHistory, agentStats]);

  const handleRunAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const result = await analyzeMOSPerformance(unifiedHistory.map(h => ({
        timestamp: h.timestamp,
        mos: h.mos || 0,
        conversationsCount: h.conversationsCount
      })));
      setAiAnalysisResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isFetching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <header className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Mawsool</h1>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">UAE Operations Center</p>
          </div>
        </div>
        {!isConfigOpen && (
          <div className="flex items-center gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" />
            <button onClick={() => setIsConfigOpen(true)} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"><i className="fa-solid fa-gear"></i></button>
          </div>
        )}
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {isConfigOpen ? (
          <div className="max-w-md mx-auto py-20">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 text-center">
              <h2 className="text-2xl font-black text-slate-900 mb-8">Initialize Secure Hub</h2>
              <form onSubmit={handleConnect} className="space-y-6 text-left">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Queue Name</label>
                  <input type="text" value={formData.queueName} onChange={e => setFormData({...formData, queueName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-1 outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl shadow-lg">Connect Feed</button>
                {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold text-center">{error}</div>}
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(['summary', 'charts', 'agents', 'aiforensics'] as SubTabType[]).map(st => (
                <button key={st} onClick={() => setActiveSubTab(st)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${activeSubTab === st ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {st}
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
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><MOSChart data={unifiedHistory} threshold={formData.threshold} /></div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px]"><UnifiedDashboardChart data={unifiedHistory} /></div>
              </div>
            )}

            {activeSubTab === 'agents' && <AgentPerformanceTable agents={agentStats} />}

            {activeSubTab === 'aiforensics' && (
              <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center space-y-8">
                <i className="fa-solid fa-brain text-emerald-500 text-4xl"></i>
                <h3 className="text-xl font-black text-slate-900 uppercase">Quality Forensics</h3>
                {aiAnalysisResult ? (
                  <div className="text-left text-sm text-slate-600 bg-slate-50 p-8 rounded-2xl whitespace-pre-wrap leading-relaxed">{aiAnalysisResult}</div>
                ) : (
                  <button onClick={handleRunAiAnalysis} disabled={isAiAnalyzing} className="px-12 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px]">
                    {isAiAnalyzing ? 'Analyzing Network...' : 'Execute AI Analysis'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="p-6 text-[10px] font-bold uppercase tracking-widest text-slate-300 text-center">
        © 2025 Mawsool Hub • Internal Operational Telemetry
      </footer>
    </div>
  );
};

export default App;

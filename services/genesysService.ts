
import { UnifiedDataPoint, AgentPerformance, InteractionRecord } from "../types";

const LOCAL_PROXY_URL = '/api/genesys/proxy';
const SL_THRESHOLD_MS = 10000;

/**
 * Frontend helper to call the local Next.js API proxy
 */
async function genesysFetch(path: string, options: RequestInit = {}) {
  const url = `${LOCAL_PROXY_URL}?path=${encodeURIComponent(path)}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Local Proxy Error: ${res.status}`);
  }
  return res.json();
}

const getBaghdadInfo = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baghdad',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0';
  const hour = parseInt(get('hour'));
  const minute = parseInt(get('minute'));
  const day = get('day');
  const month = get('month');
  const year = get('year');
  return {
    hour,
    minute,
    intervalKey: `${year}-${month}-${day} ${hour.toString().padStart(2, '0')}:${minute >= 30 ? '30' : '00'}`
  };
};

export const getQueueIdByName = async (queueName: string) => {
  const data = await genesysFetch(`/api/v2/routing/queues?name=${encodeURIComponent(queueName.trim())}`);
  const queue = data.entities?.find((q: any) => q.name.toLowerCase() === queueName.toLowerCase());
  if (queue) return { queueId: queue.id };
  throw new Error(`Queue '${queueName}' not found in UAE organization.`);
};

export const fetchRealtimeMetrics = async (queueId: string, startDateStr?: string) => {
  const startStr = startDateStr || new Date().toISOString().split('T')[0];
  const current = new Date(startStr);
  const shiftStart = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate(), 6, 0, 0)); 
  const shiftEnd = new Date(shiftStart.getTime() + (21 * 60 * 60 * 1000)); 
  const interval = `${shiftStart.toISOString().split('.')[0]}Z/${shiftEnd.toISOString().split('.')[0]}Z`;

  const buckets: Record<string, any> = {};
  const agentMap: Record<string, AgentPerformance> = {};

  const data = await genesysFetch(`/api/v2/analytics/conversations/details/query`, {
    method: 'POST',
    body: JSON.stringify({ 
      interval: interval, 
      paging: { pageSize: 100, pageNumber: 1 }, 
      segmentFilters: [{ type: "and", predicates: [{ type: "dimension", dimension: "queueId", operator: "matches", value: queueId }] }] 
    })
  });

  (data.conversations || []).forEach((conv: any) => {
    const startRaw = new Date(conv.conversationStart);
    const { hour, intervalKey } = getBaghdadInfo(startRaw);
    if (hour >= 3 && hour < 9) return;

    if (!buckets[intervalKey]) {
      buckets[intervalKey] = { offered: 0, answered: 0, slMet: 0, abandoned: 0, mosSum: 0, mosCount: 0, hSum: 0, hCount: 0 };
    }
    
    buckets[intervalKey].offered += 1;

    conv.participants?.forEach((p: any) => {
      p.sessions?.forEach((s: any) => {
        if (s.mediaType === 'voice') {
          s.mediaEndpointStats?.forEach((stat: any) => {
            const score = stat.mos || stat.minMos;
            if (score > 0) { buckets[intervalKey].mosSum += score; buckets[intervalKey].mosCount += 1; }
          });
        }
      });
    });

    let convAnswered = false;
    let convSlMet = false;

    conv.participants?.forEach((p: any) => {
      if ((p.purpose === 'agent' || p.purpose === 'user') && p.userId) {
        if (!agentMap[p.userId]) agentMap[p.userId] = { userId: p.userId, name: 'Agent', answered: 0, missed: 0, handleTimeMs: 0, firstActivity: null, lastActivity: null };
        const agentRec = agentMap[p.userId];
        p.sessions?.forEach((s: any) => {
          s.segments?.forEach((seg: any) => {
            if (['interact', 'talk', 'hold'].includes(seg.segmentType)) {
              convAnswered = true;
              const ss = new Date(seg.segmentStart), se = seg.segmentEnd ? new Date(seg.segmentEnd) : new Date();
              const dur = se.getTime() - ss.getTime();
              buckets[intervalKey].hSum += dur;
              agentRec.handleTimeMs += dur;
              if (seg.segmentType === 'interact' && (ss.getTime() - startRaw.getTime() <= SL_THRESHOLD_MS)) convSlMet = true;
            }
          });
        });
        agentMap[p.userId].answered += 1;
      }
    });

    if (convAnswered) {
      buckets[intervalKey].answered += 1;
      buckets[intervalKey].hCount += 1;
      if (convSlMet) buckets[intervalKey].slMet += 1;
    } else {
      buckets[intervalKey].abandoned += 1;
    }
  });

  const history = Object.keys(buckets).sort().map(k => ({
    timestamp: k, offered: buckets[k].offered, answered: buckets[k].answered, abandoned: buckets[k].abandoned,
    slPercent: buckets[k].offered > 0 ? (buckets[k].slMet / buckets[k].offered) * 100 : null,
    mos: buckets[k].mosCount > 0 ? buckets[k].mosSum / buckets[k].mosCount : null,
    aht: buckets[k].hCount > 0 ? (buckets[k].hSum / 1000) / buckets[k].hCount : null,
    agentsCount: 0, conversationsCount: buckets[k].offered
  }));

  return { history, agents: Object.values(agentMap) };
};

export const fetchRecentInteractions = async (queueId: string): Promise<InteractionRecord[]> => {
  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000); 
  const interval = `${start.toISOString().split('.')[0]}Z/${now.toISOString().split('.')[0]}Z`;

  const data = await genesysFetch(`/api/v2/analytics/conversations/details/query`, {
    method: 'POST',
    body: JSON.stringify({ 
      interval: interval, 
      paging: { pageSize: 50, pageNumber: 1 },
      segmentFilters: [{ type: "and", predicates: [{ type: "dimension", dimension: "queueId", operator: "matches", value: queueId }] }] 
    })
  });

  return (data.conversations || []).map((conv: any) => ({
    id: conv.conversationId,
    startTime: new Date(conv.conversationStart),
    direction: 'Inbound',
    durationMs: conv.conversationEnd ? new Date(conv.conversationEnd).getTime() - new Date(conv.conversationStart).getTime() : 0
  }));
};

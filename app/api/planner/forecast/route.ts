import { NextResponse } from 'next/server';
import { getGenesysToken } from '../../genesys/_lib/genesysAuth';

export async function GET() {
  try {
    const { token, region } = await getGenesysToken();

    // Interval: Last 14 full days
    const now = new Date();
    const start = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
    const interval = `${start.toISOString().split('.')[0]}Z/${now.toISOString().split('.')[0]}Z`;

    const query = {
      interval: interval,
      granularity: "PT1H",
      metrics: ["nAnswered", "tHandle"],
      groupBy: ["queueId"]
    };

    const aggRes = await fetch(`https://api.${region}/api/v2/analytics/conversations/aggregates/query`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(query)
    });

    if (!aggRes.ok) throw new Error('Analytics aggregate query failed.');
    const data = await aggRes.json();
    const results = data.results || [];

    const historyMap: Record<string, any> = {}; 

    results.forEach((group: any) => {
      (group.data || []).forEach((bucket: any) => {
        const utcDate = new Date(bucket.interval.split('/')[0]);
        const bagDate = new Date(utcDate.getTime() + (3 * 60 * 60 * 1000));
        const hour = bagDate.getUTCHours();
        
        if (hour >= 3 && hour < 9) return;

        let dow = bagDate.getUTCDay();
        if (hour < 3) {
          dow = (dow + 6) % 7; 
        }

        const metrics = bucket.metrics || [];
        const answered = metrics.find((m: any) => m.metric === 'nAnswered')?.stats?.count || 0;
        const tHandle = metrics.find((m: any) => m.metric === 'tHandle')?.stats?.sum || 0;
        const hCount = metrics.find((m: any) => m.metric === 'tHandle')?.stats?.count || 0;

        const key = `${dow}-${hour}`;
        if (!historyMap[key]) historyMap[key] = { answered: 0, tHandle: 0, hCount: 0 };
        
        historyMap[key].answered += answered;
        historyMap[key].tHandle += tHandle;
        historyMap[key].hCount += hCount;
      });
    });

    const forecast = [];
    const operatingHours = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2];

    for (let d = 0; d < 7; d++) {
      for (const h of operatingHours) {
        const key = `${d}-${h}`;
        const stats = historyMap[key];
        const avgAnswered = stats ? (stats.answered / 2) : 0;
        const avgAht = stats && stats.hCount > 0 ? (stats.tHandle / 1000 / stats.hCount) : 0;
        const intensity = (avgAnswered * avgAht) / 3600;
        const required = Math.ceil(intensity * 1.3);

        forecast.push({
          hour: h,
          dayOfWeek: d,
          requiredAgents: Math.max(required, 2),
          avgCalls: Math.round(avgAnswered * 10) / 10,
          avgAht: Math.round(avgAht)
        });
      }
    }

    return NextResponse.json({
      intervals: forecast,
      generatedAt: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Forecast engine failure', details: err.message }, { status: 500 });
  }
}
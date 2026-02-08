
import React, { useMemo } from 'react';
import { CustomerConversation, CustomerSummaryRow } from '../types';

interface AbandonedCustomerRow {
  businessDay: string;
  mobileNumber: string;
  abandonedTime: string;
  rawAbandonedTime: number;
  recovered: 'YES' | 'NO';
  recoveredTime: string;
  abandonedCount: number;
}

interface Props {
  conversations: CustomerConversation[];
}

const CustomersTab: React.FC<Props> = ({ conversations }) => {
  // Baghdad Formatter
  const baghdadTimeFormatter = useMemo(() => new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baghdad',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }), []);

  // Ensure strict timestamp ordering
  const sortedConvs = useMemo(() => 
    [...conversations].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  , [conversations]);

  const analysis = useMemo(() => {
    const dailySummary: Record<string, CustomerSummaryRow> = {};
    const abandonedCustomerDetails: AbandonedCustomerRow[] = [];
    
    // Group by Business Day and then ANI
    const groupedByDayAndCustomer: Record<string, Record<string, CustomerConversation[]>> = {};
    
    sortedConvs.forEach(conv => {
      if (!groupedByDayAndCustomer[conv.businessDay]) groupedByDayAndCustomer[conv.businessDay] = {};
      if (!groupedByDayAndCustomer[conv.businessDay][conv.ani]) groupedByDayAndCustomer[conv.businessDay][conv.ani] = [];
      groupedByDayAndCustomer[conv.businessDay][conv.ani].push(conv);
    });

    const bizDays = Object.keys(groupedByDayAndCustomer).sort();

    bizDays.forEach(day => {
      let offered = 0, answered = 0, abandoned = 0;
      let uniqueTotal = 0, uniqueAnswered = 0, uniqueAbandoned = 0;
      let recoveredCount = 0, lostCount = 0;

      const dayCustomers = groupedByDayAndCustomer[day];
      uniqueTotal = Object.keys(dayCustomers).length;

      Object.entries(dayCustomers).forEach(([ani, convs]) => {
        offered += convs.length;
        const ansConvs = convs.filter(c => !c.abandoned);
        answered += ansConvs.length;
        const abndConvs = convs.filter(c => c.abandoned);
        abandoned += abndConvs.length;

        const firstAbandonedConv = abndConvs[0];
        
        if (firstAbandonedConv) {
          uniqueAbandoned++;
          
          let isRecovered = false;
          let recoveryTimestamp = '';

          // Look for an answered call AFTER the first abandonment in this business day
          const recoveryCall = convs.find(c => !c.abandoned && c.startTime > firstAbandonedConv.startTime);
          
          if (recoveryCall) {
            isRecovered = true;
            recoveryTimestamp = baghdadTimeFormatter.format(recoveryCall.startTime);
          }

          if (isRecovered) recoveredCount++;
          else lostCount++;

          abandonedCustomerDetails.push({
            businessDay: day,
            mobileNumber: ani,
            abandonedTime: baghdadTimeFormatter.format(firstAbandonedConv.startTime),
            rawAbandonedTime: firstAbandonedConv.startTime.getTime(),
            recovered: isRecovered ? 'YES' : 'NO',
            recoveredTime: recoveryTimestamp,
            abandonedCount: abndConvs.length
          });
        }
      });

      uniqueAnswered = uniqueTotal - uniqueAbandoned;

      dailySummary[day] = {
        businessDay: day,
        offered, answered, abandoned,
        uniqueTotal, uniqueAnswered, uniqueAbandoned,
        recovered: recoveredCount,
        lost: lostCount
      };
    });

    return { 
      summary: Object.values(dailySummary).sort((a, b) => b.businessDay.localeCompare(a.businessDay)), 
      details: abandonedCustomerDetails.sort((a, b) => b.rawAbandonedTime - a.rawAbandonedTime) 
    };
  }, [sortedConvs, baghdadTimeFormatter]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-users text-emerald-500"></i> Daily Customer Summary
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            Shift: 09:00 - 03:00 Baghdad Time
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 border-b border-slate-200">Business Day</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Offered</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Answered</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Abandoned</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Unique Customer Total</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Unique Customer Answered</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Unique Customer Abandoned</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Recovered Customers</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Lost Customers</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {analysis.summary.map((row) => (
                  <tr key={row.businessDay} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">{row.businessDay}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-medium">{row.offered}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-black text-emerald-600">{row.answered}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-black text-rose-600">{row.abandoned}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-medium">{row.uniqueTotal}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-bold text-emerald-600">{row.uniqueAnswered}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-bold text-rose-600">{row.uniqueAbandoned}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-black">{row.recovered}</span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md font-black">{row.lost}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <i className="fa-solid fa-phone-slash text-rose-500"></i> Unique Abandoned Customers List
        </h3>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 border-b border-slate-200">Business Day</th>
                  <th className="px-6 py-4 border-b border-slate-200">Mobile Number</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Abandoned Count</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">First Abandoned Time</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Recovered (YES/NO)</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-center">Recovered Call Time</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {analysis.details.map((row, idx) => (
                  <tr key={`${row.businessDay}-${row.mobileNumber}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 border-b border-slate-100 text-slate-500 font-medium">{row.businessDay}</td>
                    <td className="px-6 py-4 border-b border-slate-100 font-black text-slate-900">{row.mobileNumber}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-black text-[10px] border border-slate-200">
                        {row.abandonedCount} calls
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-bold text-rose-600">{row.abandonedTime}</td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <span className={`px-2 py-1 rounded-md font-black ${row.recovered === 'YES' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {row.recovered}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center font-bold text-emerald-600">{row.recoveredTime || '—'}</td>
                  </tr>
                ))}
                {analysis.details.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest opacity-40">
                      No abandoned customers to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersTab;

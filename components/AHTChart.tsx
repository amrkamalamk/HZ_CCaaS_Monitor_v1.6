import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { UnifiedDataPoint } from '../types';

interface Props {
  data: UnifiedDataPoint[];
}

const AHTChart: React.FC<Props> = ({ data }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const tooltipTextColor = '#000000';
  const tooltipBgColor = '#ffffff';

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
          <defs>
            <linearGradient id="colorAht" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
          <XAxis 
            dataKey="timestamp" 
            stroke={isDark ? "#64748b" : "#94a3b8"} 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={2}
            angle={270}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke={isDark ? "#64748b" : "#94a3b8"} 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${Math.round(val)}s`}
          />
          <Tooltip 
            cursor={{stroke: isDark ? '#475569' : '#e2e8f0', strokeWidth: 1}}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              backgroundColor: tooltipBgColor,
              color: tooltipTextColor
            }}
            labelStyle={{ color: tooltipTextColor }}
            itemStyle={{ color: tooltipTextColor }}
            formatter={(value: number) => [`${Number.isInteger(value) ? value : value.toFixed(2)}s`, 'Avg Handle Time']}
          />
          <Area 
            type="monotone" 
            dataKey="aht" 
            stroke="#f59e0b" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAht)" 
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AHTChart;
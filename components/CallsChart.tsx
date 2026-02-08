import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { UnifiedDataPoint } from '../types';

interface Props {
  data: UnifiedDataPoint[];
}

const CallsChart: React.FC<Props> = ({ data }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const tooltipTextColor = '#000000';
  const tooltipBgColor = '#ffffff';

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: -35, right: 10, left: -20, bottom: 60 }}>
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
            height={70}
          />
          <YAxis 
            stroke={isDark ? "#64748b" : "#94a3b8"} 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
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
            formatter={(value: number) => Number.isInteger(value) ? value : value.toFixed(2)}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            payload={[
              { value: 'Answered', type: 'circle', id: 'answered', color: '#10b981' },
              { value: 'Abandoned', type: 'circle', id: 'abandoned', color: '#f43f5e' }
            ]}
            wrapperStyle={{ 
              fontSize: '8px', 
              fontWeight: '900', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDark ? '#94a3b8' : '#64748b',
              top: -45 
            }}
          />
          <Bar dataKey="answered" name="Answered" stackId="traffic" fill="#10b981" barSize={12} />
          <Bar dataKey="abandoned" name="Abandoned" stackId="traffic" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="offered" name="Offered" fill="transparent" hide />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CallsChart;
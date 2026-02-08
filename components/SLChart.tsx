import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { UnifiedDataPoint } from '../types';

interface Props {
  data: UnifiedDataPoint[];
}

const SLChart: React.FC<Props> = ({ data }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const target = 90;
  const tooltipTextColor = '#000000';
  const tooltipBgColor = '#ffffff';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
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
            domain={[0, 100]}
            stroke={isDark ? "#64748b" : "#94a3b8"} 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
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
            formatter={(value: number) => [`${Number.isInteger(value) ? value : value.toFixed(2)}%`, 'Service Level']}
          />
          <ReferenceLine 
            y={target} 
            stroke={isDark ? "#10b981" : "#059669"} 
            strokeDasharray="3 3" 
            label={{ position: 'right', value: '90% Goal', fill: '#10b981', fontSize: 8, fontWeight: 'bold' }} 
          />
          <Bar dataKey="slPercent" radius={[4, 4, 0, 0]} barSize={12}>
            {data.map((entry, index) => {
              const val = entry.slPercent;
              const color = val === null ? '#10b981' :
                            val < 80 ? '#ef4444' :
                            val < 90 ? '#f59e0b' :
                            '#10b981';
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={color} 
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SLChart;
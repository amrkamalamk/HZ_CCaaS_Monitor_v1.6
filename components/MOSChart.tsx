import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
  TooltipProps
} from 'recharts';
import { UnifiedDataPoint } from '../types';

interface Props {
  data: UnifiedDataPoint[];
  threshold: number;
}

const MOSChart: React.FC<Props> = ({ data, threshold }) => {
  const tooltipTextColor = '#0f172a';
  const tooltipBgColor = '#ffffff';

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#94a3b8" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={2}
            angle={270}
            textAnchor="end"
            height={70}
          />
          <YAxis 
            domain={[0, 5]} 
            stroke="#94a3b8" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(1) : '')}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: 12,
              backgroundColor: tooltipBgColor,
              color: tooltipTextColor,
            }}
            labelStyle={{ color: tooltipTextColor, fontWeight: 'bold' }}
            itemStyle={{ color: tooltipTextColor }}
            formatter={(value: number | string | undefined) =>
              [`${typeof value === 'number' ? value.toFixed(2) : 'No Telemetry'}`, 'MOS Score'] as [string, string]
            }
          />
          <ReferenceLine 
            y={threshold} 
            stroke="#f43f5e" 
            strokeDasharray="4 4" 
            strokeWidth={1}
            label={{ position: 'right', value: `Goal ${threshold}`, fill: '#f43f5e', fontSize: 9, fontWeight: 'bold' }} 
          />
          <Bar dataKey="mos" radius={[4, 4, 0, 0]} barSize={12}>
            {data.map((entry, index) => {
              const val = entry.mos;
              if (val === null || val === undefined) return <Cell key={`cell-${index}`} fill="transparent" />;
              const color = val < 4.3 ? '#f43f5e' :
                            val < 4.7 ? '#f59e0b' :
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

export default MOSChart;

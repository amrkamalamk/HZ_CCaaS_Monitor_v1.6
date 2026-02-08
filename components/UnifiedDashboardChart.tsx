
import React from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { UnifiedDataPoint } from '../types';

interface Props {
  data: UnifiedDataPoint[];
}

const CustomDot = (props: any) => {
  const { cx, cy, value } = props;
  if (value === null || value === undefined) return null;
  const color = value < 80 ? '#f43f5e' : value < 90 ? '#f59e0b' : '#10b981';
  return (
    <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={1} />
  );
};

const UnifiedDashboardChart: React.FC<Props> = ({ data }) => {
  const tooltipTextColor = '#0f172a';
  const tooltipBgColor = '#ffffff';

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
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
            height={80}
          />
          <YAxis 
            yAxisId="left"
            stroke="#94a3b8" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            stroke="#94a3b8" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip 
            cursor={{fill: '#f8fafc'}}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              backgroundColor: tooltipBgColor,
              color: tooltipTextColor
            }}
            labelStyle={{ color: tooltipTextColor, fontWeight: 'bold' }}
            itemStyle={{ color: tooltipTextColor }}
            formatter={(value: number, name: string) => [value ? (Number.isInteger(value) ? value.toString() : value.toFixed(1)) + (name === 'SL%' ? '%' : '') : '0', name]}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              paddingBottom: '20px',
              color: '#64748b'
            }}
          />
          
          <Bar yAxisId="left" dataKey="answered" name="Answered" stackId="traffic" fill="#10b981" barSize={18} fillOpacity={0.8} />
          <Bar yAxisId="left" dataKey="abandoned" name="Abandoned" stackId="traffic" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={18} fillOpacity={0.8} />
          
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="slPercent" 
            name="SL%" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            dot={<CustomDot />}
            connectNulls
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UnifiedDashboardChart;

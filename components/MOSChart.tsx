import React from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell 
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
            tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : ''}
          />
          <Tooltip 
            cursor={{fill: '#f1f5f9'}}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              backgroundColor: tooltipBgColor,
              color: tooltipTextColor
            }}
            labelStyle={{ color:

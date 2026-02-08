import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { CallerData } from '../types';

interface Props {
  data: CallerData[];
}

const TopCallersChart: React.FC<Props> = ({ data }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const tooltipTextColor = '#000000';
  const tooltipBgColor = '#ffffff';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = [...data].slice(0, 10);
  const leftMargin = isMobile ? 90 : 140;
  const labelWidth = isMobile ? 80 : 130;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 5, right: 30, left: leftMargin, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
          <XAxis 
            type="number" 
            stroke={isDark ? "#64748b" : "#94a3b8"} 
            fontSize={isMobile ? 8 : 10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="number" 
            stroke={isDark ? "#94a3b8" : "#1e293b"} 
            fontSize={isMobile ? 9 : 11}
            tickLine={false}
            axisLine={false}
            width={labelWidth}
            fontWeight="800"
            orientation="left"
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
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={isMobile ? 24 : 32}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? "#f59e0b" : index < 3 ? "#f97316" : "#fbbf24"} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopCallersChart;
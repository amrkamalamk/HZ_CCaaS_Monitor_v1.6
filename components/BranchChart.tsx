
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { BranchData } from '../types';

interface Props {
  data: BranchData[];
}

const getHeatMapColor = (val: number, min: number, max: number) => {
  if (max === min) return '#10b981'; // Default green
  const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
  // Gradient from Green (#10b981) -> Yellow (#f59e0b) -> Red (#f43f5e)
  let r, g, b;
  if (ratio < 0.5) {
    const factor = ratio * 2;
    r = Math.round(16 + (245 - 16) * factor);
    g = Math.round(185 + (158 - 185) * factor);
    b = Math.round(129 + (11 - 129) * factor);
  } else {
    const factor = (ratio - 0.5) * 2;
    r = Math.round(245 + (244 - 245) * factor);
    g = Math.round(158 + (63 - 158) * factor);
    b = Math.round(11 + (94 - 11) * factor);
  }
  return `rgb(${r}, ${g}, ${b})`;
};

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, offered, answered, abandoned, slPercent, color } = props;

  if (depth !== 1 || width < 40 || height < 30) return null;

  const abandPercent = offered > 0 ? (abandoned / offered) * 100 : 0;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 0.5,
        }}
      />
      <foreignObject x={x + 4} y={y + 4} width={width - 8} height={height - 8}>
        <div className="flex flex-col h-full overflow-hidden leading-tight pointer-events-none text-white select-none">
          <p className="text-[12px] font-black uppercase truncate tracking-tighter border-b border-white/20 pb-0.5 mb-1">
            {name}
          </p>
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-bold opacity-90 truncate">Offered: <span className="font-black">{offered}</span></p>
            <p className="text-[10px] font-bold opacity-90 truncate">Ans: <span className="font-black">{answered}</span></p>
            <p className="text-[10px] font-bold opacity-90 truncate">Abnd: <span className="font-black">{abandoned}</span></p>
            <p className="text-[10px] font-bold opacity-90 truncate">Aband%: <span className="font-black">{abandPercent.toFixed(1)}%</span></p>
            {width > 80 && (
              <p className="text-[11px] font-black mt-1">
                SL: {slPercent !== null ? slPercent.toFixed(1) : '0'}%
              </p>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

const BranchChart: React.FC<Props> = ({ data }) => {
  const minVal = Math.min(...data.map(d => d.offered));
  const maxVal = Math.max(...data.map(d => d.offered));

  const treemapData = data.map(d => ({
    ...d,
    value: d.offered, // Controls box size
    color: getHeatMapColor(d.offered, minVal, maxVal)
  }));

  return (
    <div className="h-full w-full bg-slate-50/50 rounded-2xl overflow-hidden p-2">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<CustomizedContent />}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                const abandPercent = d.offered > 0 ? (d.abandoned / d.offered) * 100 : 0;
                return (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xl">
                    <p className="text-sm font-black uppercase text-slate-900 border-b border-slate-100 pb-2 mb-2">{d.name}</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Offered</p>
                      <p className="text-[10px] text-slate-900 font-black text-right">{d.offered}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Answered</p>
                      <p className="text-[10px] text-emerald-600 font-black text-right">{d.answered}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Abandoned</p>
                      <p className="text-[10px] text-rose-600 font-black text-right">{d.abandoned}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Aband %</p>
                      <p className="text-[10px] text-rose-600 font-black text-right">{abandPercent.toFixed(1)}%</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Service Level</p>
                      <p className="text-[10px] text-blue-600 font-black text-right">{d.slPercent?.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

export default BranchChart;

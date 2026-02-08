
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { WrapUpData } from '../types';

interface Props {
  data: WrapUpData[];
}

const getHeatMapColor = (val: number, min: number, max: number) => {
  if (max === min) return 'rgb(22, 101, 52)'; // Default to Dark Green
  const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));

  // Requested sequence: dark red, red, amber, yellow, light green, dark green
  // Heatmap convention: High volume = Red (Hot), Low volume = Green (Cool)
  const colors = [
    { r: 22, g: 101, b: 52 },   // 0.0: Dark Green
    { r: 74, g: 222, b: 128 },  // 0.2: Light Green
    { r: 251, g: 191, b: 36 },  // 0.4: Yellow
    { r: 245, g: 158, b: 11 },  // 0.6: Amber
    { r: 239, g: 68, b: 68 },   // 0.8: Red
    { r: 153, g: 27, b: 27 }    // 1.0: Dark Red
  ];

  const scaledRatio = ratio * (colors.length - 1);
  const index = Math.floor(scaledRatio);
  const nextIndex = Math.min(index + 1, colors.length - 1);
  const factor = scaledRatio - index;

  const r = Math.round(colors[index].r + (colors[nextIndex].r - colors[index].r) * factor);
  const g = Math.round(colors[index].g + (colors[nextIndex].g - colors[index].g) * factor);
  const b = Math.round(colors[index].b + (colors[nextIndex].b - colors[index].b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
};

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, count, color } = props;

  if (depth !== 1 || width < 40 || height < 30) return null;

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
            <p className="text-[10px] font-bold opacity-90 truncate">Volume: <span className="font-black">{count}</span></p>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

const WrapUpChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const minVal = Math.min(...data.map(d => d.count));
  const maxVal = Math.max(...data.map(d => d.count));

  const treemapData = data.map(d => ({
    ...d,
    value: d.count, // Controls box size
    color: getHeatMapColor(d.count, minVal, maxVal)
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
                return (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xl">
                    <p className="text-sm font-black uppercase text-slate-900 border-b border-slate-100 pb-2 mb-2">{d.name}</p>
                    <div className="flex items-center justify-between gap-6">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Count</p>
                      <p className="text-sm text-slate-900 font-black">{d.count}</p>
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

export default WrapUpChart;

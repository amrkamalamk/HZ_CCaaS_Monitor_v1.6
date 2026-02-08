import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";

interface ForecastInterval {
  hour: number;
  dayOfWeek: number;
  requiredAgents: number;
  scheduledAgents?: number;
  capacity?: number;
  avgCalls: number;
  avgAht: number;
}

type PlannerViewMode = "baseline" | "scheduled" | "capacity";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const UTILIZATION_FACTOR = 0.75;
const AVAILABILITY_FACTOR = 0.875;

const PlannerTab: React.FC<{ queueId: string }> = () => {
  const [forecast, setForecast] = useState<ForecastInterval[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<PlannerViewMode>("baseline");
  const [maxConcurrentInput, setMaxConcurrentInput] = useState(20);
  const [scenariosGenerated, setScenariosGenerated] = useState(false);

  const calculateRequiredAgents = (calls: number, aht: number) => {
    if (calls <= 0 || aht <= 0) return 2;
    const intensity = (calls * aht) / 3600;
    const agentsFloor = intensity / UTILIZATION_FACTOR;
    return Math.max(Math.ceil(agentsFloor / AVAILABILITY_FACTOR), 2);
  };

  const handleGenerateScenarios = () => {
    if (!forecast) return;
    const peakRequired = Math.max(...forecast.map((i) => i.requiredAgents));
    if (!peakRequired) return;
    const multiplier = maxConcurrentInput / peakRequired;
    const updatedForecast = forecast.map((i) => {
      const scheduled = Math.ceil(i.requiredAgents * multiplier);
      const maxCallsPerAgent = (3600 * UTILIZATION_FACTOR) / (i.avgAht || 300);
      const capacity = i.avgAht > 0 ? Math.floor(scheduled * maxCallsPerAgent) : 0;
      return { ...i, scheduledAgents: scheduled, capacity };
    });
    setForecast(updatedForecast);
    setScenariosGenerated(true);
    setViewMode("scheduled");
  };

  const getHeatMapColor = (val: number, min: number, max: number) => {
    if (max === min) return "#10b981";
    const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
    let r: number, g: number, b: number;
    if (ratio < 0.5) {
      const f = ratio * 2;
      r = Math.round(16 + (250 - 16) * f);
      g = Math.round(185 + (204 - 185) * f);
      b = Math.round(129 + (21 - 129) * f);
    } else {
      const f = (ratio - 0.5) * 2;
      r = Math.round(250 + (239 - 250) * f);
      g = Math.round(204 + (68 - 204) * f);
      b = Math.round(21 + (68 - 21) * f);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getStatsForMode = (mode: PlannerViewMode) => {
    if (!forecast) return { min: 0, max: 0 };
    const values = forecast.map((i) =>
      mode === "baseline" ? i.requiredAgents : mode === "scheduled" ? i.scheduledAgents || 0 : i.capacity || 0
    );
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  const currentStats = useMemo(() => getStatsForMode(viewMode), [forecast, viewMode]);

  const dayTotals = useMemo(() => {
    if (!forecast) return Array(7).fill(0);
    return DAYS.map((_, dow) =>
      forecast
        .filter((i) => i.dayOfWeek === dow)
        .reduce((sum, i) => sum + (viewMode === "baseline" ? i.requiredAgents : viewMode === "scheduled" ? i.scheduledAgents || 0 : i.capacity || 0), 0)
    );
  }, [forecast, viewMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setScenariosGenerated(false);
    setViewMode("baseline");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const callsSheet = workbook.Sheets["Calls"] || workbook.Sheets[workbook.SheetNames[0]];
        const ahtSheet = workbook.Sheets["AHT"] || workbook.Sheets[workbook.SheetNames[1]];
        if (!callsSheet || !ahtSheet) throw new Error("Tabs missing.");

        const callsData: any[][] = XLSX.utils.sheet_to_json(callsSheet, { header: 1 });
        const ahtData: any[][] = XLSX.utils.sheet_to_json(ahtSheet, { header: 1 });
        const intervals: ForecastInterval[] = [];

        for (let dow = 0; dow < 7; dow++) {
          HOURS.forEach((h) => {
            const row = callsData.find((r) => r[0] === h);
            const ahtRow = ahtData.find((r) => r[0] === h);
            if (row && ahtRow) {
              const avgCalls = (Number(row[dow + 1]) + Number(row[dow + 8])) / 2 || 0;
              const avgAht = (Number(ahtRow[dow + 1]) + Number(ahtRow[dow + 8])) / 2 || 0;
              intervals.push({
                hour: h,
                dayOfWeek: dow,
                requiredAgents: calculateRequiredAgents(avgCalls, avgAht),
                avgCalls,
                avgAht,
              });
            }
          });
        }
        setForecast(intervals);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportToExcel = () => {
    if (!forecast) return;
    const workbook = XLSX.utils.book_new();
    const generateSheet = (mode: PlannerViewMode, title: string) => {
      const data = HOURS.map((h) => {
        const row: any = { Interval: `${h.toString().padStart(2, "0")}:00` };
        DAYS.forEach((day, dow) => {
          const interval = forecast.find((i) => i.dayOfWeek === dow && i.hour === h);
          row[day] = mode === "baseline" ? interval?.requiredAgents : mode === "scheduled" ? interval?.scheduledAgents : interval?.capacity;
        });
        return row;
      });
      if (mode === "capacity") {
        const totalRow: any = { Interval: "DAY TOTAL" };
        DAYS.forEach((day, dow) => (totalRow[day] = forecast.filter((i) => i.dayOfWeek === dow).reduce((sum, i) => sum + (i.capacity || 0), 0)));
        data.push(totalRow);
      }
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), title);
    };
    generateSheet("baseline", "Baseline Plan");
    generateSheet("scheduled", "Capped Plan");
    generateSheet("capacity", "Call Capacity");
    XLSX.writeFile(workbook, `Mawsool_Bundle_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Upload/Export UI */}
      <div className="flex gap-4">
        <label className="cursor-pointer">
          <div className="px-10 py-5 bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500 flex items-center gap-5">
            <i className="fa-solid fa-cloud-arrow-up text-emerald-500"></i>
            <div>
              <p className="text-xs font-black text-white tracking-widest">Process Data</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">14d Historical Feed</p>
            </div>
            <input type="file" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} />
          </div>
        </label>
        {forecast && (
          <button onClick={exportToExcel} className="px-10 py-5 bg-emerald-500 text-zinc-950 rounded-3xl">
            <i className="fa-solid fa-file-excel"></i> Export Bundle
          </button>
        )}
      </div>

      {/* Table and Scenario Controls */}
      {/* Keep all your existing JSX for the matrix, heatmap, and scenario buttons as-is */}
      {/* ... */}
    </div>
  );
};

export default PlannerTab;

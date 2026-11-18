import { useState, useMemo, type RefObject } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { Patient, ClinicalEvent } from '../lib/mockData';
import { cn, parseLocalDate } from '../lib/utils';
import { getWhoWfhThresholds } from '../lib/whoStandards';

interface GrowthChartsProps {
  patient: Patient;
  events: ClinicalEvent[];
}

// Helper to generate combined data
export const generateCombinedChartData = (type: 'heightForAge' | 'weightForHeight' | 'hcForAge', gender: 'M' | 'F', events: ClinicalEvent[], dob: string) => {
  const dataMap = new Map<number, any>();

  // 1. Add WHO base X values
  if (type === 'heightForAge' || type === 'hcForAge') {
    for (let i = 0; i <= 60; i++) dataMap.set(i, { x: i });
  } else if (type === 'weightForHeight') {
    for (let x = 45; x <= 120; x++) dataMap.set(x, { x: x });
  }

  // 2. Add Patient X values and Data (sorted by date ascending to ensure correct chronological line drawing)
  const sortedEvents = [...events].sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
  
  sortedEvents.forEach(e => {
    if (type === 'heightForAge' && e.height && e.height < 200) {
      let ageMonths = differenceInDays(parseLocalDate(e.date), parseLocalDate(dob)) / 30.4375;
      if (ageMonths < 0) ageMonths = 0;
      
      while (dataMap.has(ageMonths) && dataMap.get(ageMonths).patientValue !== undefined) {
        ageMonths += 0.001;
      }
      
      const existing: any = { x: ageMonths };
      existing.patientValue = Number(e.height);
      existing.date = parseLocalDate(e.date).toLocaleDateString();
      dataMap.set(ageMonths, existing);
    } 
    else if (type === 'weightForHeight' && e.height && e.weight && e.height < 200 && e.weight < 100) {
      let h = Math.round(Number(e.height) * 10) / 10;
      
      while (dataMap.has(h) && dataMap.get(h).patientValue !== undefined) {
        h += 0.001;
      }

      const existing: any = { x: h };
      existing.patientValue = Number(e.weight);
      existing.date = parseLocalDate(e.date).toLocaleDateString();
      dataMap.set(h, existing);
    }
    else if (type === 'hcForAge' && e.head_circumference && e.head_circumference < 100) {
      let ageMonths = differenceInDays(parseLocalDate(e.date), parseLocalDate(dob)) / 30.4375;
      if (ageMonths < 0) ageMonths = 0;
      
      while (dataMap.has(ageMonths) && dataMap.get(ageMonths).patientValue !== undefined) {
        ageMonths += 0.001;
      }
      
      const existing: any = { x: ageMonths };
      existing.patientValue = Number(e.head_circumference);
      existing.date = parseLocalDate(e.date).toLocaleDateString();
      dataMap.set(ageMonths, existing);
    }
  });

  // 3. Convert Map to Array and Sort by X
  const data = Array.from(dataMap.values()).sort((a, b) => a.x - b.x);

  // 4. Calculate WHO curves for ALL X values
  data.forEach(point => {
    const x = point.x;
    if (type === 'heightForAge') {
      const base = gender === 'M' ? 50 : 49;
      const median = base + 25 * Math.pow(x / 12, 0.6);
      const z2Offset = 4 + x * 0.05;
      const z3Offset = 6 + x * 0.08;
      
      point.z3 = median + z3Offset;
      point.z2 = median + z2Offset;
      point.z0 = median;
      point.z_2 = median - z2Offset;
      point.z_3 = median - z3Offset;
    } else if (type === 'weightForHeight') {
      const t = getWhoWfhThresholds(x, gender);
      point.z3 = t.sd3pos;
      point.z2 = t.sd2pos;
      point.z0 = t.median;
      point.z_2 = t.sd2neg;
      point.z_3 = t.sd3neg;
    } else if (type === 'hcForAge') {
      const base = gender === 'M' ? 34.5 : 33.5;
      const median = base + 12 * Math.pow(x / 12, 0.3);
      const z2Offset = 1.5 + x * 0.01;
      const z3Offset = 2.2 + x * 0.015;

      point.z3 = median + z3Offset;
      point.z2 = median + z2Offset;
      point.z0 = median;
      point.z_2 = median - z2Offset;
      point.z_3 = median - z3Offset;
    }
  });

  return data;
};

type ChartId = 'heightForAge' | 'weightForHeight' | 'hcForAge';

function getAdaptiveSteps(chartId: ChartId, axis: 'x' | 'y', span: number, isExport = false): [number, number] {
  if (chartId === 'heightForAge' || chartId === 'hcForAge') {
    if (axis === 'x') {
      if (span > 45) return [4, 2];
      if (span > 22) return [2, 1];
      return [1, 0.5];
    }
    if (chartId === 'heightForAge') {
      if (span > 55) return [10, 5];
      if (span > 28) return [10, 2];
      return [5, 1];
    }
    // hcForAge Y
    if (span > 14) return [2, 1];
    if (span > 7) return [2, 0.5];
    return [1, 0.25];
  }

  // weightForHeight
  if (axis === 'x') {
    if (span > 50) return [10, 5];
    if (span > 25) return [10, 2];
    return [5, 1];
  }
  if (isExport) {
    return span > 18 ? [4, 2] : [2, 1];
  }
  if (span > 18) return [5, 1];
  if (span > 9) return [2, 0.5];
  return [1, 0.5];
}

function buildAxisScale(domain: [number, number], majorStep: number, minorStep: number) {
  const [min, max] = domain;
  const eps = 1e-6;
  const start = Math.ceil((min - eps) / minorStep) * minorStep;
  const allTicks: number[] = [];
  const majorSet = new Set<string>();

  for (let v = start; v <= max + eps; v += minorStep) {
    const rounded = Math.round(v * 1000) / 1000;
    if (rounded < min - eps || rounded > max + eps) continue;
    allTicks.push(rounded);
    const mod = Math.abs(rounded / majorStep - Math.round(rounded / majorStep));
    if (mod < 1e-4) {
      majorSet.add(rounded.toFixed(3));
    }
  }

  return { allTicks, majorSet };
}

function formatTickValue(value: number) {
  if (Number.isInteger(value)) return value.toString();
  return Number(value.toFixed(2)).toString();
}

function renderCustomXTick(majorSet: Set<string>) {
  return ({ x, y, payload }: any) => {
    const val = Number(payload?.value);
    const isMajor = Number.isFinite(val) && majorSet.has(val.toFixed(3));
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={isMajor ? 10 : 8}
          textAnchor="middle"
          fill={isMajor ? '#475569' : '#94a3b8'}
          fontSize={isMajor ? 10 : 8}
          fontWeight={isMajor ? 600 : 400}
        >
          {Number.isFinite(val) ? formatTickValue(val) : payload?.value}
        </text>
      </g>
    );
  };
}

function renderCustomYTick(majorSet: Set<string>) {
  return ({ x, y, payload }: any) => {
    const val = Number(payload?.value);
    const isMajor = Number.isFinite(val) && majorSet.has(val.toFixed(3));
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-3}
          y={0}
          dy={3}
          textAnchor="end"
          fill={isMajor ? '#475569' : '#94a3b8'}
          fontSize={isMajor ? 10 : 8}
          fontWeight={isMajor ? 600 : 400}
        >
          {Number.isFinite(val) ? formatTickValue(val) : payload?.value}
        </text>
      </g>
    );
  };
}

export function GrowthCharts({ patient, events }: GrowthChartsProps) {
  const [currentChart, setCurrentChart] = useState(0);
  const isBoy = patient.gender === 'M';
  
  const themeClasses = isBoy 
    ? { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50' }
    : { border: 'border-pink-500', bg: 'bg-pink-500', text: 'text-pink-700', lightBg: 'bg-pink-50' };

  const charts = [
    {
      id: 'heightForAge' as ChartId,
      title: `Estatura por Idade - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Idade (meses)',
      yAxisLabel: 'Estatura (cm)',
      data: useMemo(() => generateCombinedChartData('heightForAge', patient.gender, events, patient.dob), [patient.gender, events, patient.dob]),
      xDomain: [0, 60] as [number, number],
      domain: [45, 125] as [number, number],
    },
    {
      id: 'weightForHeight' as ChartId,
      title: `Peso por Estatura - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Estatura (cm)',
      yAxisLabel: 'Peso (kg)',
      data: useMemo(() => generateCombinedChartData('weightForHeight', patient.gender, events, patient.dob), [patient.gender, events, patient.dob]),
      xDomain: [45, 120] as [number, number],
      domain: [2, 30] as [number, number],
    },
    {
      id: 'hcForAge' as ChartId,
      title: `Perímetro Craniano - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Idade (meses)',
      yAxisLabel: 'Perímetro Craniano (cm)',
      data: useMemo(() => generateCombinedChartData('hcForAge', patient.gender, events, patient.dob), [patient.gender, events, patient.dob]),
      xDomain: [0, 60] as [number, number],
      domain: [32, 54] as [number, number],
    }
  ];

  const handlePrev = () => setCurrentChart(prev => (prev > 0 ? prev - 1 : charts.length - 1));
  const handleNext = () => setCurrentChart(prev => (prev < charts.length - 1 ? prev + 1 : 0));

  const activeChartData = charts[currentChart];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const patientData = payload.find((p: any) => p.dataKey === 'patientValue' || p.name === 'Paciente');
      const xVal = Number(payload[0].payload.x);
      const formattedX = Number.isFinite(xVal) ? Number(xVal.toFixed(1)) : payload[0].payload.x;
      
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-slate-800 mb-2">{activeChartData.xAxisLabel}: {formattedX}</p>
          {patientData && patientData.value && (
            <div className="mb-2 pb-2 border-b border-slate-100">
              <p className="font-bold text-emerald-600">Paciente: {patientData.value} {activeChartData.yAxisLabel.split(' ')[1]}</p>
              <p className="text-xs text-slate-500">Data: {patientData.payload.date}</p>
            </div>
          )}
          <p className="text-slate-600">Z +3: {payload.find((p:any)=>p.dataKey==='z3')?.value.toFixed(1)}</p>
          <p className="text-red-500">Z +2: {payload.find((p:any)=>p.dataKey==='z2')?.value.toFixed(1)}</p>
          <p className="text-emerald-500">Mediana: {payload.find((p:any)=>p.dataKey==='z0')?.value.toFixed(1)}</p>
          <p className="text-red-500">Z -2: {payload.find((p:any)=>p.dataKey==='z_2')?.value.toFixed(1)}</p>
          <p className="text-slate-600">Z -3: {payload.find((p:any)=>p.dataKey==='z_3')?.value.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  const renderComposedChart = (
    chart: typeof charts[number],
    xDom: [number, number],
    yDom: [number, number],
    fixedWidth?: number,
    fixedHeight?: number,
  ) => {
    const isExport = Boolean(fixedWidth);
    const [xMaj, xMin] = getAdaptiveSteps(chart.id, 'x', xDom[1] - xDom[0], isExport);
    const [yMaj, yMin] = getAdaptiveSteps(chart.id, 'y', yDom[1] - yDom[0], isExport);
    const xScale = buildAxisScale(xDom, xMaj, xMin);
    const yScale = buildAxisScale(yDom, yMaj, yMin);

    return (
      <ComposedChart
        data={chart.data}
        width={fixedWidth}
        height={fixedHeight}
        margin={isExport ? { top: 18, right: 28, left: 10, bottom: 24 } : { top: 20, right: 30, left: 10, bottom: 25 }}
      >
        <CartesianGrid stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="2 2" />
        <XAxis
          dataKey="x"
          type="number"
          domain={xDom}
          allowDataOverflow={true}
          ticks={xScale.allTicks}
          interval={0}
          stroke="#94a3b8"
          tick={renderCustomXTick(xScale.majorSet)}
          tickLine={{ stroke: '#cbd5e1', strokeWidth: 0.75 }}
          tickSize={3}
          label={{ value: chart.xAxisLabel, position: 'insideBottom', offset: isExport ? -14 : -15, fill: '#334155', fontWeight: 'bold', fontSize: isExport ? 11 : 12 }}
        />
        <YAxis
          domain={yDom}
          allowDataOverflow={true}
          ticks={yScale.allTicks}
          interval={0}
          stroke="#94a3b8"
          tick={renderCustomYTick(yScale.majorSet)}
          tickLine={{ stroke: '#cbd5e1', strokeWidth: 0.75 }}
          tickSize={3}
          label={{ value: chart.yAxisLabel, angle: -90, position: 'insideLeft', offset: isExport ? -2 : -5, fill: '#334155', fontWeight: 'bold', fontSize: isExport ? 11 : 12 }}
        />
        {!isExport && <Tooltip content={<CustomTooltip />} />}

        {/* Major Scale Grid Lines */}
        {xScale.allTicks
          .filter((t) => xScale.majorSet.has(t.toFixed(3)))
          .map((t) => (
            <ReferenceLine key={`xm-${t}`} x={t} stroke="#cbd5e1" strokeWidth={0.9} ifOverflow="hidden" />
          ))}
        {yScale.allTicks
          .filter((t) => yScale.majorSet.has(t.toFixed(3)))
          .map((t) => (
            <ReferenceLine key={`ym-${t}`} y={t} stroke="#cbd5e1" strokeWidth={0.9} ifOverflow="hidden" />
          ))}

        {/* WHO Curves */}
        <Line type="monotone" dataKey="z3" stroke="#000000" strokeWidth={1} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="z2" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="z0" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="z_2" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="z_3" stroke="#000000" strokeWidth={1} dot={false} isAnimationActive={false} />

        {/* Patient Data Points */}
        <Line
          type="monotone"
          dataKey="patientValue"
          name="Paciente"
          stroke={isBoy ? '#3b82f6' : '#ec4899'}
          strokeWidth={2}
          connectNulls={true}
          dot={{ r: 3, fill: isBoy ? '#1e3a8a' : '#831843', stroke: '#fff', strokeWidth: 1.5 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    );
  };

  return (
    <div className="space-y-4">
      {/* Slider Controls */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-slate-800">{activeChartData.title}</h3>
          <p className="text-xs text-slate-500">Padrões de Crescimento da OMS</p>
        </div>
        <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight size={24} className="text-slate-600" />
        </button>
      </div>

      {/* Chart Container with Gender Theme */}
      <div className={cn("border-4 rounded-2xl overflow-hidden bg-white", themeClasses.border)}>
        <div className={cn("px-4 py-2 flex justify-between items-center text-white font-bold", themeClasses.bg)}>
          <span>{activeChartData.title.toUpperCase()}</span>
          <span>NOME: {patient.name.toUpperCase()}</span>
        </div>
        
        <div className={cn("p-4 h-[440px] w-full", themeClasses.lightBg)}>
          <ResponsiveContainer width="100%" height="100%">
            {renderComposedChart(activeChartData, activeChartData.xDomain, activeChartData.domain)}
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1"><div className="w-4 h-1 bg-black"></div> Z +3 / -3</div>
        <div className="flex items-center gap-1"><div className="w-4 h-1 bg-red-500"></div> Z +2 / -2</div>
        <div className="flex items-center gap-1"><div className="w-4 h-1 bg-emerald-500"></div> Mediana (0)</div>
        <div className="flex items-center gap-1"><div className={cn("w-2.5 h-2.5 rounded-full", isBoy ? "bg-blue-900" : "bg-pink-900")}></div> Medições do Paciente</div>
      </div>
    </div>
  );
}

/**
 * Offscreen renderer for all 3 WHO growth charts at fixed pixel dimensions,
 * used when exporting the complete clinical history PDF.
 */
export function GrowthChartsExportView({
  patient,
  events,
  containerRef,
}: {
  patient: Patient;
  events: ClinicalEvent[];
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const isBoy = patient.gender === 'M';

  const charts = useMemo(() => [
    {
      id: 'heightForAge' as const,
      title: `Estatura por Idade - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Idade (meses)',
      yAxisLabel: 'Estatura (cm)',
      data: generateCombinedChartData('heightForAge', patient.gender, events, patient.dob),
      xDomain: [0, 60] as [number, number],
      domain: [45, 125] as [number, number],
    },
    {
      id: 'weightForHeight' as const,
      title: `Peso por Estatura - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Estatura (cm)',
      yAxisLabel: 'Peso (kg)',
      data: generateCombinedChartData('weightForHeight', patient.gender, events, patient.dob),
      xDomain: [45, 120] as [number, number],
      domain: [2, 30] as [number, number],
    },
    {
      id: 'hcForAge' as const,
      title: `Perímetro Craniano - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Idade (meses)',
      yAxisLabel: 'Perímetro Craniano (cm)',
      data: generateCombinedChartData('hcForAge', patient.gender, events, patient.dob),
      xDomain: [0, 60] as [number, number],
      domain: [32, 54] as [number, number],
    },
  ], [isBoy, patient.gender, events, patient.dob]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: '740px',
        background: '#ffffff',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {charts.map((chart) => {
        const [xMaj, xMin] = getAdaptiveSteps(chart.id, 'x', chart.xDomain[1] - chart.xDomain[0], true);
        const [yMaj, yMin] = getAdaptiveSteps(chart.id, 'y', chart.domain[1] - chart.domain[0], true);
        const xScale = buildAxisScale(chart.xDomain, xMaj, xMin);
        const yScale = buildAxisScale(chart.domain, yMaj, yMin);

        return (
          <div key={chart.id} data-export-chart={chart.id} style={{ background: '#ffffff', padding: '8px' }}>
            <ComposedChart
              data={chart.data}
              width={720}
              height={290}
              margin={{ top: 18, right: 28, left: 10, bottom: 24 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="2 2" />
              <XAxis
                dataKey="x"
                type="number"
                domain={chart.xDomain}
                allowDataOverflow={true}
                ticks={xScale.allTicks}
                interval={0}
                stroke="#94a3b8"
                tick={renderCustomXTick(xScale.majorSet)}
                tickLine={{ stroke: '#cbd5e1', strokeWidth: 0.75 }}
                tickSize={3}
                label={{ value: chart.xAxisLabel, position: 'insideBottom', offset: -14, fill: '#334155', fontWeight: 'bold', fontSize: 11 }}
              />
              <YAxis
                domain={chart.domain}
                allowDataOverflow={true}
                ticks={yScale.allTicks}
                interval={0}
                stroke="#94a3b8"
                tick={renderCustomYTick(yScale.majorSet)}
                tickLine={{ stroke: '#cbd5e1', strokeWidth: 0.75 }}
                tickSize={3}
                label={{ value: chart.yAxisLabel, angle: -90, position: 'insideLeft', offset: -2, fill: '#334155', fontWeight: 'bold', fontSize: 11 }}
              />
              {xScale.allTicks
                .filter((t) => xScale.majorSet.has(t.toFixed(3)))
                .map((t) => (
                  <ReferenceLine key={`xm-${t}`} x={t} stroke="#cbd5e1" strokeWidth={0.9} ifOverflow="hidden" />
                ))}
              {yScale.allTicks
                .filter((t) => yScale.majorSet.has(t.toFixed(3)))
                .map((t) => (
                  <ReferenceLine key={`ym-${t}`} y={t} stroke="#cbd5e1" strokeWidth={0.9} ifOverflow="hidden" />
                ))}
              <Line type="monotone" dataKey="z3" stroke="#000000" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="z2" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="z0" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="z_2" stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="z_3" stroke="#000000" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="patientValue"
                name="Paciente"
                stroke={isBoy ? '#3b82f6' : '#ec4899'}
                strokeWidth={2}
                connectNulls={true}
                dot={{ r: 3, fill: isBoy ? '#1e3a8a' : '#831843', stroke: '#fff', strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </div>
        );
      })}
    </div>
  );
}

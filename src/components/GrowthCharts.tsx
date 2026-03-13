import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter } from 'recharts';
import { differenceInMonths } from 'date-fns';
import { Patient, ClinicalEvent } from '../lib/mockData';
import { cn } from '../lib/utils';

interface GrowthChartsProps {
  patient: Patient;
  events: ClinicalEvent[];
}

// Helper to generate mock WHO curves
const generateChartData = (type: 'heightForAge' | 'weightForHeight' | 'hcForAge', gender: 'M' | 'F', events: ClinicalEvent[], dob: string) => {
  const data = [];
  
  if (type === 'heightForAge') {
    for (let i = 0; i <= 60; i++) {
      const base = gender === 'M' ? 50 : 49;
      const median = base + 25 * Math.pow(i / 12, 0.6);
      const z2Offset = 4 + i * 0.05;
      const z3Offset = 6 + i * 0.08;
      
      // Find patient measurement for this month
      const patientEvent = events.find(e => {
        const ageMonths = differenceInMonths(new Date(e.date), new Date(dob));
        return ageMonths === i && e.height;
      });

      data.push({
        x: i,
        z3: median + z3Offset,
        z2: median + z2Offset,
        z0: median,
        z_2: median - z2Offset,
        z_3: median - z3Offset,
        patientValue: patientEvent ? patientEvent.height : null,
        patientDate: patientEvent ? new Date(patientEvent.date).toLocaleDateString() : null,
      });
    }
  } else if (type === 'weightForHeight') {
    for (let x = 45; x <= 120; x += 1) {
      const base = gender === 'M' ? 2.5 : 2.4;
      const median = base + 0.15 * (x - 45) + 0.0015 * Math.pow(x - 45, 2);
      const z2Offset = 0.5 + (x - 45) * 0.03;
      const z3Offset = 0.8 + (x - 45) * 0.04;

      // Find patient measurement for this height
      const patientEvent = events.find(e => e.height && Math.round(e.height) === x && e.weight);

      data.push({
        x: x,
        z3: median + z3Offset,
        z2: median + z2Offset,
        z0: median,
        z_2: median - z2Offset,
        z_3: median - z3Offset,
        patientValue: patientEvent ? patientEvent.weight : null,
        patientDate: patientEvent ? new Date(patientEvent.date).toLocaleDateString() : null,
      });
    }
  } else if (type === 'hcForAge') {
    for (let i = 0; i <= 60; i++) {
      const base = gender === 'M' ? 34.5 : 33.5;
      const median = base + 12 * Math.pow(i / 12, 0.3);
      const z2Offset = 1.5 + i * 0.01;
      const z3Offset = 2.2 + i * 0.015;

      const patientEvent = events.find(e => {
        const ageMonths = differenceInMonths(new Date(e.date), new Date(dob));
        return ageMonths === i && e.head_circumference;
      });

      data.push({
        x: i,
        z3: median + z3Offset,
        z2: median + z2Offset,
        z0: median,
        z_2: median - z2Offset,
        z_3: median - z3Offset,
        patientValue: patientEvent ? patientEvent.head_circumference : null,
        patientDate: patientEvent ? new Date(patientEvent.date).toLocaleDateString() : null,
      });
    }
  }
  
  return data;
};

export function GrowthCharts({ patient, events }: GrowthChartsProps) {
  const [currentChart, setCurrentChart] = useState(0);
  const isBoy = patient.gender === 'M';
  
  const themeColor = isBoy ? 'blue' : 'pink';
  const themeClasses = isBoy 
    ? { border: 'border-blue-500', bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50' }
    : { border: 'border-pink-500', bg: 'bg-pink-500', text: 'text-pink-700', lightBg: 'bg-pink-50' };

  const charts = [
    {
      id: 'heightForAge',
      title: `Estatura por Idade - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Idade (meses)',
      yAxisLabel: 'Estatura (cm)',
      data: useMemo(() => generateChartData('heightForAge', patient.gender, events, patient.dob), [patient, events]),
      domain: [45, 125],
    },
    {
      id: 'weightForHeight',
      title: `Peso por Estatura - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Estatura (cm)',
      yAxisLabel: 'Peso (kg)',
      data: useMemo(() => generateChartData('weightForHeight', patient.gender, events, patient.dob), [patient, events]),
      domain: [2, 30],
    },
    {
      id: 'hcForAge',
      title: `Perímetro Craniano - ${isBoy ? 'Rapazes' : 'Raparigas'}`,
      xAxisLabel: 'Idade (meses)',
      yAxisLabel: 'Perímetro Craniano (cm)',
      data: useMemo(() => generateChartData('hcForAge', patient.gender, events, patient.dob), [patient, events]),
      domain: [32, 54],
    }
  ];

  const handlePrev = () => setCurrentChart(prev => (prev > 0 ? prev - 1 : charts.length - 1));
  const handleNext = () => setCurrentChart(prev => (prev < charts.length - 1 ? prev + 1 : 0));

  const activeChartData = charts[currentChart];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const patientData = payload.find((p: any) => p.dataKey === 'patientValue');
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-slate-800 mb-2">{activeChartData.xAxisLabel}: {label}</p>
          {patientData && patientData.value && (
            <div className="mb-2 pb-2 border-b border-slate-100">
              <p className="font-bold text-emerald-600">Paciente: {patientData.value} {activeChartData.yAxisLabel.split(' ')[1]}</p>
              <p className="text-xs text-slate-500">Data: {patientData.payload.patientDate}</p>
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
        
        <div className={cn("p-4 h-[400px] w-full", themeClasses.lightBg)}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activeChartData.data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis 
                dataKey="x" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                tickCount={10}
                label={{ value: activeChartData.xAxisLabel, position: 'insideBottom', offset: -10 }} 
              />
              <YAxis 
                domain={activeChartData.domain} 
                label={{ value: activeChartData.yAxisLabel, angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              
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
                stroke={isBoy ? '#1e3a8a' : '#831843'} 
                strokeWidth={3} 
                connectNulls 
                dot={{ r: 6, fill: isBoy ? '#1e3a8a' : '#831843', stroke: '#fff', strokeWidth: 2 }} 
                activeDot={{ r: 8 }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1"><div className="w-4 h-1 bg-black"></div> Z +3 / -3</div>
        <div className="flex items-center gap-1"><div className="w-4 h-1 bg-red-500"></div> Z +2 / -2</div>
        <div className="flex items-center gap-1"><div className="w-4 h-1 bg-emerald-500"></div> Mediana (0)</div>
        <div className="flex items-center gap-1"><div className={cn("w-3 h-3 rounded-full", isBoy ? "bg-blue-900" : "bg-pink-900")}></div> Medições do Paciente</div>
      </div>
    </div>
  );
}

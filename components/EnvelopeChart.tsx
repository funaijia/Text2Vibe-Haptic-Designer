import React from 'react';
import { VibrationConfig } from '../types';

interface EnvelopeChartProps {
  config: VibrationConfig | null;
}

const EnvelopeChart: React.FC<EnvelopeChartProps> = ({ config }) => {
  const width = 300;
  const height = 100;
  const padding = 10;

  let points = [
    { x: 0, y: height },
    { x: width * 0.33, y: height },
    { x: width * 0.66, y: height },
    { x: width, y: height }
  ];

  if (config && config.envelope) {
    const { envelope } = config;
    points = [
      { x: 0, y: height }, // P1
      { x: envelope.p2.timeRatio * width, y: height - (envelope.p2.intensityRatio * (height - padding)) },
      { x: envelope.p3.timeRatio * width, y: height - (envelope.p3.intensityRatio * (height - padding)) },
      { x: width, y: height } // P4
    ];
  }

  const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y}`;

  return (
    <div className="w-full bg-black/20 rounded-lg p-2 mt-2 border border-white/5">
      <div className="text-[10px] text-gray-500 uppercase tracking-tighter mb-1 flex justify-between">
        <span>Intensity Envelope</span>
        <span>{config ? `${config.durationSeconds}s` : '--'}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible">
        {/* Grid Lines */}
        <line x1="0" y1={height} x2={width} y2={height} stroke="#333" strokeWidth="1" />
        <line x1="0" y1="0" x2="0" y2={height} stroke="#333" strokeWidth="1" />
        
        {/* Fill Area */}
        <path d={`${pathData} L ${width} ${height} L 0 ${height} Z`} fill={config ? "rgba(0, 208, 156, 0.1)" : "rgba(255,255,255,0.05)"} />
        
        {/* Curve Line */}
        <path d={pathData} fill="none" stroke={config ? "#00D09C" : "#444"} strokeWidth="2" strokeLinejoin="round" />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={config ? "#00D09C" : "#444"} />
        ))}
      </svg>
    </div>
  );
};

export default EnvelopeChart;
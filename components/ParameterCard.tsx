import React from 'react';
import { VibrationConfig } from '../types';
import EnvelopeChart from './EnvelopeChart';

interface ParameterCardProps {
  config: VibrationConfig | null;
  loading: boolean;
  onPlay?: () => void;
  isVibrating?: boolean;
}

const ParameterCard: React.FC<ParameterCardProps> = ({ config, loading, onPlay, isVibrating }) => {
  const isEmpty = !config;

  return (
    <div className={`w-full bg-surface rounded-xl p-6 my-4 border border-gray-700 shadow-lg transition-all duration-500 ${loading ? 'animate-pulse opacity-70' : ''}`}>
      <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
        <span>Vibration Parameters</span>
        <div className="flex gap-2">
          {!isEmpty && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.vibrationType === 'transient' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
              {config.vibrationType.toUpperCase()}
            </span>
          )}
          <span className="text-xs text-primary/70">{isEmpty ? 'Waiting for input' : 'IEEE 2861.3 Compliant'}</span>
        </div>
      </h3>
      
      <div className="space-y-4">
        {/* Effect & Chart */}
        <div className="bg-secondary p-3 rounded-lg border border-white/5 relative group">
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Effect Description</div>
          <div className={`text-lg font-medium mb-2 ${isEmpty ? 'text-gray-600' : 'text-white'}`}>
            {isEmpty ? '未生成效果' : config.effect}
          </div>
          
          {/* Only show envelope chart for continuous effects */}
          {(!isEmpty && config.vibrationType === 'continuous') ? (
            <EnvelopeChart config={config} />
          ) : !isEmpty ? (
            <div className="h-16 flex items-center justify-center border border-dashed border-gray-800 rounded-lg text-gray-600 text-[10px] uppercase">
              Transient Effect (Sharp Click)
            </div>
          ) : (
             <div className="h-16 border border-dashed border-gray-800 rounded-lg"></div>
          )}
          
          {/* Internal Play Button */}
          {!isEmpty && onPlay && (
            <button 
              onClick={onPlay}
              disabled={isVibrating}
              className={`absolute top-3 right-3 p-2 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-secondary transition-all ${isVibrating ? 'animate-ping' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary p-3 rounded-lg">
            <div className="text-[10px] text-gray-500 mb-1 uppercase">Base Frequency</div>
            <div className={`text-lg font-mono ${isEmpty ? 'text-gray-700' : (config.baseFrequency > 50 ? 'text-blue-400' : config.baseFrequency < 50 ? 'text-orange-400' : 'text-primary')}`}>
              {isEmpty ? '--' : config.baseFrequency}
              <span className="text-[10px] ml-1 opacity-50">{config?.baseFrequency === 50 ? '(Resonant)' : ''}</span>
            </div>
          </div>
          <div className="bg-secondary p-3 rounded-lg">
            <div className="text-[10px] text-gray-500 mb-1 uppercase">Intensity</div>
            <div className={`text-lg font-mono ${isEmpty ? 'text-gray-700' : 'text-primary'}`}>
              {isEmpty ? '--' : config.intensity}<span className="text-xs ml-1">/100</span>
            </div>
          </div>
        </div>

        {/* Duration & Count & Interval */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary p-2 rounded-lg">
            <div className="text-[9px] text-gray-500 mb-1 uppercase">Unit Dur</div>
            <div className={`text-sm font-mono ${isEmpty ? 'text-gray-700' : 'text-white'}`}>
              {isEmpty ? '--' : (config.vibrationType === 'transient' ? 'Fixed' : `${Math.round(config.durationSeconds * 1000)}ms`)}
            </div>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <div className="text-[9px] text-gray-500 mb-1 uppercase">Cycles</div>
            <div className={`text-sm font-mono ${isEmpty ? 'text-gray-700' : 'text-white'}`}>
              {isEmpty ? '--' : `x${config.count}`}
            </div>
          </div>
          <div className="bg-secondary p-2 rounded-lg">
            <div className="text-[9px] text-gray-500 mb-1 uppercase">Interval</div>
            <div className={`text-sm font-mono ${isEmpty ? 'text-gray-700' : 'text-white'}`}>
              {isEmpty ? '--' : `${Math.round(config.intervalSeconds * 1000)}ms`}
            </div>
          </div>
        </div>

        {/* Reasoning Section */}
        <div className={`border p-4 rounded-lg transition-colors ${isEmpty ? 'border-gray-800 bg-gray-900/20' : 'bg-blue-900/10 border-blue-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isEmpty ? 'text-gray-700' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs font-bold uppercase tracking-widest ${isEmpty ? 'text-gray-700' : 'text-blue-400 text-shadow-glow'}`}>Standard Reasoning</span>
          </div>
          <p className={`text-sm italic leading-relaxed ${isEmpty ? 'text-gray-700' : 'text-gray-300'}`}>
            {isEmpty ? "等待输入分析内容..." : `"${config.reasoning}"`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParameterCard;
import React, { useState, useCallback, useRef } from 'react';
import { analyzeTextForVibration } from './services/geminiService';
import { AnalysisState, VibrationConfig } from './types';
import ParameterCard from './components/ParameterCard';
import { convertToHE10, downloadHEFile } from './services/hapticConverter';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle', data: null });
  const [isVibrating, setIsVibrating] = useState(false);
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const vibrationTimeoutRef = useRef<number | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setAnalysis({ status: 'analyzing', data: null });
    setDebugLog(null);
    try {
      const result = await analyzeTextForVibration(inputText);
      setAnalysis({ status: 'success', data: result });
      
      const heData = convertToHE10(result);
      setDebugLog(`[IEEE 2861.3 HE 1.0 JSON]\n${JSON.stringify(heData, null, 2)}`);
      
      executeVibration(result);
    } catch (e) {
      setAnalysis({ status: 'error', data: null, errorMessage: '分析失败，请检查网络连接。' });
    }
  };

  const executeVibration = useCallback((dataOverride?: VibrationConfig) => {
    const data = dataOverride || analysis.data;
    if (!data) return;

    if (!navigator.vibrate) {
      console.warn("Browser does not support navigator.vibrate");
      return;
    }

    const { durationSeconds, intervalSeconds, count, vibrationType } = data;
    
    if (vibrationTimeoutRef.current) {
      window.clearTimeout(vibrationTimeoutRef.current);
    }
    navigator.vibrate(0);

    const pattern: number[] = [];
    
    // 浏览器预览逻辑优化
    // 对于 transient 类型，使用极短的 20ms 脉冲来模拟点击感
    const effectDurationMs = vibrationType === 'transient' ? 20 : Math.floor(durationSeconds * 1000);
    const pauseMs = Math.floor(intervalSeconds * 1000); 

    for (let i = 0; i < count; i++) {
        pattern.push(effectDurationMs);
        if (i < count - 1) {
            pattern.push(pauseMs);
        }
    }

    const totalTime = pattern.reduce((a, b) => a + b, 0);
    navigator.vibrate(pattern);
    setIsVibrating(true);
    vibrationTimeoutRef.current = window.setTimeout(() => {
      setIsVibrating(false);
    }, totalTime);

  }, [analysis.data]);

  const handleExportHE = () => {
    if (!analysis.data) return;
    const heData = convertToHE10(analysis.data);
    const fileName = analysis.data.filename || 'haptic_effect';
    downloadHEFile(heData, fileName);
    setDebugLog(prev => `${prev}\n\n[System] HE文件已导出并下载 (${fileName}.he)。`);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center p-4 transition-all ${isSnapshotMode ? 'bg-[#000]' : 'max-w-md mx-auto pb-32'}`}>
      <header className="w-full py-4 mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            Text2Vibe <span className="text-xs align-top px-1 bg-white/10 rounded text-gray-400">HE 1.0</span>
          </h1>
          <p className="text-gray-500 text-sm italic">Standard Compliant (IEEE 2861.3)</p>
        </div>
        
        <button 
          onClick={() => setIsSnapshotMode(!isSnapshotMode)}
          className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${isSnapshotMode ? 'bg-primary border-primary text-secondary' : 'bg-surface border-gray-700 text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold">{isSnapshotMode ? "退出模式" : "截图模式"}</span>
        </button>
      </header>

      <main className={`w-full flex-1 flex flex-col ${isSnapshotMode ? 'max-w-3xl' : ''}`}>
        <div className={`flex flex-col gap-3 mb-6 ${isSnapshotMode ? 'hidden' : ''}`}>
          <textarea
            className="w-full bg-surface text-white rounded-xl p-4 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder-gray-500 shadow-inner min-h-[120px]"
            placeholder="输入含声音的文字，例如：机关枪扫射、清脆的点击声..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={analysis.status === 'analyzing' || !inputText}
            className="w-full py-4 bg-primary text-secondary font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {analysis.status === 'analyzing' ? '正在分析...' : '生成振动效果'}
          </button>
        </div>

        {analysis.status === 'error' && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-500/20">
            {analysis.errorMessage}
          </div>
        )}

        <ParameterCard 
            config={analysis.data} 
            loading={analysis.status === 'analyzing'} 
            onPlay={() => executeVibration()}
            isVibrating={isVibrating}
        />

        {debugLog && (
          <div className={`w-full bg-black/50 border border-gray-800 rounded-lg p-3 mb-4 font-mono text-[9px] text-gray-400 shadow-inner ${isSnapshotMode ? '' : 'max-h-64 overflow-y-auto'}`}>
            <div className="flex justify-between items-center border-b border-gray-800 pb-1 mb-2">
               <span className="uppercase tracking-widest text-gray-600 font-bold">Standard Debug Console</span>
            </div>
            <pre className="whitespace-pre-wrap leading-tight">{debugLog}</pre>
          </div>
        )}

        <div className={isSnapshotMode ? "mt-8 pb-12" : "fixed bottom-0 left-0 right-0 p-4 bg-[#121212]/90 backdrop-blur-lg border-t border-gray-800 flex justify-center z-50"}>
          <div className="w-full max-w-md">
            <button
              onClick={handleExportHE}
              disabled={!analysis.data}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border
                ${!analysis.data 
                  ? 'border-gray-800 text-gray-600 cursor-not-allowed bg-gray-900/40' 
                  : 'border-blue-500/50 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 shadow-lg shadow-blue-500/10'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              HE1.0格式导出
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
export enum VibrationIntensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface EnvelopePoint {
  timeRatio: number;      // 0.0 to 1.0
  intensityRatio: number; // 0.0 to 1.0
  frequencyOffset: number; // -100 to 100 (Relative offset)
}

export interface VibrationConfig {
  vibrationType: 'continuous' | 'transient';
  durationSeconds: number; 
  intervalSeconds: number; 
  count: number;          
  effect: string;         
  filename: string;       // Short English slug for file export
  intensity: number;      // 0 to 100
  baseFrequency: number;  // 0 to 100 (Center/Resonant = 50)
  reasoning: string;      
  envelope: {
    p1: { frequencyOffset: number };
    p2: EnvelopePoint;
    p3: EnvelopePoint;
    p4: { frequencyOffset: number };
  };
}

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data: VibrationConfig | null;
  errorMessage?: string;
}
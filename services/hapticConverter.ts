import { VibrationConfig } from "../types";

export interface HECurvePoint {
  Time: number;      
  Intensity: number; 
  Frequency: number; 
}

export interface HEEvent {
  Type: "continuous" | "transient";
  RelativeTime: number; 
  Duration?: number;     
  Parameters: {
    Intensity: number;  
    Frequency: number;  
    Curve?: HECurvePoint[]; 
  };
}

export interface HE10Format {
  Metadata: {
    Version: number;
    Created: string;
    Description: string;
  };
  Pattern: {
    Event: HEEvent;
  }[];
}

export const convertToHE10 = (config: VibrationConfig): HE10Format => {
  const durationMs = Math.round(config.durationSeconds * 1000);
  const pauseMs = Math.round(config.intervalSeconds * 1000);
  
  const pattern: { Event: HEEvent }[] = [];
  let currentTime = 0;

  const env = config.envelope;

  for (let i = 0; i < config.count; i++) {
    if (config.vibrationType === 'transient') {
      // 严格遵循用户提供的正确 transient 格式：不含 Duration，不含 Curve
      pattern.push({
        Event: {
          Type: "transient",
          RelativeTime: currentTime,
          Parameters: {
            Intensity: Math.round(config.intensity),
            Frequency: Math.round(config.baseFrequency)
          }
        }
      });
      // 对于 transient，时间轴累加仅依赖于 intervalSeconds (Pause)
      // 如果 AI 给出的 durationSeconds 是逻辑宽度，我们也加上它以防重叠
      currentTime += (durationMs + pauseMs);
    } else {
      // Continuous 格式：包含 Duration 和 Curve
      pattern.push({
        Event: {
          Type: "continuous",
          RelativeTime: currentTime,
          Duration: durationMs,
          Parameters: {
            Intensity: Math.round(config.intensity),
            Frequency: Math.round(config.baseFrequency),
            Curve: [
              { 
                Time: 0,
                Intensity: 0, 
                Frequency: Math.round(env.p1.frequencyOffset) 
              },
              { 
                Time: Math.round(durationMs * env.p2.timeRatio),
                Intensity: parseFloat(env.p2.intensityRatio.toFixed(2)), 
                Frequency: Math.round(env.p2.frequencyOffset) 
              },
              { 
                Time: Math.round(durationMs * env.p3.timeRatio),
                Intensity: parseFloat(env.p3.intensityRatio.toFixed(2)), 
                Frequency: Math.round(env.p3.frequencyOffset) 
              },
              { 
                Time: durationMs,
                Intensity: 0, 
                Frequency: Math.round(env.p4.frequencyOffset) 
              }
            ]
          }
        }
      });
      currentTime += (durationMs + pauseMs);
    }
  }

  return {
    Metadata: {
      Version: 1,
      Created: new Date().toISOString().split('T')[0],
      Description: `Text2Vibe: ${config.effect}`,
    },
    Pattern: pattern,
  };
};

export const downloadHEFile = (data: HE10Format, fileName: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.he`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
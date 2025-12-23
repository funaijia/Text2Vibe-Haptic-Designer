import { GoogleGenAI, Type } from "@google/genai";
import { VibrationConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTextForVibration = async (text: string): Promise<VibrationConfig> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一个顶级的触感设计专家，专门为 Android 高级线性马达设计符合 IEEE 2861.3 (HE 1.0) 标准的震动效果。
      
      请分析以下描述文字，并将其转化为震动参数: "${text}"。
      
      设计准则：
      1. 类型选择 (vibrationType):
         - transient (瞬态): 适用于“机关枪”、“心跳”、“点击”、“打字”、“脉冲”、“爆炸”、“急促的一声”等。这种类型在 HE 1.0 中没有持续时间，是一次极短的冲击。
         - continuous (连续): 适用于“引擎轰鸣”、“风声”、“持续长鸣”、“摩擦声”等。
      
      2. 物理还原：
         - 机关枪/连发：必须设为 transient，count 设为 8-12，intervalSeconds 设为 0.08-0.12 (模拟高射速)，intensity 设为 90+。
         - 心跳：transient，双跳逻辑（两次一组），intervalSeconds 较短。
      
      3. 参数限制：
         - baseFrequency: 0-100 (50为标准马达谐振点)。
         - intensity: 0-100。

      4. 语言要求：
         - **请务必使用中文编写 reasoning (设计说明) 字段**，解释你为何选择这些参数。
      
      返回格式: JSON。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibrationType: { type: Type.STRING, enum: ["continuous", "transient"] },
            durationSeconds: { type: Type.NUMBER, description: "对于 transient，此值代表单次射击的逻辑宽度，通常很小，如 0.05" },
            intervalSeconds: { type: Type.NUMBER, description: "两次事件之间的间隔时间（秒）" },
            count: { type: Type.INTEGER, description: "重复次数" },
            effect: { type: Type.STRING },
            filename: { type: Type.STRING },
            intensity: { type: Type.INTEGER },
            baseFrequency: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
            envelope: {
              type: Type.OBJECT,
              properties: {
                p1: { type: Type.OBJECT, properties: { frequencyOffset: { type: Type.INTEGER } }, required: ["frequencyOffset"] },
                p2: { type: Type.OBJECT, properties: { timeRatio: { type: Type.NUMBER }, intensityRatio: { type: Type.NUMBER }, frequencyOffset: { type: Type.INTEGER } }, required: ["timeRatio", "intensityRatio", "frequencyOffset"] },
                p3: { type: Type.OBJECT, properties: { timeRatio: { type: Type.NUMBER }, intensityRatio: { type: Type.NUMBER }, frequencyOffset: { type: Type.INTEGER } }, required: ["timeRatio", "intensityRatio", "frequencyOffset"] },
                p4: { type: Type.OBJECT, properties: { frequencyOffset: { type: Type.INTEGER } }, required: ["frequencyOffset"] },
              },
              required: ["p1", "p2", "p3", "p4"]
            }
          },
          required: ["vibrationType", "durationSeconds", "intervalSeconds", "count", "effect", "filename", "intensity", "baseFrequency", "reasoning", "envelope"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      vibrationType: result.vibrationType === 'transient' ? 'transient' : 'continuous',
      durationSeconds: Number(result.durationSeconds) || 0.05,
      intervalSeconds: Number(result.intervalSeconds) || 0.1,
      count: Number(result.count) || 1,
      effect: result.effect || "Unknown",
      filename: result.filename || "vibration_effect",
      intensity: Math.min(100, Math.max(0, result.intensity)),
      baseFrequency: Math.min(100, Math.max(0, result.baseFrequency)),
      reasoning: result.reasoning || "无设计说明",
      envelope: result.envelope
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("参数分析失败。");
  }
};
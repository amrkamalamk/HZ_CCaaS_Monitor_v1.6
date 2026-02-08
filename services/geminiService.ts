
import { GoogleGenAI } from "@google/genai";
import { MOSDataPoint } from "../types";

export const analyzeMOSPerformance = async (data: MOSDataPoint[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("RE-AUTH_REQUIRED");
  }

  // Initialize with named parameter as per guidelines
  // GUIDELINE: Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Provide enough context for the model to see trends
  const recentData = data.slice(-50); 
  const dataSummary = recentData.map(d => `[${d.timestamp}] MOS: ${d.mos}, Volume: ${d.conversationsCount}`).join('\n');

  const systemInstruction = `You are a World-Class Senior Telecom and Network Quality Engineer. 
    Analyze the Mean Opinion Score (MOS) and traffic telemetry from Genesys Cloud UAE region.
    
    STRICT FORMATTING RULES:
    1. Organize your output into CLEAR SECTIONS using Markdown headers (##).
    2. Use bullet points (-) for observations.
    3. Use bold text (**) for critical metrics or timestamps.
    4. Use emojis in headers to make it visually engaging.
    5. Always conclude with a specific technical hypothesis.

    EXPECTED SECTIONS:
    ## 📊 Executive Quality Summary
    Summarize the overall voice health of the shift.
    
    ## 📈 Detailed Trend Analysis
    Break down specific intervals where MOS dipped below 4.0 or traffic spikes affected quality.
    
    ## 🔬 Technical Root Cause Hypotheses
    Discuss potential network-layer issues (Jitter, Packet Loss, Codec negotiation, or ISP Peering in Dubai/UAE).
    
    ## 🛠️ Actionable Engineering Recommendations
    Provide 3 concrete steps for the network team to optimize performance.

    Maintain a professional, data-driven, and authoritative tone.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using pro for complex reasoning
      contents: `TELEMETRY DATA FOR ANALYSIS:\n${dataSummary}`,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 4000 } // Added thinking budget for Gemini 3 Pro
      }
    });
    
    // GUIDELINE: .text is a property, not a method
    return response.text || "Forensic analysis yielded no results.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // GUIDELINE: Reset key selection if "Requested entity was not found" or other auth errors occur
    if (
      error.message?.includes("API key not found") || 
      error.message?.includes("invalid") || 
      error.message?.includes("403") ||
      error.message?.includes("Requested entity was not found")
    ) {
      throw new Error("RE-AUTH_REQUIRED");
    }
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("AI Quota Exceeded. Please try again in a few minutes.");
    }
    throw error;
  }
};

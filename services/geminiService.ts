
import { GoogleGenAI } from "@google/genai";
import { DataRecord } from "../types";

export const getFinancialInsight = async (records: DataRecord[]): Promise<string> => {
  if (!process.env.API_KEY || records.length === 0) return "Provide data to generate AI insights.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = records.map(r => 
    `${r.name}: Rev ${r.dollarsCollected}, Exp ${r.expenseIncurred}, Net ${r.netRevenue}`
  ).join("; ");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these financial records and provide a 1-sentence executive summary highlighting the most critical trend or concern. Records: ${summary}`,
      config: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });
    return response.text || "Insight unavailable.";
  } catch (error) {
    console.error("Gemini insight error:", error);
    return "Error generating AI insights.";
  }
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SkinAnalysisResult {
  skinType: string;
  radarData: { name: string; value: number }[];
  problems: string[];
  riskLevels: {
    sensitivity: "High" | "Medium" | "Low";
    acne: "High" | "Medium" | "Low";
  };
  suggestions: string[];
  routine: {
    morning: string[];
    evening: string[];
  };
}

export async function analyzeSkin(imageData: string): Promise<SkinAnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            text: "Analyze this facial skin photo for a professional skin health report. Return a structured JSON report. Ensure radarData contains values for 'Oil', 'Moisture', 'Sensitivity', 'Barrier', 'Elasticity' from 0-100. Problems should be short tags like 'Redness', 'Pores'. Routine should be practical steps.",
          },
          {
            inlineData: {
              data: imageData.split(",")[1], // Strip data prefix
              mimeType: "image/jpeg",
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["skinType", "radarData", "problems", "riskLevels", "suggestions", "routine"],
        properties: {
          skinType: { type: Type.STRING },
          radarData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
              },
            },
          },
          problems: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskLevels: {
            type: Type.OBJECT,
            properties: {
              sensitivity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              acne: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            },
          },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          routine: {
            type: Type.OBJECT,
            properties: {
              morning: { type: Type.ARRAY, items: { type: Type.STRING } },
              evening: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text);
}

export async function consultAI(message: string, history: { role: string; content: string }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are a professional AI dermatologist named SkinGPT. Answer concerns about skin health. For each answer, use this structure: \n### Judgment: [What it might be]\n### Reason: [Why it is happening]\n### Recommendation: [What to do]\nKeep it structured and medical-professional but accessible.",
    },
  });

  // History mapping if needed, but SDK usually handles it if we pass it
  // For simplicity here, just send the latest with context if requested
  const response = await chat.sendMessage({
    message: message,
  });

  return response.text;
}

export async function analyzeIngredients(ingredients: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these skincare ingredients for a skin health app: "${ingredients}". Return JSON with 'riskIngredients' (objects with name and reason), 'safeIngredients' (objects with name and benefit), and 'suitableSkinTypes' (text).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["riskIngredients", "safeIngredients", "suitableSkinTypes"],
        properties: {
          riskIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
            },
          },
          safeIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                benefit: { type: Type.STRING },
              },
            },
          },
          suitableSkinTypes: { type: Type.STRING },
          safetyRating: { type: Type.NUMBER, description: "0-10 safety score" },
        },
      },
    },
  });

  return JSON.parse(response.text);
}

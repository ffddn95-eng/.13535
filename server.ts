import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { calculateScores, generateTemplateActions, type IdeaAnalysisData } from "./src/lib/scoringEngine.js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/test-env", (req, res) => {
    res.json({
      hasGeminiKey: !!process.env.GEMINI_API_KEY1,
      allKeys: Object.keys(process.env)
    });
  });

  // API Route for Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { idea } = req.body;
      if (!idea) {
        return res.status(400).json({ error: "No idea provided." });
      }

      try {
        const apiKey = process.env.GEMINI_API_KEY1;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY1 is not set. Cannot run full AI analysis.");
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const responseSchema: Schema = {
          type: Type.OBJECT,
          properties: {
            oneLineConclusion: { type: Type.STRING, description: "One-line AI conclusion in English." },
            overallScore: { type: Type.INTEGER, description: "Overall viability score 1-100." },
            verdict: { type: Type.STRING, description: "GO, PIVOT, or STOP." },
            scores: {
              type: Type.OBJECT,
              properties: {
                marketDemand: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, explanation: { type: Type.STRING } },
                  required: ["score", "explanation"]
                },
                executionFeasibility: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, explanation: { type: Type.STRING } },
                  required: ["score", "explanation"]
                },
                firstRevenuePotential: {
                  type: Type.OBJECT,
                  properties: { level: { type: Type.STRING }, explanation: { type: Type.STRING } },
                  required: ["level", "explanation"]
                },
                operationalRisk: {
                  type: Type.OBJECT,
                  properties: { level: { type: Type.STRING }, explanation: { type: Type.STRING } },
                  required: ["level", "explanation"]
                },
                competitionLevel: {
                  type: Type.OBJECT,
                  properties: { level: { type: Type.STRING }, explanation: { type: Type.STRING } },
                  required: ["level", "explanation"]
                },
                differentiationPotential: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, explanation: { type: Type.STRING } },
                  required: ["score", "explanation"]
                },
                scalability: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, explanation: { type: Type.STRING } },
                  required: ["score", "explanation"]
                },
                retentionPotential: {
                  type: Type.OBJECT,
                  properties: { score: { type: Type.INTEGER }, explanation: { type: Type.STRING } },
                  required: ["score", "explanation"]
                }
              },
              required: [
                "marketDemand", "executionFeasibility", "firstRevenuePotential",
                "operationalRisk", "competitionLevel", "differentiationPotential",
                "scalability", "retentionPotential"
              ]
            },
            failureReasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of potential failure reasons."
            },
            userCompatibility: { type: Type.STRING, description: "User compatibility assessment in English." },
            firstActionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 highly actionable steps to execute TODAY."
            },
            executionTimeline: {
              type: Type.OBJECT,
              properties: {
                day1: { type: Type.STRING },
                day3: { type: Type.STRING },
                day7: { type: Type.STRING }
              },
              required: ["day1", "day3", "day7"],
              description: "What to do on day 1, day 3, and day 7."
            },
            hookAnalysis: {
              type: Type.OBJECT,
              properties: {
                trigger: { type: Type.STRING },
                action: { type: Type.STRING },
                variableReward: { type: Type.STRING },
                investment: { type: Type.STRING }
              },
              required: ["trigger", "action", "variableReward", "investment"]
            },
            conversionStrategy: {
              type: Type.OBJECT,
              properties: {
                anchoring: { type: Type.STRING },
                charmPricing: { type: Type.STRING },
                scarcity: { type: Type.STRING }
              },
              required: ["anchoring", "charmPricing", "scarcity"]
            }
          },
          required: [
            "oneLineConclusion", "overallScore", "verdict", "scores",
            "failureReasons", "userCompatibility", "firstActionSteps",
            "executionTimeline", "hookAnalysis", "conversionStrategy"
          ]
        };

        const aiPrompt = `Analyze the following business idea completely. Provide all required details in ENGLISH.
        Be utterly ruthless and objective. No sugar-coating.
        Idea: "${idea}"`;

        const geminiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: aiPrompt,
          config: {
            systemInstruction: "You are an AI research assistant. Provide highly objective, fact-based analysis in English. Return valid JSON matching the schema precisely.",
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.2,
          },
        });

        const text = geminiResponse.text;
        if (!text) throw new Error("Empty response from AI");
        const finalResult = JSON.parse(text);
        
        res.json(finalResult);
      } catch (e: any) {
        console.error("Gemini API Error:", e);
        res.status(500).json({ error: e.message || "AI Analysis Failed" });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

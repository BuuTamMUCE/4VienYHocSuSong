import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_REWRITER, REFERENCE_PROMPT, MC_NATIONALITIES } from "../constants";
import { AspectRatioType, Slide, MCAgeGroup, MCGenre, MCNationality, ContentMode, ValidationResult } from "../types";
import { getLearnedRules, learnFromError } from "../utils/feedbackManager";

// Helper to get client with current key
const getClient = () => {
  // Priority: 1. Session Storage (Manual Input - Developer Override) 2. Environment Variable
  const manualKey = sessionStorage.getItem('GEMINI_API_KEY');
  const apiKey = manualKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found. Please select or enter a key.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to clean Markdown JSON code blocks and REPAIR truncated JSON
const cleanAndParseJSON = (text: string | undefined, defaultValue: any = {}) => {
  if (!text) return defaultValue;
  let cleanText = text.trim();
  
  // 1. Remove Markdown syntax
  cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

  // 2. Smart extraction: find the first '[' or '{'
  const firstOpenBrace = cleanText.indexOf('{');
  const firstOpenBracket = cleanText.indexOf('[');
  let startIndex = -1;
  let isArray = false;

  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
      if (firstOpenBracket < firstOpenBrace) {
          startIndex = firstOpenBracket;
          isArray = true;
      } else {
          startIndex = firstOpenBrace;
      }
  } else if (firstOpenBrace !== -1) {
      startIndex = firstOpenBrace;
  } else if (firstOpenBracket !== -1) {
      startIndex = firstOpenBracket;
      isArray = true;
  }

  if (startIndex !== -1) {
      cleanText = cleanText.substring(startIndex);
      
      // 3. Auto-repair for Truncated Arrays
      if (isArray && !cleanText.endsWith(']')) {
          const lastCloseBrace = cleanText.lastIndexOf('}');
          if (lastCloseBrace !== -1) {
              cleanText = cleanText.substring(0, lastCloseBrace + 1);
              cleanText += ']';
          }
      } else if (!isArray && !cleanText.endsWith('}')) {
          const lastCloseBrace = cleanText.lastIndexOf('}');
          if (lastCloseBrace !== -1) {
              cleanText = cleanText.substring(0, lastCloseBrace + 1);
          }
      }
  }

  try {
      return JSON.parse(cleanText);
  } catch (e) {
      try {
          const fixedText = cleanText.replace(/("(?:\\.|[^"\\])*")/g, (match) => {
              return match
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r")
                  .replace(/\t/g, "\\t");
          });
          return JSON.parse(fixedText);
      } catch (e2) {
          console.error("Failed to parse JSON response:", e, text);
          return defaultValue;
      }
  }
};

// UNIVERSAL RETRY WRAPPER FOR API CALLS
const callGeminiWithRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      attempt++;
      const errorMessage = error.message || "";
      
      const isDailyQuota = errorMessage.includes("GenerateRequestsPerDay") || errorMessage.includes("per_day") || errorMessage.includes("DAILY_QUOTA_EXCEEDED");
      const isPermissionDenied = errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED");

      if (isDailyQuota) throw new Error("DAILY_QUOTA_EXCEEDED");
      if (isPermissionDenied) throw new Error("PERMISSION_DENIED");

      const isRateLimit = errorMessage.includes("429") || errorMessage.includes("Quota");
      const isServerError = errorMessage.includes("500");

      if (attempt >= maxRetries) throw error;

      let waitTime = baseDelay * Math.pow(2, attempt);
      if (isRateLimit) waitTime = 10000 * attempt;
      
      console.warn(`Retry attempt ${attempt}...`);
      await delay(waitTime);
    }
  }
  throw new Error("Max retries reached");
};

// [GATEKEEPER] Validate and Optimize Prompt
export const validateAndOptimizePrompt = async (
  title: string, 
  body: string, 
  currentVisualPrompt: string, 
  mode: string,
  subtitle?: string
): Promise<ValidationResult> => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const systemInstruction = `
      ROLE: Quality Control for 'Viện Y Học Sự Sống'.
      TASK: Review and Optimize the User's input.
      OUTPUT JSON: { "optimizedTitle": "...", "optimizedSubtitle": "...", "optimizedPrompt": "...", "analysis": "..." }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `MODE: ${mode}\nTITLE: ${title}\nSUBTITLE: ${subtitle}\nPROMPT: ${currentVisualPrompt}`,
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return cleanAndParseJSON(response.text, { 
      optimizedTitle: title, 
      optimizedSubtitle: subtitle || "",
      optimizedPrompt: currentVisualPrompt, 
      analysis: "No changes." 
    });
  });
};

// [ACTIVE LEARNING] Auto-Fix Prompt
export const autoFixPrompt = async (
  originalPrompt: string, 
  errorDescription: string,
  mode: string = 'GENERAL'
): Promise<string> => {
    return callGeminiWithRetry(async () => {
      const ai = getClient();
      const systemInstruction = `
        ROLE: Error Recovery Specialist.
        TASK: Fix a Visual Prompt based on user complaint.
        OUTPUT JSON: { "fixedPrompt": "...", "preventativeRule": "..." }
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Original: "${originalPrompt}"\nComplaint: "${errorDescription}"`,
        config: { systemInstruction, responseMimeType: "application/json" }
      });
      const result = cleanAndParseJSON(response.text, { fixedPrompt: originalPrompt, preventativeRule: "" });
      if (result.preventativeRule) learnFromError(errorDescription, originalPrompt, result.preventativeRule, mode);
      return result.fixedPrompt;
    });
};

// Check Content Density
export const checkContentDensity = async (title: string, body: string): Promise<{ isSafe: boolean; message: string }> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze density. Title: "${title}". Body: "${body}". Max 50 words. JSON: { "isSafe": boolean, "message": "string" }`,
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text, { isSafe: true, message: "" });
    });
};

// --- RESTORED & REFACTORED FUNCTIONS ---

// Rewrite User Topic
export const rewritePromptService = async (userTopic: string): Promise<string> => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userTopic,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REWRITER,
      }
    });
    return response.text || "";
  });
};

// NEW: Generate Infographic Image via Python Backend (BFF)
export const generateInfographicImage = async (
  prompt: string,
  aspectRatio: AspectRatioType,
  referenceImage?: string | null, // Kept for UI signature, but not used in V1 backend
  projectorImage?: string | null, // Kept for UI signature
  feedback?: string,
  textOverlay?: { title: string; body: string; subtitle?: string }, // Kept for UI signature
  mode: string = 'SINGLE'
): Promise<{ url: string; engine: string }> => {
    
    let finalPrompt = prompt;
    if (feedback) {
        finalPrompt += ` . Note: ${feedback}`;
    }

    try {
        // Call the new Backend API
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: finalPrompt,
                aspectRatio: aspectRatio
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.imageUrl) {
            // Using Vertex AI (Imagen) via Backend
            return { url: data.imageUrl, engine: 'VERTEX_IMAGEN' };
        } else {
             throw new Error(data.error || "No image URL returned from backend");
        }

    } catch (error) {
        console.error("Backend Image Gen Error", error);
        throw error;
    }
};

// Generate Slide Deck Prompts (Text - Client Side)
export const generateSlideDeckPrompts = async (topic: string, slideCount: number = 5, contentMode: ContentMode = 'CREATIVE'): Promise<Slide[]> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const systemInstruction = `
            ROLE: Educational Content Strategist.
            TASK: Create a ${slideCount}-slide outline for topic "${topic}".
            OUTPUT: JSON Array of objects { "id": number, "title": "string", "content": "string", "prompt": "visual description" }.
            STYLE: ${contentMode === 'EXACT' ? 'Strictly follow user topic' : 'Creative and engaging'}.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ${slideCount} slides for: ${topic}`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        const data = cleanAndParseJSON(response.text, []);
        return Array.isArray(data) ? data : [];
    });
};

// Generate MC Scripts (Text - Client Side)
export const generateMCScripts = async (topic: string, age: MCAgeGroup, genre: MCGenre, nationality: MCNationality): Promise<{intro: {script: string, visualPrompt: string, videoPrompt: string}, outro: {script: string, visualPrompt: string, videoPrompt: string}}> => {
     return callGeminiWithRetry(async () => {
        const ai = getClient();
        const natInfo = MC_NATIONALITIES.find(n => n.value === nationality);
        const systemInstruction = `
            ROLE: TV Producer.
            TASK: Write Intro and Outro scripts for a virtual MC.
            CONTEXT: Topic "${topic}". Age: ${age}. Genre: ${genre}. Nationality: ${natInfo?.label}.
            OUTPUT JSON: { 
                "intro": { "script": "...", "visualPrompt": "...", "videoPrompt": "..." }, 
                "outro": { "script": "...", "visualPrompt": "...", "videoPrompt": "..." } 
            }
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate scripts for topic: ${topic}`,
            config: { systemInstruction, responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text, { intro: {}, outro: {} });
     });
};

// Transform Slide Image to Prompt (Text/Vision - Client Side)
export const transformSlideImageToPrompt = async (base64Image: string): Promise<{ title: string; content: string; prompt: string }> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
                { text: "Analyze this slide. Extract Title, Content, and write a visual prompt to recreate it in 3D Eco style. JSON: { title, content, prompt }" }
            ],
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text, { title: "", content: "", prompt: "" });
    });
};

// Generate Time Based Slide Deck (Text - Client Side)
export const generateTimeBasedSlideDeck = async (script: string, durationMinutes: number, customCount?: number): Promise<Slide[]> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const slideCount = customCount || Math.ceil((durationMinutes * 60) / 32);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Split this script into ${slideCount} slides. Script: ${script}`,
            config: { 
                systemInstruction: "Output JSON Array: [{id, title, content, prompt}].",
                responseMimeType: "application/json" 
            }
        });
        const data = cleanAndParseJSON(response.text, []);
        return Array.isArray(data) ? data : [];
    });
};

// Regenerate Prompt from Content
export const regeneratePromptFromContent = async (title: string, content: string): Promise<string> => {
     return callGeminiWithRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a 3D visual prompt for: Title "${title}", Content "${content}"`,
            config: { systemInstruction: SYSTEM_INSTRUCTION_REWRITER }
        });
        return response.text || "";
     });
};

// Optimize Slide Prompt
export const optimizeSlidePromptWithVerification = async (title: string, content: string, titleColor: string, bodyColor: string): Promise<string> => {
    return regeneratePromptFromContent(title, content); // Re-use logic for now
};

// Optimize Thumbnail Prompt
export const optimizeThumbnailPrompt = async (topic: string, hasAvatar: boolean): Promise<string> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a viral YouTube thumbnail prompt for: "${topic}". Avatar: ${hasAvatar}.`,
            config: { systemInstruction: SYSTEM_INSTRUCTION_REWRITER }
        });
        return response.text || "";
    });
};
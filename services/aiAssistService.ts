
import { GoogleGenAI } from "@google/genai";
import { BASE_PRICE_IMAGE_USD, FALLBACK_EXCHANGE_RATE } from "../constants";

// Helper to get client with current key (Duplicated logic to ensure independence)
const getClient = () => {
  const manualKey = sessionStorage.getItem('GEMINI_API_KEY');
  const apiKey = manualKey || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found.");
  return new GoogleGenAI({ apiKey });
};

// 1. SMART REWRITE SERVICE
export const rewriteTextWithAI = async (currentText: string, userCommand: string): Promise<string> => {
  try {
    const ai = getClient();
    const systemInstruction = `
      ROLE: Professional Copywriter & Content Editor for 'Viện Y Học Sự Sống'.
      TASK: Rewrite the provided text based strictly on the user's command.
      
      CONTEXT: The text is used for Infographic Slides or Thumbnails.
      CONSTRAINTS:
      1. Keep it concise, impactful, and easy to read on images.
      2. If the command is "Translate", translate accurately.
      3. If the command is "Shorten", summarize the key points.
      4. RETURN ONLY THE REWRITTEN TEXT. Do not add explanations or quotes.
      5. Tone: Professional, Ecological, Inspiring.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `ORIGINAL TEXT: "${currentText}"\n\nUSER COMMAND: "${userCommand}"\n\nREWRITTEN TEXT:`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    return response.text?.trim() || currentText;
  } catch (error) {
    console.error("AI Rewrite Error:", error);
    throw error;
  }
};

// 2. APP EXPERT GUIDE SERVICE
export const chatWithAppExpert = async (
  history: { role: 'user' | 'model'; text: string }[], 
  currentMode: string,
  accumulatedCost: number
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Calculate roughly estimates
    const pricePerImage = Math.ceil(BASE_PRICE_IMAGE_USD * FALLBACK_EXCHANGE_RATE); // ~760 VND

    const systemInstruction = `
      ROLE: AI Expert Guide for the 'Viện Y Học Sự Sống' Content Generator App.
      YOUR GOAL: Help the user use the app effectively, understand costs, and create better content.
      
      APP KNOWLEDGE BASE (DOCUMENTATION):
      1. COST: Generating 1 Image costs approximately ${pricePerImage} VND (NanoBanana 3.0 Pro). Text processing is very cheap (Flash).
      2. THUMBNAIL RULES: 
         - Titles must be UPPERCASE.
         - Subtitles should be lowercase.
         - SAFE ZONE: The bottom 30% of the image is strictly FORBIDDEN for text.
         - LAYOUT: Text on Left (60%), Visual on Right (40%).
      3. WORKFLOW: Input Topic -> Preview/Edit Text -> Generate Image.
      4. FEATURES:
         - 'Single': 1 Image.
         - 'Slide Deck': Multiple slides.
         - 'MC Studio': Virtual News Studio (Veo 3 inputs).
         - 'Remake': Upload old slide to modernize it.
      
      CURRENT USER CONTEXT:
      - Current Mode: ${currentMode}
      - Total Spent Session: ${accumulatedCost.toLocaleString()} VND
      
      BEHAVIOR:
      - Answer briefly and helpfully in Vietnamese.
      - If user asks about cost, use the provided session data.
      - If user asks about design, remind them of the Safe Zones.
      - Be friendly and encouraging (Tone: Sứ giả sự sống).
    `;

    // Convert history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    return response.text?.trim() || "Xin lỗi, tôi đang mất kết nối với máy chủ.";
  } catch (error) {
    console.error("App Expert Error:", error);
    return "Hệ thống AI đang bận, vui lòng thử lại sau.";
  }
};

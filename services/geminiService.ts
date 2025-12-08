

import { GoogleGenAI, Type } from "@google/genai";
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

// --- HYBRID CLOUD: REPLICATE CLIENT CONFIGURATION ---
const getReplicateToken = () => {
    // Try to get from Session Storage (Dev override) or Environment
    return sessionStorage.getItem('REPLICATE_API_TOKEN') || process.env.REPLICATE_API_TOKEN;
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
      // If it looks like an array start but doesn't end with ']', try to fix it
      if (isArray && !cleanText.endsWith(']')) {
          // Check if it ends with a closing brace of an item '},' or '}'
          const lastCloseBrace = cleanText.lastIndexOf('}');
          if (lastCloseBrace !== -1) {
              // Cut off everything after the last valid object
              cleanText = cleanText.substring(0, lastCloseBrace + 1);
              // Close the array
              cleanText += ']';
          }
      } else if (!isArray && !cleanText.endsWith('}')) {
          // For objects, ensure we cut off trailing garbage if it doesn't end cleanly
          const lastCloseBrace = cleanText.lastIndexOf('}');
          if (lastCloseBrace !== -1) {
              cleanText = cleanText.substring(0, lastCloseBrace + 1);
          }
      }
  }

  try {
      return JSON.parse(cleanText);
  } catch (e) {
      // 4. Fallback: aggressive escape for control characters inside strings
      // This handles the common error "Bad control character in string literal"
      // which happens when LLMs output raw newlines inside JSON strings.
      try {
          // Regex to match valid JSON strings: " ( escaped char OR not \ and not " )* "
          const fixedText = cleanText.replace(/("(?:\\.|[^"\\])*")/g, (match) => {
              // Replace literal control characters with their escaped versions inside the string
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

// Helper to ensure content is always string (fixes React Error #31)
const sanitizeContent = (input: any): string => {
  if (!input) return "";
  if (typeof input === 'string') return input;
  
  if (Array.isArray(input)) {
    return input.map(i => sanitizeContent(i)).join('\n\n');
  }
  
  if (typeof input === 'object') {
    // Check for the specific structure causing the error {heading, text}
    if (input.heading && input.text) {
      return `${input.heading}\n\n${input.text}`;
    }
    // Generic object handling: join values
    return Object.values(input).map(v => sanitizeContent(v)).join('\n\n');
  }
  
  return String(input);
};

// Helper specifically for Video Prompts to preserve Keys (SCENE, SHOT, etc.)
const formatVideoPromptString = (input: any): string => {
  if (!input) return "";
  if (typeof input === 'string') return input;

  if (Array.isArray(input)) {
    return input.map(i => formatVideoPromptString(i)).join('\n\n');
  }

  if (typeof input === 'object') {
    // Convert object { KEY: "Value" } to string "KEY: Value"
    return Object.entries(input)
      .map(([key, value]) => {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `${key.toUpperCase()}: ${valStr}`;
      })
      .join('. '); 
  }

  return String(input);
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
      // Check for Daily Quota Exhaustion (Fatal)
      const isDailyQuota = errorMessage.includes("GenerateRequestsPerDay") || 
                           errorMessage.includes("per_day") ||
                           errorMessage.includes("DAILY_QUOTA_EXCEEDED");
      
      // Check for Permission Denied (Invalid Key/Billing)
      const isPermissionDenied = errorMessage.includes("403") || 
                                 errorMessage.includes("PERMISSION_DENIED") || 
                                 errorMessage.includes("The caller does not have permission");

      if (isDailyQuota) {
         console.error("Fatal Error: Daily Quota Exceeded.");
         throw new Error("DAILY_QUOTA_EXCEEDED");
      }

      if (isPermissionDenied) {
          console.error("Fatal Error: Permission Denied (Check API Key).");
          throw new Error("PERMISSION_DENIED");
      }

      // Check for Retryable Errors
      const isRateLimit = errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("Resource has been exhausted");
      const isServerError = errorMessage.includes("500") || errorMessage.includes("Internal error") || errorMessage.includes("Overloaded");

      if (attempt >= maxRetries) {
        console.error(`Max retries reached after ${attempt} attempts.`);
        throw error;
      }

      // Calculate delay
      let waitTime = baseDelay * Math.pow(2, attempt); // Exponential backoff (2s, 4s, 8s...)
      
      if (isRateLimit) {
         // Try to parse specific retry time from error message
         const match = errorMessage.match(/retry in (\d+(\.\d+)?)s/);
         if (match && match[1]) {
             waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 1000; // Add 1s buffer
         } else {
             waitTime = 10000 * attempt; // Default long wait for rate limits (10s, 20s...)
         }
         console.warn(`Rate limit hit. Retrying in ${waitTime}ms... (Attempt ${attempt}/${maxRetries})`);
      } else if (isServerError) {
         console.warn(`Server error 500. Retrying in ${waitTime}ms...`);
      } else {
         // If it's a 400 or unknown error, rethrow immediately unless we want to be very safe
         throw error;
      }

      await delay(waitTime);
    }
  }
  throw new Error("Max retries reached");
};

// [PROTOCOL UPDATE] UNIFIED TEXT RENDERING PROTOCOL
const STRICT_QUALITY_RULES = `
. UNIFIED TEXT RENDERING PROTOCOL (VERBATIM ENFORCEMENT):
  1. **EXACT TEXT MATCH**: The text in the image MUST match the provided Title and Body JSON fields character-for-character.
  2. **NO HALLUCINATIONS**: Do NOT summarize, rewrite, or translate the text. Render it exactly as given.
  3. **LEGIBILITY**: Text must be placed on "Frosted Glass" or "Dark Semi-Transparent Panels" to ensure 100% readability against the water background.
  4. **VISUAL STYLE**: High-End Ecological Water Futuristic Theme (3D, Clean, Hologram).
  5. **3D SIMULATION**: Generate 3D Objects that physically represent the keywords (e.g., 'Virus' = 3D Spiky Sphere).
`;

// ============================================================================
// NEW SERVICES: UNIFIED COMMAND CONSOLE (GATEKEEPER)
// ============================================================================

/**
 * [GATEKEEPER] Validate and Optimize Prompt based on Mode (Thumbnail Enforcer)
 * Uses Gemini 2.5 Flash to scan and fix the prompt before generation.
 */
export const validateAndOptimizePrompt = async (
  title: string, 
  body: string, 
  currentVisualPrompt: string, 
  mode: string,
  subtitle?: string // Added Subtitle support
): Promise<ValidationResult> => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const isThumbnail = mode === 'THUMBNAIL';

    const systemInstruction = `
      ROLE: Quality Control & Prompt Engineer for 'Viện Y Học Sự Sống'.
      TASK: Review and Optimize the User's input for an Image Generator (FLUX.1 & Nanobana).

      **RULES FOR THUMBNAIL MODE (CRITICAL - UPDATED):**
      1. **TITLE ENFORCEMENT**: Title MUST be Vietnamese Uppercase (IN HOA). Convert if needed.
      2. **SUBTITLE ENFORCEMENT**: Subtitle MUST be **lowercase (chữ thường)**. NEVER use UPPERCASE for subtitle. It must be transparent, no box background.
      3. **VISUAL ENFORCEMENT**:
         - **SAFE ZONE (Bottom 30%)**: Absolutely NO text in the bottom 30% of the image. All text must be in Top 70%.
         - **LAYOUT**: Left side for Text (Top 70%), Right side for Visuals.
         - Add "Safe Zone for Avatar" (Right Side).
         - Add "High Contrast", "Pop-out 3D Text style", "Big Bold Typography" for Title.
      
      **RULES FOR SLIDE/SINGLE MODE (STRICT VISUAL STYLE):**
      1. **3D OBJECTS**: Must describe physical 3D objects (Glossy/Glass/Water). NO flat icons.
      2. **BACKGROUND**: Bio-luminescent water, clean ecology atmosphere.
      3. **TEXT PANELS**: Text must be on Frosted Glass (Kính mờ) to ensure readability.

      OUTPUT JSON (RFC 8259 Compliant):
      {
        "optimizedTitle": "...",
        "optimizedSubtitle": "...", 
        "optimizedPrompt": "...",
        "analysis": "Brief explanation of what was fixed"
      }
      IMPORTANT: Escape all newlines in strings as \\n. No raw control characters.
    `;

    const userContent = `
      MODE: ${mode}
      CURRENT TITLE: "${title}"
      ${subtitle ? `CURRENT SUBTITLE: "${subtitle}"` : ''}
      CURRENT VISUAL PROMPT: "${currentVisualPrompt}"
      
      ACTION: Validate and Optimize.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    return cleanAndParseJSON(response.text, { 
      optimizedTitle: title, 
      optimizedSubtitle: subtitle || "",
      optimizedPrompt: currentVisualPrompt, 
      analysis: "No changes." 
    });
  });
};

/**
 * [ACTIVE LEARNING] Auto-Fix Prompt based on Error Feedback
 * Now saves the learned rule to localStorage with CONTEXT SCOPE.
 */
export const autoFixPrompt = async (
  originalPrompt: string, 
  errorDescription: string,
  mode: string = 'GENERAL'
): Promise<string> => {
    return callGeminiWithRetry(async () => {
      const ai = getClient();
      const systemInstruction = `
        ROLE: Error Recovery Specialist & System Trainer.
        TASK: Fix a Visual Prompt based on user complaint AND derive a general rule to prevent this in the future.
        
        INPUT:
        - Original Prompt
        - User Complaint (e.g., "Text is too small", "Face is covered", "Wrong color")
        - Mode: ${mode}

        ACTION: 
        1. Analyze the complaint relative to the Mode (e.g., Thumbnail rules vs Slide rules).
        2. Rewrite the prompt to SOLVE the problem immediately.
        3. Formulate a short "Preventative Rule" (e.g., "For Thumbnails, always use lowercase subtitles").
        
        OUTPUT JSON:
        {
           "fixedPrompt": "...",
           "preventativeRule": "..."
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Original: "${originalPrompt}"\nComplaint: "${errorDescription}"`,
        config: { systemInstruction, responseMimeType: "application/json" }
      });
      
      const result = cleanAndParseJSON(response.text, { fixedPrompt: originalPrompt, preventativeRule: "" });

      // Save the learned rule for future generations with SCOPE
      if (result.preventativeRule) {
          learnFromError(errorDescription, originalPrompt, result.preventativeRule, mode);
      }

      return `${result.fixedPrompt} ${STRICT_QUALITY_RULES}`;
    });
};

// ============================================================================
// EXISTING SERVICES
// ============================================================================

/**
 * [NEW SERVICE] Check Content Density using Gemini 2.5 Flash
 * Prevents text overflow before generation.
 */
export const checkContentDensity = async (title: string, body: string): Promise<{ isSafe: boolean; message: string }> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this text for an infographic slide.
            Title: "${title}"
            Body: "${body}"
            
            Rule: Max 50 words total. If shorter, it is SAFE. If longer, it is UNSAFE.
            Output JSON: { "isSafe": boolean, "message": "Short warning in Vietnamese if unsafe" }`,
            config: { responseMimeType: "application/json" }
        });
        
        return cleanAndParseJSON(response.text, { isSafe: true, message: "" });
    });
};

/**
 * Rewrites a simple user topic into a complex prompt
 * USES: gemini-2.5-flash (Quota efficient)
 */
export const rewritePromptService = async (userTopic: string): Promise<string> => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const learnedRules = getLearnedRules('SINGLE'); // Default Single mode rules
    
    // Explicitly using SYSTEM_INSTRUCTION_REWRITER which strictly defines the output style
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Chủ đề của tôi là: "${userTopic}". Hãy viết prompt tạo ảnh infographic.
      YÊU CẦU QUAN TRỌNG: 
      1. Tạo nội dung text chính xác, không bịa đặt số liệu y khoa.
      2. Đảm bảo độ tương phản cao nhất giữa chữ và nền (Maximum Contrast).
      3. MÔ PHỎNG 3D: Mỗi ý chính phải được minh họa bằng vật thể 3D nổi khối (không phải icon phẳng).
      4. CĂN CHỈNH: Sắp xếp bố cục hài hòa, cân đối.
      5. Tuân thủ cấu trúc mẫu REFERENCE_PROMPT.
      6. SỬ DỤNG CHUẨN VISUAL ĐÀO TẠO (EDUCATIONAL_MASTERY): Ánh sáng High-Key, Chữ cực lớn (Massive), Nền kính mờ rõ ràng.
      ${learnedRules}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_REWRITER,
        temperature: 0.7, 
        tools: [{ googleSearch: {} }] 
      }
    });
    return response.text || "";
  });
};

/**
 * OPTIMIZE THUMBNAIL PROMPT (Youtube SEO Friendly)
 * USES: gemini-2.5-flash (Quota efficient)
 * IMPLEMENTS: Dynamic Layout Rules
 */
export const optimizeThumbnailPrompt = async (userInput: string, hasAvatar: boolean = false): Promise<string> => {
    return callGeminiWithRetry(async () => {
        const ai = getClient();
        const learnedRules = getLearnedRules('THUMBNAIL');

        const systemInstruction = `
            ROLE: YouTube Thumbnail Expert & Visual Director.
            TASK: Create a Visual Description for a Viral YouTube Thumbnail.
            
            **DYNAMIC LAYOUT RULES (ZONING):**
            1. **SPATIAL DIVISION**:
               - **Text Zone**: Left 60% of the screen.
               - **Visual Zone**: Right 40% of the screen (Reserved for Subject/3D Object).
               - **FORBIDDEN ZONE**: Bottom 30% MUST BE EMPTY (Reserved for overlays).
            2. **SAFE ZONES (DO NOT DRAW HERE)**:
               - **Top-Right Corner**: Reserved for Logo overlay.
               - **Bottom-Right Corner**: Reserved for Nameplate overlay.
               ${hasAvatar ? "- **Right Side**: Reserved for Speaker Avatar overlay." : ""}
            3. **BACKGROUND**: "Hyper-realistic 3D Eco-Water", "High Contrast", "Glowing Neon Accents", "Depth of Field".
            4. **NO TEXT IN PROMPT**: Do NOT ask to generate text inside this prompt. Just describe the scene, objects, and lighting.
            
            ${learnedRules}

            OUTPUT FORMAT: Just the visual description string in English.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User Topic: "${userInput}". Create visual background description adhering to zoning rules.`,
            config: { systemInstruction, temperature: 0.7 }
        });

        return `${response.text?.trim()} ${STRICT_QUALITY_RULES}`;
    });
};

/**
 * Generates MC scripts and visual prompts
 * USES: gemini-2.5-flash (Quota efficient)
 */
export const generateMCScripts = async (topic: string, age: MCAgeGroup, genre: MCGenre, nationality: MCNationality) => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const natInfo = MC_NATIONALITIES.find(n => n.value === nationality);
    const visualStyle = natInfo ? natInfo.visual : 'Professional look';
    const language = natInfo ? natInfo.lang : 'Vietnamese';
    
    const systemInstruction = `
      Bạn là Giám đốc sáng tạo và Biên kịch cho kênh "Viện Y Học Sự Sống".
      Nhiệm vụ: Tạo kịch bản, mô tả hình ảnh (Visual Prompt) và Lệnh tạo Video Veo 3 (Video Prompt) cho 2 MC (1 Nam, 1 Nữ).
      
      Thông tin đầu vào:
      - Chủ đề: ${topic}
      - Độ tuổi MC: ${age}
      - Thể loại: ${genre}
      - Quốc gia/Phong cách: ${natInfo?.label} (${visualStyle})
      - Phong cách Visual: Eco-Water Futuristic.

      QUY TẮC JSON (QUAN TRỌNG):
      - Trả về định dạng JSON thuần túy.
      - **ESCAPE DOUBLE QUOTES**: Bắt buộc dùng \\" cho dấu ngoặc kép trong chuỗi.

      YÊU CẦU ĐẦU RA (JSON):
      {
        "intro": { "visualPrompt": "...", "script": "...", "videoPrompt": "..." },
        "outro": { "visualPrompt": "...", "script": "...", "videoPrompt": "..." }
      }

      QUY TẮC CHI TIẾT:
      1. Visual Prompt: MC ngồi tại bàn studio tin tức. **BACKGROUND SCREEN** hiển thị hình ảnh 3D về chủ đề. Không khí sạch, không có vật thể bay trước mặt MC.
      2. Script: Intro (30-50 từ), Outro (30-50 từ) có CTA đăng ký kênh. Ngôn ngữ: ${language}.
      3. Video Prompt (Veo 3): Chia nhỏ script thành các cảnh <8s. Cấu trúc: "TECHNICAL DIRECTIVE. SHOT: Close-up. SUBJECTS: [Nationality] MCs. EXECUTION: [Active Speaker] recites: '[Verbatim Script]'. LIP SYNC: Precise."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Hãy tạo kịch bản MC cho chủ đề "${topic}". Trả về JSON thuần túy.`,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }]
      }
    });

    const rawData = cleanAndParseJSON(response.text, { intro: {}, outro: {} });

    if (rawData.intro) rawData.intro.videoPrompt = formatVideoPromptString(rawData.intro.videoPrompt);
    if (rawData.outro) rawData.outro.videoPrompt = formatVideoPromptString(rawData.outro.videoPrompt);
    if (rawData.intro) rawData.intro.script = sanitizeContent(rawData.intro.script);
    if (rawData.outro) rawData.outro.script = sanitizeContent(rawData.outro.script);

    return rawData;
  });
};

/**
 * Generates slide deck prompts
 * USES: gemini-2.5-flash (Quota efficient)
 */
export const generateSlideDeckPrompts = async (inputContent: string, slideCount: number = 5, contentMode: ContentMode = 'CREATIVE'): Promise<Slide[]> => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const learnedRules = getLearnedRules('SLIDE_DECK');

    let modeInstruction = "";
    if (contentMode === 'EXACT') {
        modeInstruction = `
        **CHẾ ĐỘ SAO CHÉP TUYỆT ĐỐI (EXACT COPY):**
        1. **VERBATIM EXTRACTION**: Nhiệm vụ duy nhất là CẮT văn bản gốc thành ${slideCount} phần.
        2. **NO EDITING**: KHÔNG thêm, KHÔNG bớt, KHÔNG tóm tắt.
        3. 'content' phải chứa chính xác từ ngữ của người dùng.
        `;
    } else {
        modeInstruction = `
        **CHẾ ĐỘ SÁNG TẠO (CREATIVE):**
        - Sáng tạo nội dung chi tiết, hấp dẫn dựa trên chủ đề.
        `;
    }

    // STRICTLY ENFORCED VISUAL STYLE WITH EDUCATIONAL MASTERY
    const systemInstruction = `
      Bạn là chuyên gia thiết kế bài giảng. Tạo BỘ SLIDE gồm chính xác ${slideCount} slide.
      ${modeInstruction}
      
      YÊU CẦU VISUAL (TUÂN THỦ REFERENCE_PROMPT & EDUCATIONAL STANDARD):
      1. **3D VISUALIZATION**: Prompt PHẢI mô tả vật thể 3D nổi khối (3D Object) minh họa cho ý chính. TUYỆT ĐỐI KHÔNG dùng icon 2D phẳng.
      2. **CHẤT LIỆU**: Kính mờ (Frosted Glass), Nước trong suốt, Ánh sáng Neon, Caustics.
      3. **LAYOUT**: Bố cục cân đối, chừa chỗ cho text hiển thị trên tấm kính.
      4. **MÀU SẮC**: Xanh ngọc, Xanh dương, Vàng kim (theo Brand).
      
      **EDUCATIONAL UPGRADE (CẬP NHẬT MỚI):**
      - **LIGHTING**: High-Key, Bright Studio Lighting, No Dark Shadows (Ánh sáng rực rỡ, tích cực).
      - **HIERARCHY**: "Massive 3D Title" (Level 1), "Clear Subtitle" (Level 2), "Readable Body on Glass" (Level 3).
      - Luôn thêm: "visual_strategy": "EDUCATIONAL_MASTERY" vào JSON prompt.

      YÊU CẦU OUTPUT:
      - JSON Array. Escape dấu ngoặc kép (\\").
      ${learnedRules}
      
      Mẫu: [ { "title": "...", "content": "...", "prompt": "Mô tả chi tiết 3D... kèm JSON config" } ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tạo ${slideCount} slide cho: "${inputContent}". Trả về JSON Array.`,
      config: {
        systemInstruction: systemInstruction,
        tools: contentMode === 'CREATIVE' ? [{ googleSearch: {} }] : undefined
      }
    });

    const rawSlides = cleanAndParseJSON(response.text, []);
    
    return rawSlides.map((s: any, index: number) => ({
      id: index + 1,
      title: s.title || `Slide ${index + 1}`,
      content: sanitizeContent(s.content),
      prompt: `${s.prompt} ${STRICT_QUALITY_RULES}`, 
      imageUrl: null,
      status: 'PENDING',
      isOptimized: false
    }));
  });
};

/**
 * Generates time-based slides (Advanced Refactor)
 * USES: gemini-2.5-flash
 */
export const generateTimeBasedSlideDeck = async (
  scriptContent: string, 
  totalMinutes: number,
  customSlideCount?: number
): Promise<Slide[]> => {
  return callGeminiWithRetry(async () => {
    const ai = getClient();
    const learnedRules = getLearnedRules('SLIDE_DECK');
    
    // 1. Determine Slide Count
    let targetSlideCount = customSlideCount;
    if (!targetSlideCount || targetSlideCount <= 0) {
        // Fallback to auto-calculation if custom count is not provided
        const totalSeconds = totalMinutes * 60;
        targetSlideCount = Math.ceil(totalSeconds / 32);
    }
    
    // Safety check for empty script
    if (!scriptContent || scriptContent.trim().length === 0) {
        throw new Error("Nội dung kịch bản trống.");
    }

    // 2. Batching Strategy
    const BATCH_SIZE = 5; 
    const batches = Math.ceil(targetSlideCount / BATCH_SIZE);
    let allSlides: any[] = [];

    const baseSystemInstruction = `
      ROLE: Senior Educational Content Architect & Visual Director.
      TASK: Convert the provided script into a sequence of Presentation Slides.
      
      LOGIC:
      1. **CONTENT ANALYSIS**: Understand the whole script. Extract Key Concepts.
      2. **SEGMENTATION**: Divide the content into exactly ${targetSlideCount} logical segments.
      3. **CONTENT STYLE**: 
         - **MINIMAL TEXT**: Do NOT copy the whole script. Use Keywords, Bullet points, Short phrases for impact. 
         - **DEEP UNDERSTANDING**: Content must convey the core lesson of that segment.
         - **LANGUAGE**: Vietnamese (Correct Spelling).
      4. **VISUAL PROMPT (3D STRICT & EDUCATIONAL):** 
         - Describe a **3D Educational Model** (Glossy 3D Object) that explains the concept.
         - Style: "Eco-Water 3D", "Frosted Glass", "High-Key Lighting" (Bright).
         - Config: Include "visual_strategy": "EDUCATIONAL_MASTERY" for maximum readability.
      ${learnedRules}
      
      OUTPUT FORMAT: JSON Array.
      [ { "title": "Slide Title", "content": "Key bullet points...", "prompt": "Detailed 3D visual description..." } ]
    `;

    // Process in Batches
    for (let i = 0; i < batches; i++) {
        const startSlide = i * BATCH_SIZE + 1;
        const endSlide = Math.min((i + 1) * BATCH_SIZE, targetSlideCount);
        const count = endSlide - startSlide + 1;

        console.log(`Generating slides ${startSlide} to ${endSlide} (Batch ${i+1}/${batches})`);

        const batchPrompt = `
          INPUT SCRIPT (FULL CONTEXT):
          """${scriptContent.substring(0, 10000)}...""" 
          
          ACTION: Generate slides from #${startSlide} to #${endSlide} (Total ${targetSlideCount} slides in deck).
          Generate exactly ${count} slides for this batch.
          
          Ensure "content" is concise (Key points only) and "prompt" is a detailed 3D visual description.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: batchPrompt,
                config: {
                    systemInstruction: baseSystemInstruction,
                    tools: [{ googleSearch: {} }],
                    temperature: 0.7
                }
            });

            const batchResults = cleanAndParseJSON(response.text, []);
            
            if (Array.isArray(batchResults)) {
                allSlides = [...allSlides, ...batchResults];
            } else if (batchResults && typeof batchResults === 'object') {
                 allSlides.push(batchResults);
            }
        } catch (e) {
            console.error(`Error generating batch ${i + 1}`, e);
        }
        
        await new Promise(r => setTimeout(r, 500));
    }

    if (allSlides.length === 0) {
        throw new Error("Không thể tạo nội dung slide từ kịch bản. Vui lòng thử lại với nội dung ngắn hơn.");
    }

    // Map to App Type
    return allSlides.map((s: any, index: number) => ({
      id: index + 1,
      title: s.title || `Slide ${index + 1}`,
      content: sanitizeContent(s.content),
      prompt: `${s.prompt} ${STRICT_QUALITY_RULES}`,
      imageUrl: null,
      status: 'PENDING',
      isOptimized: true
    }));
  });
};

/**
 * Transforms existing slide image
 * USES: gemini-2.5-flash
 */
export const transformSlideImageToPrompt = async (base64Image: string): Promise<Omit<Slide, 'id' | 'status'>> => {
    return callGeminiWithRetry(async () => {
      const ai = getClient();
      const data = base64Image.split(',')[1] || base64Image;

      const systemInstruction = `
         Chuyên gia Phục hồi Slide & Tái tạo phong cách.
         Quy trình:
         1. OCR: Trích xuất toàn bộ văn bản chính xác.
         2. VISUAL RE-IMAGINE: Chuyển đổi hình ảnh cũ sang phong cách "Eco-Water 3D Futuristic".
            - Thay thế hình ảnh 2D cũ bằng Mô hình 3D mới.
            - Thay nền cũ bằng nền nước/sinh thái/kính mờ.
            - ÁP DỤNG: EDUCATIONAL_MASTERY standard (Bright, Readable, High Contrast).
         3. PROMPT: Viết prompt tạo ảnh mới, giữ nguyên bố cục thông tin nhưng nâng cấp visual.
         Trả về JSON: { "title", "content", "prompt" }. Escape quotes.
      `;

      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
              parts: [
                  { inlineData: { mimeType: 'image/jpeg', data: data } },
                  { text: "Thực hiện quy trình trên. Trả về JSON." }
              ]
          },
          config: {
              systemInstruction: systemInstruction,
              tools: [{ googleSearch: {} }]
          }
      });

      const result = cleanAndParseJSON(response.text, {});
      
      return {
          title: result.title || "Slide được làm mới",
          content: sanitizeContent(result.content || "Nội dung slide..."),
          prompt: `${result.prompt || "Infographic"} ${STRICT_QUALITY_RULES}`,
          imageUrl: null,
          originalImage: base64Image,
          isOptimized: false
      };
    });
};

/**
 * Regenerate Visual Prompt from Content
 * USES: gemini-2.5-flash
 */
export const regeneratePromptFromContent = async (title: string, content: string): Promise<string> => {
    return callGeminiWithRetry(async () => {
      const ai = getClient();
      const systemInstruction = `
         Viết lại Visual Prompt dựa trên nội dung: "${content}".
         Yêu cầu: 3D Content Simulation, Cân bằng bố cục, Nền nước ngữ cảnh.
         Hiển thị chữ trên tấm kính mờ.
         EDUCATIONAL UPGRADE: High-Key Lighting, Clear Hierarchy.
         TUÂN THỦ: REFERENCE_PROMPT.
      `;
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: "Viết lại prompt.",
          config: { systemInstruction, tools: [{ googleSearch: {} }] }
      });
      return `${response.text?.trim()} ${STRICT_QUALITY_RULES}`;
    });
};

/**
 * Optimize and Verify Slide Prompt with Strict Compliance
 * USES: gemini-2.5-flash
 */
export const optimizeSlidePromptWithVerification = async (title: string, content: string, titleColor: string = 'gold', bodyColor: string = 'white'): Promise<string> => {
    return callGeminiWithRetry(async () => {
      const ai = getClient();
      const learnedRules = getLearnedRules('SLIDE_DECK');
      
      // STRICTLY ENFORCED VISUAL STYLE FROM REFERENCE_PROMPT
      const systemInstruction = `
          **ROLE: Content Compliance & Visual Director**
          Task: Create a final visual prompt for NanoBanana 3.0 Pro.
          
          **INPUT DATA (DO NOT CHANGE):**
          Title: "${title}"
          Body: "${content}"

          **MANDATORY RULES (STRICTLY ENFORCED):**
          1. **VERBATIM TEXT CHECK**: You must instruct the image generator to render the Title and Body text EXACTLY as provided. 
             - Check: Did you include the full text?
             - Check: Did you change any words? (You must NOT).
          2. **VISUALS (ECO-WATER 3D & EDUCATIONAL):** 
             - **MUST USE**: 3D Objects (Glossy, Octane Render). NO flat icons.
             - **MUST USE**: Frosted Glass Panels for text.
             - **ATMOSPHERE**: Bioluminescent, Underwater, Caustics.
             - **LIGHTING**: High-Key, Bright, No Shadows (Educational Standard).
             - **COMPOSITION**: Asymmetrical Balance. Top-Right empty for Logo.
          3. **COLORS**: Enforce Title Color: ${titleColor.toUpperCase()}, Body Color: ${bodyColor.toUpperCase()}.
          4. **OUTPUT FORMAT**: Just the prompt string.
          ${learnedRules}
      `;
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: "Execute Optimization and Verification.",
          config: { systemInstruction, temperature: 0.1 } 
      });
      return `${response.text?.trim()} ${STRICT_QUALITY_RULES}`;
    });
};

// ============================================================================
// REPLICATE CLIENT & POLLING LOGIC
// ============================================================================
const pollReplicateResult = async (url: string, token: string, maxAttempts = 30): Promise<string> => {
    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) throw new Error("Replicate Polling Failed");

        const data = await response.json();
        if (data.status === 'succeeded') {
            return data.output[0]; // Flux returns an array of URLs
        } else if (data.status === 'failed' || data.status === 'canceled') {
            throw new Error(`Replicate Task Failed: ${data.error}`);
        }

        await delay(1000); // Wait 1s
    }
    throw new Error("Replicate Timeout");
};

const callReplicateFlux = async (prompt: string, aspectRatio: AspectRatioType): Promise<string> => {
    const token = getReplicateToken();
    if (!token) throw new Error("REPLICATE_TOKEN_MISSING");

    // Map App Aspect Ratio to Replicate format
    const arMap: Record<string, string> = {
        "1:1": "1:1",
        "16:9": "16:9",
        "9:16": "9:16",
        "4:3": "4:3",
        "3:4": "3:4" // Flux might fallback for 3:4 to closest
    };

    const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: "black-forest-labs/flux-schnell", // Using Schnell for speed & cost
            input: {
                prompt: prompt,
                aspect_ratio: arMap[aspectRatio] || "1:1",
                safety_tolerance: 2,
                output_format: "png"
            }
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Replicate API Error: ${err}`);
    }

    const prediction = await response.json();
    // Replicate is async, must poll
    const imageUrl = await pollReplicateResult(prediction.urls.get, token);
    
    // Fetch the image to convert to Base64 (to match existing app flow) or return URL directly
    // Returning URL directly might cause CORS issues in canvas if not proxied.
    // For this prototype, we return the URL. If canvas issues arise, we'd need a proxy.
    // However, to keep it compatible with "generateInfographicImage" returning a dataURI usually:
    // Let's try to fetch it and convert to blob if possible, or just return URL.
    // For "Seamless Integration", let's return the URL. The existing app handles remote URLs in `image.src`.
    return imageUrl;
};

// ============================================================================
// MAIN GENERATION FUNCTION (HYBRID ENGINE)
// ============================================================================

/**
 * Generates the image using Hybrid Engine (Flux Primary -> Google Fallback)
 * IMPLEMENTS: Cost Revolution (<50 VND target) & Superior Text Rendering
 * RETURNS: { url: string, engine: 'FLUX' | 'GOOGLE' }
 */
export const generateInfographicImage = async (
  prompt: string, 
  aspectRatio: AspectRatioType = "1:1",
  referenceImageBase64?: string | null,
  projectorImageBase64?: string | null,
  feedback?: string,
  textOverlay?: { title: string; body: string; subtitle?: string },
  generationMode?: string // Added explicit mode parameter
): Promise<{ url: string, engine: 'FLUX' | 'GOOGLE' }> => {
  
  // 1. DETERMINE ENGINE STRATEGY
  // If Reference Image is present, FORCE GOOGLE (Nanobana is better at Style Transfer/Multimodal)
  // If no Reference Image, TRY FLUX (Better text, Cheaper)
  const useFluxPrimary = !referenceImageBase64 && !projectorImageBase64;
  const replicateToken = getReplicateToken();

  // --- STRATEGY A: TRY REPLICATE FLUX ---
  if (useFluxPrimary && replicateToken) {
      try {
          console.log("Attempting generation via Replicate FLUX (Primary Engine)...");
          
          // Construct Flux-Optimized Prompt
          // Flux handles text best when explicitly quoted: TEXT: "..."
          let fluxPrompt = prompt;
          
          if (textOverlay) {
              const titlePart = textOverlay.title ? `TEXT IN IMAGE: "${textOverlay.title.toUpperCase()}"` : "";
              const subPart = textOverlay.subtitle ? `SUBTITLE TEXT: "${textOverlay.subtitle}"` : "";
              // Body text might be too long for Flux to render perfectly, but we try specific keywords
              const bodyPart = textOverlay.body ? `BODY TEXT: "${textOverlay.body.substring(0, 50)}..."` : ""; 
              
              fluxPrompt = `${prompt} . ${titlePart} . ${subPart} . ${bodyPart} . Typography: Bold, 3D, High Contrast.`;
          }

          const url = await callReplicateFlux(fluxPrompt, aspectRatio);
          return { url, engine: 'FLUX' };

      } catch (e) {
          console.warn("Replicate FLUX failed. Falling back to Google.", e);
          // Proceed to Google Fallback below...
      }
  }

  // --- STRATEGY B: GOOGLE VERTEX AI (FALLBACK / MULTIMODAL) ---
  return callGeminiWithRetry(async () => {
      const ai = getClient();
      const parts: any[] = [];
      
      // Determine effective mode for rules lookup
      let effectiveMode = generationMode || 'SINGLE';
      if (!effectiveMode && textOverlay && (textOverlay.subtitle || (!textOverlay.body && textOverlay.title))) {
          effectiveMode = 'THUMBNAIL';
      }

      const learnedRules = getLearnedRules(effectiveMode);

      // 1. Reference Image
      if (referenceImageBase64) {
        const cleanData = referenceImageBase64.split(',')[1] || referenceImageBase64;
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanData } });
        parts.push({ text: `[STYLE REFERENCE] Follow visual style/colors. [CONSISTENCY] Maintain character features/layout.` });
      }

      // 2. Projector Image
      if (projectorImageBase64) {
          const cleanData = projectorImageBase64.split(',')[1] || projectorImageBase64;
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanData } });
          parts.push({ text: `[STRICT TEXTURE MAPPING] Use the image above as the TEXTURE for the Background Screen/TV. DO NOT alter its content.` });
      }

      // 3. Prompt Construction (Strict Separation of Visuals and Text)
      let finalPrompt = "";

      if (textOverlay) {
          // [PROTOCOL ENFORCEMENT] If text provided, FORCE VERBATIM RENDERING
          // Check if this is a THUMBNAIL (Empty Body or specific Subtitle usage)
          const isThumbnail = !!textOverlay.subtitle || (!textOverlay.body && !!textOverlay.title) || effectiveMode === 'THUMBNAIL';

          if (isThumbnail) {
              // --- DYNAMIC THUMBNAIL JSON SCHEMA (UPDATED) ---
              const thumbnailPayload = {
                  target_model: "Nanobana Pro 3.0",
                  feature_mode: "THUMBNAIL",
                  layout_control: {
                      structure: "Split-Screen",
                      safe_zone_vertical: "Top 0% to 70%",
                      forbidden_zone: "Bottom 30% (Strictly Empty of Text)",
                      text_area: "Left 60% (Vertical Stack within Top 70%)",
                      subject_area: "Right 40% (Visual/Subject)",
                      protected_zones: [
                          "Top-Right (Reserved for Logo)",
                          "Bottom-Right (Reserved for Nameplate/Avatar)",
                          "Bottom 30% (Strictly NO TEXT)"
                      ]
                  },
                  typography_instruction: {
                      title_layer: {
                          content: textOverlay.title.toUpperCase(),
                          case: "UPPERCASE",
                          style: "Bold, Impactful",
                          font_family: "Google Fonts (Montserrat/Roboto/Noto Sans) with full Vietnamese Unicode support"
                      },
                      subtitle_layer: {
                          content: (textOverlay.subtitle || textOverlay.body || "").toLowerCase(), // Force lowercase
                          case: "lowercase",
                          size: "Small/Medium",
                          background: "NONE (No glass, No box, Transparent)",
                          style: "Clean, Minimalist"
                      },
                      stacking: "Vertical (Title Top, Subtitle Below)",
                      scaling: "Auto-fit to Top 70%, Ensure no crop",
                      style: "Vietnamese Bold Sans-Serif, High Contrast"
                  },
                  visual_prompt: prompt,
                  safety_rules: learnedRules,
                  feedback_correction: feedback || null
              };
              finalPrompt = JSON.stringify(thumbnailPayload);
          } else {
              // --- STANDARD SLIDE SCHEMA ---
              const fontStyle = "Google Fonts (Montserrat/Roboto/Noto Sans) with full Vietnamese Unicode support";
              const structuredPayload = {
                  model: "Nanobana Pro 3.0",
                  feature_mode: effectiveMode,
                  prompt_payload: {
                      visual_description: prompt, 
                      typography_instruction: {
                          strict_mode: true,
                          language: "Vietnamese",
                          ensure_diacritics: true,
                          title_text: textOverlay.title, 
                          body_text: textOverlay.body,
                          font_style: fontStyle,
                          text_color: "High Contrast on Frosted Glass"
                      },
                      visual_strategy: "EDUCATIONAL_MASTERY", // Injected
                      feedback_correction: feedback || null,
                      safety_rules: learnedRules
                  }
              };
              finalPrompt = JSON.stringify(structuredPayload);
          }
      } else {
          // Fallback if no specific overlay provided (Single Image Mode where text is in prompt)
          if (feedback) {
              finalPrompt = `!!! CORRECTION REQUEST !!! FEEDBACK: "${feedback}". FIX the errors in the Original Prompt below. PRIORITIZE legibility.\nORIGINAL: ${prompt}\nRULES: ${learnedRules}`;
          } else {
              finalPrompt = `EXECUTION PLAN: 1. Contextual Background. 2. 3D Simulation (Objects). 3. Balanced Layout. 4. Exact Text on Glass Panels. 5. Educational Lighting (High-Key).\nDETAILS: ${prompt}\nRULES: ${learnedRules}`;
          }
      }

      parts.push({ text: finalPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return { 
              url: `data:image/png;base64,${part.inlineData.data}`,
              engine: 'GOOGLE'
          };
        }
      }
      throw new Error("API returned no image data.");
  });
};
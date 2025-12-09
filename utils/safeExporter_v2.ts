import { Slide, MCScene } from "../types";

// Declare global FileSaver saveAs
declare const saveAs: any;

// STRICT STYLE SUFFIX FOR NANO BANANA PRO 3.0
const HQ_STYLE_SUFFIX = " . High-Key Lighting, Bright Studio Lights, 3D Eco-style, Hyper-realistic, 8k Resolution. TEXT RENDER: Massive Bold Typography, Crystal Clear Font, High Contrast.";

/**
 * SAFE EXPORTER V2 - SEQUENTIAL PROCESSING MODULE
 * Role: Lead Integrity Engineer Implementation
 * Function: Exports RAW prompts with Step-by-Step Loop processing and 8K Standard.
 * Update: Removed all headers/metadata for direct Copy-Paste workflow.
 * Update 2: Flatten prompts to single line (seamless) per user request.
 */
export const exportSafeSequencedPrompts = (
  data: Slide[] | { intro: MCScene, outro: MCScene },
  topic: string,
  mode: 'SLIDE' | 'MC' = 'SLIDE'
) => {
  if (typeof saveAs === 'undefined') {
    console.error("FileSaver.js not loaded");
    alert("Lỗi thư viện: Không thể tạo file. Vui lòng tải lại trang.");
    return;
  }

  // UTF-8 BOM for Windows Notepad compatibility (Essential for Vietnamese)
  const BOM = "\uFEFF"; 
  
  let contentBuffer = "";
  
  // SEQUENTIAL LOOP (Step-by-step)
  if (mode === 'SLIDE' && Array.isArray(data)) {
    data.forEach((slide) => {
      // Input Integrity Check - Force String conversion
      let rawPrompt = slide.prompt ? String(slide.prompt) : "";
      
      // If prompt is empty (user didn't run Optimize yet), try to construct basic prompt from content
      if (!rawPrompt.trim()) {
           rawPrompt = `INFOGRAPHIC SLIDE. Title: ${slide.title}. Content: ${slide.content}`;
      }

      // 1. Flatten logic: Replace all newlines with spaces to make it "seamless" (liền mạch)
      // This ensures the prompt is a single block of text for easy copy-pasting.
      let safePrompt = rawPrompt.replace(/[\r\n]+/g, " ").trim();

      // Skip empty prompts to keep file clean
      if (!safePrompt) return;

      // Apply Quality Standard (If missing)
      if (!safePrompt.includes("8k Resolution")) {
        safePrompt += HQ_STYLE_SUFFIX;
      }

      // Append to Buffer: Clean Prompt + Double Newline for clear separation between slides
      contentBuffer += `${safePrompt}\n\n`;
    });
  } else if (mode === 'MC' && !Array.isArray(data)) {
     // Manual sequential processing for MC
     const scenes = [
         { data: (data as any).intro }, 
         { data: (data as any).outro }
     ];

     scenes.forEach(item => {
         const scene = item.data as MCScene;
         // Input Integrity Check
         let rawPrompt = scene.visualPrompt ? String(scene.visualPrompt) : "";
         
         // 1. Flatten logic
         let safePrompt = rawPrompt.replace(/[\r\n]+/g, " ").trim();
         
         if (!safePrompt) return;

         if (!safePrompt.includes("8k Resolution")) {
            safePrompt += HQ_STYLE_SUFFIX;
         }

         contentBuffer += `${safePrompt}\n\n`;
     });
  }

  // EXPORT BLOB
  try {
    const blob = new Blob([BOM + contentBuffer.trim()], { type: "text/plain;charset=utf-8" });
    const safeFilename = `${String(topic).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_NanoBanana_RawPrompts.txt`;
    saveAs(blob, safeFilename);
  } catch (e) {
    console.error("Export Failed", e);
    alert("Lỗi xuất file. Vui lòng kiểm tra console.");
  }
};
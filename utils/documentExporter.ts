import { Slide } from "../types";

// Declare libraries loaded via CDN in index.html
declare const jspdf: any;
declare const PptxGenJS: any;
declare const JSZip: any;
declare const saveAs: any;

// Standard Style Suffix to ensure quality when exporting raw prompts
const STYLE_SUFFIX = " . High-Key Lighting, Bright Studio Lights, 3D Eco-style, Hyper-realistic, 8k Resolution. TEXT RENDER: Massive Bold Typography, Crystal Clear Font, High Contrast.";

export const exportToPDF = (slides: Slide[], topic: string) => {
    if (typeof jspdf === 'undefined') {
        alert("Thư viện PDF chưa tải xong. Vui lòng thử lại sau giây lát.");
        return;
    }

    const { jsPDF } = jspdf;
    // 16:9 ratio in pixels (approx) for high quality
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080], 
        hotfixes: ['px_scaling'] 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    let pageAdded = false;

    slides.forEach((slide) => {
        if (!slide.imageUrl) return; // Skip slides without images

        if (pageAdded) {
            doc.addPage([1920, 1080], 'landscape');
        } else {
            pageAdded = true;
        }

        try {
            // Add Image Full Screen
            doc.addImage(slide.imageUrl, 'PNG', 0, 0, pageWidth, pageHeight);
        } catch (e) {
            console.error("Error adding image to PDF", e);
        }
    });

    if (!pageAdded) {
        doc.text("Không có hình ảnh để xuất.", 50, 50);
    }

    doc.save(`${topic.replace(/\s+/g, '_')}_VienYHocSuSong.pdf`);
};

export const exportToPPTX = (slides: Slide[], topic: string) => {
    if (typeof PptxGenJS === 'undefined') {
        alert("Thư viện PowerPoint chưa tải xong. Vui lòng thử lại sau giây lát.");
        return;
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = topic;

    let slideAdded = false;

    slides.forEach((slide) => {
        if (!slide.imageUrl) return;

        const pSlide = pptx.addSlide();
        slideAdded = true;
        
        // Background color fallback
        pSlide.background = { color: "000000" }; // Black background for better contrast if image misses edge

        // Image Full Screen
        pSlide.addImage({ 
            data: slide.imageUrl, 
            x: 0, y: 0, w: '100%', h: '100%',
            sizing: { type: "contain" } // Ensure whole image is visible
        });
    });

    if (!slideAdded) {
        const pSlide = pptx.addSlide();
        pSlide.addText("Không có hình ảnh để xuất.", { x: 1, y: 1, color: '363636' });
    }

    pptx.writeFile({ fileName: `${topic.replace(/\s+/g, '_')}_VienYHocSuSong.pptx` });
};

/**
 * Downloads all images as a ZIP file.
 * @param slides List of slides
 * @param topic Current topic name for filename
 * @param format 'png' or 'jpg'
 */
export const downloadAllImagesAsZip = async (slides: Slide[], topic: string, format: 'png' | 'jpg') => {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
        alert("Thư viện nén file chưa tải xong. Vui lòng thử lại sau giây lát.");
        return;
    }

    const zip = new JSZip();
    const folderName = topic.replace(/\s+/g, '_').substring(0, 50) || "Bo_Anh_VienYHocSuSong";
    const imgFolder = zip.folder(folderName);

    let hasImages = false;

    // Helper to convert base64 PNG to JPG via Canvas
    const convertToJpg = (base64Png: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Fill white background for JPG (since PNG might have transparency)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    // Return raw base64 data without prefix for JSZip
                    const jpgData = canvas.toDataURL('image/jpeg', 0.9);
                    resolve(jpgData.split(',')[1]);
                } else {
                    resolve(base64Png.split(',')[1]); // Fallback
                }
            };
            img.src = base64Png;
        });
    };

    // Process all slides
    const promises = slides.map(async (slide, index) => {
        if (!slide.imageUrl) return;
        hasImages = true;

        const fileName = `Slide_${slide.id}_${slide.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.${format}`;
        
        if (format === 'png') {
            // PNG is usually the default base64 format from our generator
            const base64Data = slide.imageUrl.split(',')[1];
            imgFolder.file(fileName, base64Data, { base64: true });
        } else {
            // Convert to JPG
            const jpgData = await convertToJpg(slide.imageUrl);
            imgFolder.file(fileName, jpgData, { base64: true });
        }
    });

    await Promise.all(promises);

    if (!hasImages) {
        alert("Không tìm thấy ảnh nào đã hoàn thành để tải xuống.");
        return;
    }

    // Generate and save ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${folderName}_${format.toUpperCase()}.zip`);
};

/**
 * Exports visual prompts to a RAW TXT file.
 * Features:
 * 1. Single line per prompt (no internal newlines).
 * 2. No prefixes (e.g., "Slide 1:").
 * 3. Auto-injects Style/Lighting keywords if missing.
 */
export const exportPromptsToTxt = (slides: Slide[], topic: string) => {
    if (typeof saveAs === 'undefined') {
        alert("Thư viện FileSaver chưa tải xong.");
        return;
    }

    if (!slides || slides.length === 0) {
        alert("Không có dữ liệu prompt để xuất.");
        return;
    }

    // Process slides to get raw, enhanced prompts
    const content = slides.map((slide) => {
        let rawPrompt = slide.prompt || "";
        
        // 1. Flatten to single line: Remove newlines
        let cleanPrompt = rawPrompt.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
        
        // 2. Check and Inject Style Suffix if keyphrases are missing
        // This ensures the raw exported text generates high-quality images elsewhere
        if (!cleanPrompt.toLowerCase().includes("high-key lighting")) {
            cleanPrompt += STYLE_SUFFIX;
        }

        // Return only the prompt content
        return cleanPrompt;
    }).join('\n\n'); // Separate prompts by double newline

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${topic.replace(/\s+/g, '_')}_Raw_Prompts.txt`);
};
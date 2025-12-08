
declare const pdfjsLib: any;

/**
 * Converts a PDF file into an array of Base64 images (one per page).
 * @param file The PDF file object
 * @returns Promise<string[]> Array of base64 image strings
 */
export const convertPdfToImages = async (file: File): Promise<string[]> => {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("Thư viện PDF chưa sẵn sàng. Vui lòng tải lại trang.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Scale 1.5 for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert to JPEG for lighter payload
            images.push(canvas.toDataURL('image/jpeg', 0.8));
        }
    }

    return images;
};


import { AspectRatioType } from "../types";

/**
 * Overlays a logo onto a base image.
 * Maintains aspect ratio of the logo to prevent distortion.
 * 
 * @param baseImageBase64 The base64 string of the main image
 * @param logoSrc The source of the logo (URL or Base64/SVG Data URI)
 * @returns Promise resolving to a new base64 string with the logo overlay
 */
export const overlayLogo = async (baseImageBase64: string, logoSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }
  
      const img = new Image();
      img.crossOrigin = "anonymous";
  
      img.onload = () => {
        // Set canvas to match image dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 1. Draw background image
        ctx.drawImage(img, 0, 0);
  
        // 2. Prepare Logo
        const logo = new Image();
        logo.onload = () => {
          // Calculate Logo Dimensions to maintain Aspect Ratio
          const maxLogoWidth = canvas.width * 0.20; // Max 20% of canvas width
          const maxLogoHeight = canvas.height * 0.15; // Max 15% of canvas height
          
          let drawWidth = logo.width;
          let drawHeight = logo.height;

          // Scale down if too wide
          if (drawWidth > maxLogoWidth) {
              const scale = maxLogoWidth / drawWidth;
              drawWidth = maxLogoWidth;
              drawHeight = drawHeight * scale;
          }

          // Scale down if too tall (after width check)
          if (drawHeight > maxLogoHeight) {
              const scale = maxLogoHeight / drawHeight;
              drawHeight = maxLogoHeight;
              drawWidth = drawWidth * scale;
          }

          // Padding from edges
          const paddingX = canvas.width * 0.03; 
          const paddingY = canvas.height * 0.03; 
          
          // Position: Top Right Corner
          const x = canvas.width - drawWidth - paddingX;
          const y = paddingY;
  
          // Draw logo with correct aspect ratio
          ctx.drawImage(logo, x, y, drawWidth, drawHeight);
          
          // Return result as Data URL
          resolve(canvas.toDataURL('image/png'));
        };
        
        logo.onerror = (e) => {
          console.warn("Failed to load logo for overlay", e);
          // If logo fails, return original image
          resolve(baseImageBase64);
        };
        
        logo.src = logoSrc;
      };
      
      img.onerror = (e) => {
        console.error("Failed to load base image", e);
        reject(e);
      };
      
      img.src = baseImageBase64;
    });
  };

/**
 * Overlays a character avatar onto the background for thumbnails.
 * Smart positioning based on aspect ratio.
 * Includes optional Name Label with 3D Metallic Gold effect.
 */
export const overlayAvatar = async (baseImageBase64: string, avatarSrc: string, aspectRatio: AspectRatioType, avatarName?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error("No Canvas Context")); return; }

        const bg = new Image();
        bg.crossOrigin = "anonymous";
        bg.onload = () => {
            canvas.width = bg.width;
            canvas.height = bg.height;
            ctx.drawImage(bg, 0, 0);

            const avatar = new Image();
            avatar.crossOrigin = "anonymous";
            avatar.onload = () => {
                let avWidth, avHeight, x, y;

                // Smart Positioning logic for Avatar
                if (aspectRatio === '16:9' || aspectRatio === '4:3') {
                    // Landscape: Avatar on Right side, approx 80% height
                    avHeight = canvas.height * 0.9;
                    avWidth = avHeight * (avatar.width / avatar.height);
                    x = canvas.width - avWidth * 0.9; // Slight overlap offscreen or tight to edge
                    y = canvas.height - avHeight; // Bottom aligned
                } else if (aspectRatio === '9:16' || aspectRatio === '3:4') {
                    // Portrait: Avatar at Bottom, approx 80% width
                    avWidth = canvas.width * 0.9;
                    avHeight = avWidth * (avatar.height / avatar.width);
                    x = (canvas.width - avWidth) / 2; // Center horizontal
                    y = canvas.height - avHeight * 0.85; // Bottom aligned
                } else {
                    // Square: Bottom Right
                    avHeight = canvas.height * 0.7;
                    avWidth = avHeight * (avatar.width / avatar.height);
                    x = canvas.width - avWidth;
                    y = canvas.height - avHeight;
                }

                ctx.drawImage(avatar, x, y, avWidth, avHeight);

                // DRAW NAME LABEL IF PROVIDED
                if (avatarName && avatarName.trim()) {
                    // 1. Setup Font relative to Canvas Height
                    // Banner style needs big, clear text
                    const fontSize = Math.max(24, canvas.height * 0.07); 
                    
                    // FIX FONT: Prioritize standard system fonts (Arial, Segoe UI) over web fonts
                    // to ensure Vietnamese characters render correctly without squares/tofu.
                    ctx.font = `bold ${fontSize}px "Arial", "Segoe UI", "Tahoma", "Verdana", sans-serif`; 
                    
                    const paddingV = fontSize * 0.6; // Vertical padding inside box
                    const boxHeight = fontSize + (paddingV * 2);

                    // 2. Calculate Box Geometry (Banner Style)
                    // Fixed margin from both left and right edges (e.g., 5% each side)
                    const sideMargin = canvas.width * 0.05; 
                    const boxWidth = canvas.width - (sideMargin * 2);
                    const boxX = sideMargin;

                    // Position Y: Fixed distance from bottom of canvas
                    const bottomMargin = canvas.height * 0.05; 
                    const boxY = canvas.height - boxHeight - bottomMargin;

                    // --- DRAWING THE 3D GOLD BOX ---
                    ctx.save();
                    
                    // A. Glow Effect (Radiant Shine behind box)
                    ctx.shadowColor = "rgba(251, 191, 36, 0.9)"; // Bright Amber glow
                    ctx.shadowBlur = 40;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                    // B. Metallic Gold Gradient (Vertical)
                    const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
                    gradient.addColorStop(0, '#92400E');   // Dark Bronze Top
                    gradient.addColorStop(0.2, '#FCD34D'); // Bright Gold
                    gradient.addColorStop(0.4, '#FFFFFF'); // White Highlight (Shine)
                    gradient.addColorStop(0.6, '#F59E0B'); // Rich Gold
                    gradient.addColorStop(1, '#78350F');   // Dark Bronze Bottom
                    
                    ctx.fillStyle = gradient;
                    
                    // Draw Rounded Rect Box
                    ctx.beginPath();
                    // Using roundRect if available, else manual arcs
                    if (ctx.roundRect) {
                        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
                    } else {
                        ctx.rect(boxX, boxY, boxWidth, boxHeight);
                    }
                    ctx.fill();
                    ctx.restore(); // Restore to remove heavy shadow for next steps

                    // C. Inner Border (White Stroke for crisp edge)
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 4;
                    if (ctx.roundRect) {
                        ctx.beginPath();
                        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
                        ctx.stroke();
                    }

                    // --- DRAWING THE TEXT ---
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Center text horizontally in the canvas (which is also center of the box)
                    const textX = canvas.width / 2;
                    const textY = boxY + (boxHeight / 2) + (fontSize * 0.05); // Slight optical adjustment

                    // Text Shadow for contrast
                    ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;

                    // Text Color: Dark Blue/Black for max contrast on Gold
                    ctx.fillStyle = '#0F172A'; // Slate 900
                    
                    // Max width for text (inside box with some internal padding)
                    const maxTextWidth = boxWidth - (fontSize * 2);
                    
                    ctx.fillText(avatarName.toUpperCase(), textX, textY, maxTextWidth);
                }

                resolve(canvas.toDataURL('image/png'));
            };
            avatar.onerror = () => resolve(baseImageBase64); // Fallback if avatar fails
            avatar.src = avatarSrc;
        };
        bg.onerror = reject;
        bg.src = baseImageBase64;
    });
};

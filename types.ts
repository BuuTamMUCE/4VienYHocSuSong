

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_PROMPT = 'GENERATING_PROMPT',
  PROMPT_READY = 'PROMPT_READY',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type BatchStatus = 'IDLE' | 'REVIEW' | 'PROCESSING' | 'PAUSED' | 'COMPLETED';

export interface PromptResponse {
  title: string;
  fullPrompt: string;
}

export type AspectRatioType = "1:1" | "3:4" | "4:3" | "16:9" | "9:16";

export type GenerationMode = 'SINGLE' | 'SLIDE_DECK' | 'REMAKE_SLIDE' | 'MC_STUDIO' | 'THUMBNAIL';

// New Content Mode for Slides
export type ContentMode = 'CREATIVE' | 'EXACT';

export interface Slide {
  id: number;
  title: string;
  content: string; // Nội dung thuyết trình chi tiết
  prompt: string;
  imageUrl: string | null;
  originalImage?: string | null; // Dùng cho chế độ Remake
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'ERROR';
  isPromptStale?: boolean; // Cờ báo nội dung đã sửa nhưng prompt chưa cập nhật
  isOptimized?: boolean;   // Cờ báo prompt đã được kiểm tra nghiêm ngặt
}

// MC Studio Types
export type MCAgeGroup = 'Nhi đồng' | 'Thiếu nhi' | 'Thiếu niên' | 'Thanh niên' | 'Trung niên' | 'Lão niên';
export type MCGenre = 'Y học' | 'Giáo dục' | 'Tin tức' | 'Talkshow' | 'Kể chuyện';
export type MCNationality = 'VN' | 'US' | 'GB' | 'FR' | 'CN' | 'JP' | 'KR' | 'RU' | 'ES' | 'LA';

export interface MCScene {
  type: 'INTRO' | 'OUTRO';
  title: string;
  script: string;       // Lời thoại đầy đủ (để tham khảo)
  visualPrompt: string; // Prompt để tạo ảnh
  videoPrompt?: string; // Prompt để tạo video Veo 3 (Technical Directive)
  imageUrl: string | null;
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'ERROR';
}

// Unified Command Console Types
export interface ConsoleData {
  title: string;
  subtitle?: string; // NEW: Added Subtitle
  body: string;
  visualPrompt: string;
  mode: GenerationMode;
}

export interface ValidationResult {
  optimizedPrompt: string;
  optimizedTitle: string; 
  optimizedSubtitle?: string; // NEW: Added Subtitle
  analysis: string; 
}

// AI ASSIST TYPES
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

import React from 'react';
import { Slide } from '../types';
import { Play, Type, Edit3, ShieldCheck, LayoutGrid, FileText, Sparkles, Loader2 } from 'lucide-react';
import { SmartEditButton } from './SmartEditButton';

interface SlideEditorGridProps {
  slides: Slide[];
  onUpdateSlide: (id: number, newTitle: string, newContent: string) => void;
  onConfirmBatch: () => void;
  onExportPrompts: () => void; // New prop for export action
  unitPrice: number;
  isOptimizing?: boolean;
  onOptimize?: () => void;
}

export const SlideEditorGrid: React.FC<SlideEditorGridProps> = ({ 
  slides, 
  onUpdateSlide, 
  onConfirmBatch,
  onExportPrompts,
  unitPrice,
  isOptimizing = false,
  onOptimize
}) => {
  const totalCost = slides.length * unitPrice;

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in-up pb-10">
      
      {/* Header / Control Bar */}
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/60 mb-8 sticky top-4 z-30">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-cyan-600" />
              Kiểm Duyệt Nội Dung (Slide Preview)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Chỉnh sửa văn bản bên dưới. AI sẽ tạo ảnh dựa trên <strong>chính xác</strong> những gì bạn viết.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-400 uppercase">Ước tính chi phí</div>
              <div className="text-xl font-bold text-orange-600 font-mono">
                {totalCost.toLocaleString()} VND
              </div>
            </div>
            
            <div className="flex gap-3">
              {/* BUTTON: OPTIMIZE PROMPTS */}
              {onOptimize && (
                  <button 
                    onClick={onOptimize}
                    disabled={isOptimizing}
                    className={`px-5 py-4 rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2
                       ${isOptimizing ? 'bg-purple-100 text-purple-600 cursor-not-allowed' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'}
                    `}
                    title="Viết lại toàn bộ Prompt theo chuẩn tuần tự (Step-by-step Loop)"
                  >
                    {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span className="hidden sm:inline">{isOptimizing ? 'Đang viết Prompt...' : 'Chuẩn Hóa Prompt (Tuần Tự)'}</span>
                  </button>
              )}

              {/* BUTTON: DOWNLOAD PROMPTS - HIDDEN WHILE OPTIMIZING */}
              {!isOptimizing && (
                  <button 
                    onClick={onExportPrompts}
                    className="px-5 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 animate-fade-in"
                    title="Tải file TXT chứa prompt (Raw) để sử dụng ở công cụ khác"
                  >
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="hidden sm:inline">Tải Prompt (Raw TXT)</span>
                  </button>
              )}

              {/* BUTTON: GENERATE IMAGES */}
              <button 
                onClick={onConfirmBatch}
                disabled={isOptimizing}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-1 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6 fill-current" />
                XÁC NHẬN & TẠO {slides.length} ẢNH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => (
          <div 
            key={slide.id} 
            className={`group bg-white/70 backdrop-blur-md rounded-3xl p-5 border shadow-sm hover:shadow-xl transition-all flex flex-col relative
               ${slide.status === 'GENERATING' ? 'border-purple-300 ring-2 ring-purple-100 scale-[1.02]' : 'border-white/60 hover:border-cyan-200'}
            `}
          >
            <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold border shadow-sm z-10 transition-colors
               ${slide.status === 'GENERATING' ? 'bg-purple-500 text-white border-purple-600 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-cyan-500 group-hover:text-white'}
            `}>
              {slide.id}
            </div>

            <div className="mb-4 pl-4 relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Type className="w-3 h-3" /> Tiêu đề Slide
                </label>
                <SmartEditButton 
                    originalText={slide.title} 
                    onApply={(newText) => onUpdateSlide(slide.id, newText, slide.content)}
                    contextLabel="Tiêu đề"
                />
              </div>
              <input
                type="text"
                value={slide.title}
                onChange={(e) => onUpdateSlide(slide.id, e.target.value, slide.content)}
                className="w-full bg-white/50 border-b-2 border-slate-200 focus:border-cyan-500 px-2 py-1 font-bold text-slate-800 text-lg outline-none transition-colors placeholder:text-slate-300"
                placeholder="Nhập tiêu đề..."
              />
            </div>

            <div className="flex-grow relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Nội dung chi tiết (Sẽ in lên ảnh)
                </label>
                <SmartEditButton 
                    originalText={slide.content} 
                    onApply={(newText) => onUpdateSlide(slide.id, slide.title, newText)}
                    contextLabel="Nội dung"
                />
              </div>
              <textarea
                value={slide.content}
                onChange={(e) => onUpdateSlide(slide.id, slide.title, e.target.value)}
                className="w-full h-40 p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-cyan-200 outline-none resize-none text-sm text-slate-600 leading-relaxed custom-scrollbar"
                placeholder="Nhập nội dung..."
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
               <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">
                 Nanobana 3.0 Pro
               </span>
               <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                 {slide.isOptimized ? <><ShieldCheck className="w-3 h-3" /> Prompt Chuẩn Hóa</> : <span className="text-slate-400">Chưa tối ưu</span>}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
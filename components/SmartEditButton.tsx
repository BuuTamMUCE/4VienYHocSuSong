
import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Check, Loader2 } from 'lucide-react';
import { rewriteTextWithAI } from '../services/aiAssistService';

interface SmartEditButtonProps {
  originalText: string;
  onApply: (newText: string) => void;
  contextLabel?: string;
  className?: string;
}

export const SmartEditButton: React.FC<SmartEditButtonProps> = ({ originalText, onApply, contextLabel = "Văn bản", className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Suggested commands
  const suggestions = [
    "Làm ngắn gọn hơn",
    "Viết chuyên nghiệp hơn",
    "Dịch sang tiếng Anh",
    "Tạo tiêu đề giật tít",
    "Kiểm tra chính tả"
  ];

  const handleRewrite = async (cmd: string) => {
    if (!originalText) return;
    setCommand(cmd); // Sync if clicked from suggestion
    setIsLoading(true);
    try {
      const result = await rewriteTextWithAI(originalText, cmd);
      setPreviewText(result);
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối AI Smart Assist.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApply(previewText);
    setIsOpen(false);
    setPreviewText('');
    setCommand('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`p-1.5 rounded-lg bg-gradient-to-tr from-purple-100 to-pink-100 text-purple-600 hover:from-purple-200 hover:to-pink-200 transition-all shadow-sm hover:scale-105 group ${className}`}
        title="AI Magic Rewrite (Sửa thông minh)"
      >
        <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-white/60 animate-fade-in-up overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header - Fixed at top */}
            <div className="shrink-0 p-4 border-b border-purple-100 bg-purple-50/50 flex justify-between items-center z-20">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Smart Rewrite <span className="text-xs font-normal text-slate-500">({contextLabel})</span>
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Original (Read-only) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gốc</p>
                <p className="text-sm text-slate-600 line-clamp-3 italic">"{originalText}"</p>
              </div>

              {/* Command Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-2 block">Bạn muốn sửa như thế nào?</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRewrite(command)}
                    placeholder="VD: Viết ngắn lại, Dùng từ sang trọng hơn..." 
                    className="flex-grow p-2.5 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-sm"
                  />
                  <button 
                    onClick={() => handleRewrite(command)}
                    disabled={isLoading || !command.trim()}
                    className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleRewrite(s)}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg transition-colors border border-slate-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Preview */}
              {previewText && (
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 animate-fade-in">
                  <p className="text-[10px] font-bold text-green-600 uppercase mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Kết quả đề xuất
                  </p>
                  <textarea 
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-800 font-medium resize-none h-auto min-h-[60px]"
                  />
                </div>
              )}
            </div>

            {/* Footer - Sticky/Fixed at bottom with High Z-Index & Shadow */}
            <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 z-[9999] shadow-[0_-4px_10px_rgba(0,0,0,0.08)] relative">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Hủy</button>
              <button 
                onClick={handleApply}
                disabled={!previewText}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 disabled:opacity-50 flex items-center gap-2 transform active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" /> Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

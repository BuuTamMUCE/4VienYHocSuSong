
import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, ShieldCheck, ChevronRight, X } from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  onCancel?: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, onCancel }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualKey, setManualKey] = useState('');

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    try {
      // If onCancel is provided, we are in "Change Key" mode. 
      // Do NOT auto-select existing key, allow user to choose again.
      if (onCancel) {
          setLoading(false);
          return;
      }

      // Check session storage first
      if (sessionStorage.getItem('GEMINI_API_KEY')) {
          setHasKey(true);
          onKeySelected();
          return;
      }

      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onKeySelected();
        }
      }
    } catch (e) {
      console.error("Error checking API key", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        onKeySelected();
      }
    } catch (e) {
      console.error("Failed to select key", e);
      alert("Có lỗi xảy ra khi chọn API key. Vui lòng thử lại.");
    }
  };

  const handleManualSubmit = () => {
      if (manualKey.trim().length > 10) {
          sessionStorage.setItem('GEMINI_API_KEY', manualKey.trim());
          setHasKey(true);
          onKeySelected();
      } else {
          alert("API Key không hợp lệ. Vui lòng kiểm tra lại.");
      }
  };

  if (loading) return null;
  // Only hide if we have a key AND we are not in "Change Key" mode (onCancel undefined)
  if (hasKey && !onCancel) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F0F8FF]/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/60 relative overflow-hidden ring-1 ring-cyan-100 animate-fade-in-up">
        
        {/* Close/Cancel Button for Change Mode */}
        {onCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Đóng"
            >
                <X className="w-5 h-5" />
            </button>
        )}

        {/* Decorative Orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <Key className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {onCancel ? "Đổi Khóa Kết Nối" : "Kết Nối Google Cloud"}
          </h2>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            Để tạo ảnh chất lượng cao với <strong>NanoBanana 3.0 Pro</strong>, vui lòng chọn dự án có liên kết thanh toán.
          </p>

          {!showManualInput ? (
              <>
                <button
                    onClick={handleSelectKey}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mb-4"
                >
                    <ShieldCheck className="w-5 h-5" />
                    {onCancel ? "Chọn Dự Án Khác" : "Chọn API Key (Google Project)"}
                </button>
                <button 
                    onClick={() => setShowManualInput(true)}
                    className="text-xs text-slate-500 underline hover:text-cyan-600 transition-colors"
                >
                    Tôi đã có API Key (Nhập thủ công)
                </button>
              </>
          ) : (
              <div className="space-y-3 animate-fade-in-up">
                  <div className="text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nhập API Key</label>
                      <input 
                          type="password" 
                          value={manualKey}
                          onChange={(e) => setManualKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full p-3 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-sm font-mono text-slate-700"
                      />
                  </div>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => setShowManualInput(false)}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                      >
                          Quay lại
                      </button>
                      <button 
                          onClick={handleManualSubmit}
                          className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-1"
                      >
                          Lưu Key <ChevronRight className="w-4 h-4" />
                      </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic mt-2">
                      Key sẽ được lưu tạm thời trong trình duyệt và tự động xóa khi bạn đóng tab.
                  </p>
              </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200/50">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-cyan-600 flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              Thông tin về thanh toán <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

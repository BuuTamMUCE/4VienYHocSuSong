
import React, { useState, useEffect } from 'react';
import { ConsoleData, GenerationMode } from '../types';
import { validateAndOptimizePrompt } from '../services/geminiService';
import { ShieldCheck, RefreshCw, Wand2, X, Lock, Type, Edit3, Eye, CheckCircle, AlertTriangle, LayoutTemplate } from 'lucide-react';

interface UnifiedCommandConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ConsoleData) => void;
  initialData: ConsoleData;
}

export const UnifiedCommandConsole: React.FC<UnifiedCommandConsoleProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialData 
}) => {
  const [data, setData] = useState<ConsoleData>(initialData);
  const [isChecking, setIsChecking] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TEXT' | 'VISUAL'>('TEXT');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setData(initialData);
        setAnalysis(null);
        setIsChecking(false);
    }
  }, [isOpen, initialData]);

  const handleOptimize = async () => {
    setIsChecking(true);
    setAnalysis(null);
    try {
        const result = await validateAndOptimizePrompt(data.title, data.body, data.visualPrompt, data.mode, data.subtitle);
        setData(prev => ({
            ...prev,
            title: result.optimizedTitle,
            subtitle: result.optimizedSubtitle, // Update subtitle if AI refined it (e.g. Uppercase)
            visualPrompt: result.optimizedPrompt
        }));
        setAnalysis(result.analysis || "Đã tối ưu hóa thành công.");
    } catch (e) {
        console.error("Optimization failed", e);
        setAnalysis("Lỗi kết nối AI. Vui lòng thử lại.");
    } finally {
        setIsChecking(false);
    }
  };

  const handleConfirm = () => {
      onConfirm(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                     <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-slate-800">Unified Command Console</h2>
                     <p className="text-xs text-slate-500 font-medium">Hệ thống Kiểm soát & Tối ưu hóa Nội dung</p>
                 </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                 <X className="w-6 h-6" />
             </button>
        </div>

        {/* Content Body */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Panel: TEXT CONTROL */}
            <div className={`flex-1 flex flex-col border-r border-slate-100 bg-white ${activeTab !== 'TEXT' ? 'hidden md:flex' : ''}`}>
                <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                        <Type className="w-4 h-4" /> Nội Dung Văn Bản (Overlay)
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                    </span>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Tiêu đề (Headline)</label>
                        <input 
                            value={data.title}
                            onChange={(e) => setData({...data, title: e.target.value})}
                            className="w-full p-3 rounded-xl border border-slate-200 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-cyan-200 outline-none"
                            placeholder="Nhập tiêu đề..."
                        />
                        {data.mode === 'THUMBNAIL' && <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Bắt buộc IN HOA & Tiếng Việt</p>}
                    </div>

                    {/* DUAL INPUT EDITING FOR THUMBNAIL */}
                    {data.mode === 'THUMBNAIL' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block uppercase text-orange-600">Nội dung phụ (Subtitle/Hook)</label>
                            <input 
                                value={data.subtitle || ""}
                                onChange={(e) => setData({...data, subtitle: e.target.value})}
                                className="w-full p-3 rounded-xl border border-orange-200 bg-orange-50 text-base font-bold text-slate-700 focus:ring-2 focus:ring-orange-200 outline-none"
                                placeholder="VD: BÍ QUYẾT SỐNG KHỎE..."
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Dòng chữ này sẽ nằm ngay dưới tiêu đề chính.</p>
                        </div>
                    )}

                    <div className={data.mode === 'THUMBNAIL' ? 'opacity-50 pointer-events-none grayscale' : ''}>
                        <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Nội dung chi tiết (Body)</label>
                        <textarea 
                            value={data.body}
                            onChange={(e) => setData({...data, body: e.target.value})}
                            className="w-full h-40 p-3 rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed focus:ring-2 focus:ring-cyan-200 outline-none resize-none"
                            placeholder={data.mode === 'THUMBNAIL' ? "Không dùng cho Thumbnail" : "Nhập nội dung slide..."}
                            disabled={data.mode === 'THUMBNAIL'}
                        />
                    </div>
                    
                    {data.mode === 'THUMBNAIL' && (
                         <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                             <LayoutTemplate className="w-8 h-8 text-slate-300" />
                             <div className="text-[10px] text-slate-500">
                                 <p className="font-bold text-slate-700">LAYOUT PREVIEW (WIREFRAME)</p>
                                 <ul className="list-disc pl-3 mt-1 space-y-0.5">
                                     <li>Text Zone: Left 60% (Vertical Stack)</li>
                                     <li>Visual Zone: Right 40% (Subject)</li>
                                     <li>Safe Zones: Top-Right (Logo), Bottom-Right (Name)</li>
                                 </ul>
                             </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Right Panel: VISUAL PROMPT */}
            <div className={`flex-1 flex flex-col bg-slate-50/30 ${activeTab !== 'VISUAL' ? 'hidden md:flex' : ''}`}>
                <div className="p-3 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 uppercase flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Visual Prompt (Câu lệnh)
                    </span>
                </div>
                <div className="p-5 flex-grow flex flex-col overflow-hidden">
                    <div className="flex-grow relative">
                         <textarea 
                            value={data.visualPrompt}
                            onChange={(e) => setData({...data, visualPrompt: e.target.value})}
                            className="w-full h-full p-4 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-600 leading-relaxed focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                        />
                        <div className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm pointer-events-none opacity-50"><Edit3 className="w-4 h-4 text-purple-400"/></div>
                    </div>
                    {analysis && (
                        <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-xs flex items-start gap-2 animate-fade-in">
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">AI Feedback:</span> {analysis}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Tab Switcher (Mobile Only) */}
        <div className="flex md:hidden border-t border-slate-200">
            <button onClick={() => setActiveTab('TEXT')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'TEXT' ? 'bg-white text-blue-600 border-t-2 border-blue-500' : 'bg-slate-50 text-slate-500'}`}>TEXT CONTROL</button>
            <button onClick={() => setActiveTab('VISUAL')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'VISUAL' ? 'bg-white text-purple-600 border-t-2 border-purple-500' : 'bg-slate-50 text-slate-500'}`}>VISUAL PROMPT</button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center gap-4">
             <button 
                onClick={handleOptimize}
                disabled={isChecking}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-all flex items-center gap-2"
             >
                 {isChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                 {isChecking ? "Đang quét..." : "Kiểm tra & Tối ưu (Flash)"}
             </button>

             <button 
                onClick={handleConfirm}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
             >
                 <Wand2 className="w-4 h-4" />
                 XÁC NHẬN & TẠO ẢNH
             </button>
        </div>
      </div>
    </div>
  );
};

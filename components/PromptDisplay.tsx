
import React from 'react';
import { Wand2, Sparkles, Edit3, Smartphone, Monitor, Square, Layout, Youtube, ShieldPlus, Upload, X, Palette, Facebook, Video, MessageCircle, ImagePlus, Type, User, CircleStop, Subtitles } from 'lucide-react';
import { AspectRatioType, GenerationMode } from '../types';
import { SmartEditButton } from './SmartEditButton';

interface PromptDisplayProps {
  mode?: GenerationMode; 
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
  selectedRatio: AspectRatioType;
  onRatioChange: (ratio: AspectRatioType) => void;
  includeLogo: boolean;
  onIncludeLogoChange: (include: boolean) => void;
  customLogo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  titleColor: string;
  onTitleColorChange: (color: string) => void;
  bodyColor: string;
  onBodyColorChange: (color: string) => void;
  referenceImage: string | null;
  onReferenceImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReferenceImage: () => void;
  thumbnailAvatar?: string | null;
  onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar?: () => void;
  avatarName?: string;
  onAvatarNameChange?: (name: string) => void;
  // NEW: Subtitle prop for Thumbnail Mode
  subtitle?: string;
  onSubtitleChange?: (sub: string) => void;
  // NEW: Cost Estimate
  estimatedCost?: number;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ 
  mode,
  prompt, 
  onPromptChange, 
  onGenerateImage,
  isGeneratingImage,
  selectedRatio,
  onRatioChange,
  includeLogo,
  onIncludeLogoChange,
  customLogo,
  onLogoUpload,
  onRemoveLogo,
  titleColor,
  onTitleColorChange,
  bodyColor,
  onBodyColorChange,
  referenceImage,
  onReferenceImageUpload,
  onRemoveReferenceImage,
  thumbnailAvatar,
  onAvatarUpload,
  onRemoveAvatar,
  avatarName,
  onAvatarNameChange,
  subtitle,
  onSubtitleChange,
  estimatedCost
}) => {

  const ratios: { value: AspectRatioType; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: '1:1', label: 'Vuông', icon: <Square className="w-4 h-4" />, desc: 'Instagram' },
    { value: '9:16', label: 'Dọc', icon: <Smartphone className="w-4 h-4" />, desc: 'TikTok/Reels' },
    { value: '16:9', label: 'Ngang', icon: <Youtube className="w-4 h-4" />, desc: 'Slide/YouTube' },
    { value: '3:4', label: 'Dọc', icon: <Layout className="w-4 h-4 rotate-90" />, desc: 'Facebook' },
    { value: '4:3', label: 'Ngang', icon: <Layout className="w-4 h-4" />, desc: 'TV' },
  ];

  const colors = [
    { value: 'white', label: 'Trắng', class: 'bg-white text-slate-800 border-slate-200' },
    { value: 'black', label: 'Đen', class: 'bg-black text-white border-slate-800' },
    { value: 'gold', label: 'Vàng Kim', class: 'bg-yellow-400 text-yellow-900 border-yellow-500' },
    { value: 'navy', label: 'Xanh Đậm', class: 'bg-blue-900 text-white border-blue-950' },
  ];

  return (
    <div className="w-full bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-cyan-900/5 border border-white/60 overflow-hidden flex flex-col h-full animate-fade-in-up">
      <div className="bg-gradient-to-r from-white/40 to-transparent p-5 border-b border-white/50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-700">
          <Sparkles className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
          <h3 className="font-bold text-slate-800">Cấu hình Thiết Kế</h3>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 rounded-full border border-cyan-200">
          VIỆN Y HỌC SỰ SỐNG
        </span>
      </div>
      
      {/* NEW: Subtitle Input for Thumbnail Mode */}
      {mode === 'THUMBNAIL' && (
          <div className="bg-orange-50/50 p-4 border-b border-orange-100 relative">
             <div className="flex justify-between items-center mb-2">
                 <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block flex items-center gap-2">
                     <Subtitles className="w-3 h-3" /> Nội dung phụ (Subtitle)
                 </label>
                 <SmartEditButton 
                    originalText={subtitle || ""}
                    onApply={(newText) => onSubtitleChange?.(newText)}
                    contextLabel="Subtitle"
                 />
             </div>
             <input 
               type="text" 
               value={subtitle || ""}
               onChange={(e) => onSubtitleChange?.(e.target.value)}
               placeholder="NHẬP SUBTITLE IN HOA..."
               className="w-full p-2 text-sm font-bold text-slate-700 border border-orange-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-200 uppercase"
             />
          </div>
      )}

      {/* Prompt Editor */}
      <div className="relative flex-grow group border-b border-white/50 bg-white/40 min-h-[150px]">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="w-full h-full p-6 text-sm text-slate-600 font-mono leading-relaxed resize-none focus:outline-none bg-transparent placeholder:text-slate-400"
          placeholder="Nội dung prompt sẽ hiển thị ở đây..."
        />
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100">
             <SmartEditButton 
                originalText={prompt}
                onApply={onPromptChange}
                contextLabel="Visual Prompt"
             />
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white/50">
        
        {/* Ratio Selector */}
        <div className="p-5 pb-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
            Kích thước
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {ratios.map((r) => (
              <button
                key={r.value}
                onClick={() => onRatioChange(r.value)}
                disabled={isGeneratingImage}
                title={r.desc}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                  ${selectedRatio === r.value 
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm' 
                    : 'bg-white/60 border-transparent text-slate-500 hover:bg-white'
                  }
                `}
              >
                {r.icon}
                <span className="text-[9px] font-bold mt-1">{r.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Color Selector */}
        <div className="px-5 pb-3 space-y-3">
           <div>
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
               <Type className="w-3 h-3" /> Màu Tiêu Đề
             </label>
             <div className="flex gap-2">
               {colors.map((c) => (
                  <button 
                    key={c.value}
                    onClick={() => onTitleColorChange(c.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all shadow-sm flex items-center justify-center gap-1 ${c.class}
                      ${titleColor === c.value ? 'ring-2 ring-cyan-400 ring-offset-1 scale-105 z-10' : 'opacity-70 hover:opacity-100'}
                    `}
                  >
                    {titleColor === c.value && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>}
                    {c.label}
                  </button>
               ))}
             </div>
           </div>

           <div>
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
               <Palette className="w-3 h-3" /> Màu Nội Dung
             </label>
             <div className="flex gap-2">
               {colors.map((c) => (
                  <button 
                    key={c.value}
                    onClick={() => onBodyColorChange(c.value)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all shadow-sm flex items-center justify-center gap-1 ${c.class}
                      ${bodyColor === c.value ? 'ring-2 ring-cyan-400 ring-offset-1 scale-105 z-10' : 'opacity-70 hover:opacity-100'}
                    `}
                  >
                    {bodyColor === c.value && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>}
                    {c.label}
                  </button>
               ))}
             </div>
           </div>
        </div>
        
        {/* AVATAR UPLOAD */}
        {mode === 'THUMBNAIL' && (
            <div className="px-5 pb-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                <User className="w-3 h-3" /> Ảnh Nhân Vật (Avatar)
                </label>
                <div className="bg-white/40 border border-dashed border-slate-300 rounded-xl p-2 relative">
                    {thumbnailAvatar ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                      <img src={thumbnailAvatar} alt="Avatar" className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-bold text-slate-700">Đã tải nhân vật</p>
                                      <p className="text-[9px] text-cyan-600">Sẽ chèn vào góc ảnh</p>
                                  </div>
                              </div>
                              <button onClick={onRemoveAvatar} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                          <div className="pt-1 border-t border-slate-100">
                             <input 
                               type="text" 
                               value={avatarName} 
                               onChange={(e) => onAvatarNameChange?.(e.target.value)}
                               placeholder="Nhập tên/mô tả (sẽ hiển thị khung Vàng)"
                               className="w-full p-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 bg-white/70"
                             />
                          </div>
                        </div>
                    ) : (
                        <label className="flex items-center justify-center gap-2 cursor-pointer w-full py-1 hover:bg-white/50 rounded-lg transition-colors">
                            <input type="file" accept="image/png, image/webp" onChange={onAvatarUpload} className="hidden" />
                            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-cyan-600 shadow-sm border border-cyan-100"><Upload className="w-3 h-3" /></div>
                            <span className="text-[10px] font-bold text-slate-600">Tải ảnh xóa nền (PNG)</span>
                        </label>
                    )}
                </div>
            </div>
        )}

        {/* Style Reference Image */}
        <div className="px-5 pb-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
              <ImagePlus className="w-3 h-3" /> Ảnh Tham Chiếu (Phong cách)
            </label>
            <div className="bg-white/40 border border-dashed border-slate-300 rounded-xl p-2 relative">
               {referenceImage ? (
                  <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                             <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-slate-700">Đã tải ảnh mẫu</p>
                             <p className="text-[9px] text-cyan-600">AI sẽ bắt chước màu sắc</p>
                          </div>
                       </div>
                       <button onClick={onRemoveReferenceImage} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><X className="w-3 h-3" /></button>
                  </div>
               ) : (
                  <label className="flex items-center justify-center gap-2 cursor-pointer w-full py-1 hover:bg-white/50 rounded-lg transition-colors">
                      <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={onReferenceImageUpload} className="hidden" />
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-cyan-600 shadow-sm border border-cyan-100"><Upload className="w-3 h-3" /></div>
                      <span className="text-[10px] font-bold text-slate-600">Tải ảnh mẫu (PNG/JPG)</span>
                  </label>
               )}
            </div>
        </div>

        {/* Branding Options */}
        <div className="px-5 pb-5">
            <button
              onClick={() => onIncludeLogoChange(!includeLogo)}
              disabled={isGeneratingImage}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all mb-2 ${includeLogo ? 'bg-blue-50/50 border-blue-200' : 'bg-white/40 border-transparent hover:bg-white/60'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${includeLogo ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><ShieldPlus className="w-4 h-4" /></div>
                <div className="text-left"><div className={`text-sm font-semibold ${includeLogo ? 'text-blue-700' : 'text-slate-600'}`}>Chèn Logo Viện</div><div className="text-[10px] text-slate-400">Tự động chèn logo vào góc ảnh</div></div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${includeLogo ? 'bg-blue-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${includeLogo ? 'left-6' : 'left-1'}`} /></div>
            </button>

            {/* Upload Area */}
            {includeLogo && (
               <div className="p-3 bg-white/40 border border-dashed border-slate-300 rounded-xl relative">
                  {customLogo ? (
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-slate-200 p-1 flex-shrink-0"><img src={customLogo} alt="Custom Logo" className="w-full h-full object-contain" /></div>
                          <div><p className="text-xs font-bold text-slate-700">Logo Của Bạn</p><p className="text-[10px] text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Đã đặt làm mặc định</p></div>
                       </div>
                       <button onClick={onRemoveLogo} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Xóa logo"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-3 w-full cursor-pointer py-2 group hover:bg-white/50 transition-colors rounded-lg">
                       <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={onLogoUpload} className="hidden" />
                       <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm text-cyan-600 group-hover:scale-110 transition-transform border border-cyan-100"><Upload className="w-4 h-4" /></div>
                       <div className="text-left"><p className="text-xs font-bold text-slate-700 group-hover:text-cyan-700 transition-colors">Tải lên Logo Mới</p><p className="text-[10px] text-slate-500">Sẽ áp dụng cho toàn bộ slide</p></div>
                    </label>
                  )}
               </div>
            )}
        </div>

        {/* Action Button */}
        <div className="p-5 pt-0">
          <button
            onClick={onGenerateImage}
            disabled={!prompt.trim() && !isGeneratingImage}
            className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0
              ${isGeneratingImage 
                ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200' 
                : 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 hover:from-yellow-200 hover:to-amber-300 text-slate-900 shadow-yellow-400/30'
              }`}
          >
            {isGeneratingImage ? (
              <>
                <CircleStop className="w-5 h-5 animate-pulse" />
                <span className="tracking-wide">DỪNG TẠO ẢNH</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-slate-800" />
                <span className="tracking-wide text-slate-800 flex flex-col items-start leading-tight">
                    <span>TẠO ẢNH NGAY</span>
                    {estimatedCost && <span className="text-[10px] font-medium opacity-80">(~{estimatedCost.toLocaleString()}đ)</span>}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

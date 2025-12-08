
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Gift, BookOpen, Star, PartyPopper } from 'lucide-react';

export const CampaignModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check session storage to ensure it only shows once per session
    const hasSeen = sessionStorage.getItem('HAS_SEEN_CAMPAIGN_TET_2026');
    if (!hasSeen) {
      // Small delay for smooth entrance animation after app loads
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('HAS_SEEN_CAMPAIGN_TET_2026', 'true');
  };

  const handleAction = () => {
    window.open('https://docs.google.com/forms/d/1BfQH3KK3OPXRlGMyf7elKijYM5dI8yR7XNpL8Q_eANY/preview', '_blank');
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up border border-white/20">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20 backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visual Banner (Simulated) */}
        <div className="h-40 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 relative flex items-center justify-center overflow-hidden shrink-0">
            {/* Decorative Elements */}
            <div className="absolute top-[-50%] left-[-20%] w-60 h-60 bg-amber-300/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-60 h-60 bg-yellow-300/20 rounded-full blur-3xl"></div>
            
            <div className="text-center z-10 text-white">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <BookOpen className="w-8 h-8 text-amber-200 drop-shadow-md" />
                    <Gift className="w-8 h-8 text-amber-200 drop-shadow-md" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md text-amber-100">GEMS 2026</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-red-100 opacity-90">Sổ Chiến Binh & Bao Lì Xì</p>
            </div>
            
            {/* Sparkling Pattern */}
            <Star className="absolute top-4 left-8 w-4 h-4 text-amber-200 animate-pulse" />
            <Star className="absolute bottom-6 right-10 w-3 h-3 text-amber-200 animate-pulse delay-75" />
            <Star className="absolute top-10 right-20 w-2 h-2 text-white animate-pulse delay-150" />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-gradient-to-b from-white to-red-50/30">
            <h3 className="text-lg font-bold text-red-700 mb-3 leading-tight text-center">
               📣 THÔNG BÁO – RA MẮT SỔ CHIẾN BINH GIEO TRỒNG SỰ SỐNG & BAO LÌ XÌ 2026 🎉
            </h3>
            
            <p className="text-sm text-slate-600 mb-4 italic font-medium">
               🍀 Chào Quý Đại Sứ/Sứ Giả thân mến!
            </p>
            
            <p className="text-sm text-slate-700 mb-5 leading-relaxed">
               Để chuẩn bị cho mùa Tết rực rỡ và chuyên nghiệp hơn, Gia Đình Gems chính thức ra mắt <strong>SỔ CHIẾN BINH GIEO TRỒNG SỰ SỐNG</strong> và <strong>BAO LÌ XÌ XUÂN BÍNH NGỌ 2026</strong>. Thiết kế sang trọng, mang dấu ấn thương hiệu Gems, vừa dùng trong công việc vừa biếu tặng cực kỳ ý nghĩa.
            </p>

            <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4" /> Sổ Công Ty:
                    </h4>
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                        <li>Khởi đầu năm mới với sự chỉn chu, chuyên nghiệp.</li>
                        <li>Giúp ghi lại mục tiêu – kế hoạch, làm việc có định hướng, hiệu quả.</li>
                        <li>Món quà mang dấu ấn thương hiệu, nhận diện mạnh mẽ.</li>
                        <li>Món quà thiết thực cho thành viên nhóm ghi lại dấu ấn hành trình 2026.</li>
                        <li>Khích lệ tinh thần học hỏi, gửi gắm niềm tin.</li>
                    </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h4 className="font-bold text-red-800 text-sm flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4" /> Bao Lì Xì 2026:
                    </h4>
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                        <li>Họa tiết độc quyền, lời chúc khai mở may mắn – tài lộc.</li>
                        <li>Cầu nối thấu hiểu hạnh nguyện Gems.</li>
                        <li>Phù hợp tặng khách – tặng team – tặng gia đình.</li>
                    </ul>
                </div>
            </div>

            <p className="text-sm text-slate-600 mt-5 font-medium border-l-4 border-amber-400 pl-3">
               ✨ Dịp để lan tỏa thương hiệu và tăng kết nối đội nhóm mùa Tết. Chúc anh chị một mùa Tết bùng nổ – rực rỡ – đầy năng lượng tích cực!
            </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-lg z-10">
            <button 
                onClick={handleAction}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm uppercase tracking-wide group"
            >
                <PartyPopper className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                👉 ĐĂNG KÝ ĐẶT HÀNG NGAY
                <ExternalLink className="w-4 h-4" />
            </button>
        </div>

      </div>
    </div>
  );
};

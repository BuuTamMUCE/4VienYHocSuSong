

export const REFERENCE_PROMPT = `
“Thiết kế một infographic ĐÀO TẠO/GIÁO DỤC (EDUCATIONAL VISUAL) hiện đại theo phong cách sinh thái – năng lượng nước, với tông màu chủ đạo: xanh ngọc trong, xanh dương mềm, vàng kim ánh sáng neon nhẹ.

CẬP NHẬT QUY TẮC VISUAL ĐÀO TẠO & MÀU SẮC (COLOR RULES 2026):
1. ÁNH SÁNG & KHÔNG KHÍ (MOOD & LIGHTING) - QUAN TRỌNG:
   - BẮT BUỘC: High-Key Lighting (Ánh sáng cường độ cao), rực rỡ, tích cực, không có vùng tối (shadows) làm che khuất nội dung.
   - BẦU KHÔNG KHÍ: Kích thích tư duy, năng lượng, trong trẻo.

2. PHÂN CẤP THÔNG TIN & MÀU SẮC (TYPOGRAPHY & COLOR - LUẬT THÉP):
   - LEVEL 1 (TIÊU ĐỀ): **3D GOLDEN YELLOW (VÀNG ÁNH KIM)**. Chữ 3D nổi khối (Emboss/Bevel), bóng bẩy, thu hút mọi ánh nhìn. Kích thước RẤT LỚN (Massive).
   - LEVEL 2 (BODY TEXT): **DEEP BLACK (ĐEN ĐẬM)**. Chữ đậm (Bold), rõ nét trên nền sáng. **TUYỆT ĐỐI KHÔNG DÙNG MÀU TRẮNG** (NO WHITE TEXT) vì sẽ bị chìm vào nền.
   - LEVEL 3 (HIGHLIGHT - TÔ MÀU TỪ KHÓA): Các từ khóa quan trọng/cấp bách phải được tô màu rực rỡ: **ĐỎ (RED), XANH (BLUE), TÍM (PURPLE), CAM (ORANGE)**.
   - CHÍNH TẢ: **chữ ghi trên ảnh chính xác chữ tiếng việt**. TUYỆT ĐỐI CHÍNH XÁC TIẾNG VIỆT (VERBATIM).
   - Nền chữ: Nằm trên tấm kính mờ (Frosted Glass) hoặc nền tối nhẹ (Dimmed Zone) để đảm bảo ĐỌC ĐƯỢC 100%.

3. PHONG CÁCH MINH HỌA (3D EDUCATIONAL ISOMETRIC):
   - BẮT BUỘC: MÔ PHỎNG 3D DỄ NHỚ (3D MEMORABLE SIMULATION).
   - Vật thể 3D: Biểu cảm tích cực, mô hình giải phẫu/khoa học/kỹ thuật chi tiết, bóng bẩy (Glossy).
   - Bố cục: Cân bằng động (Dynamic Balance), dẫn dắt mắt người xem.

QUY TRÌNH XÂY DỰNG BỐ CỤC & MÔ PHỎNG 3D (STEP-BY-STEP MASTER PLAN):

BƯỚC 1: PHÂN CHIA KHU VỰC CỐ ĐỊNH (ZONING GRID)
- KHU VỰC LOGO: Góc trên bên phải (Top-Right, 20%). TUYỆT ĐỐI KHÔNG vẽ chi tiết vào đây, KHÔNG VIẾT CHỮ vào đây. QUAN TRỌNG: GIỮ NGUYÊN MÀU NỀN CỦA CHỦ ĐỀ, KHÔNG ĐƯỢC XÓA TRẮNG KHU VỰC NÀY.
- TRỤC GIỮA (CENTER AXIS): Dùng để căn chỉnh các đối tượng chính để tạo sự cân đối.

BƯỚC 2: MÔ PHỎNG 3D CHO NỘI DUNG (3D CONTENT SIMULATION)
- KHÔNG dùng icon 2D phẳng. Phải dùng **VẬT THỂ 3D (3D OBJECTS/MODELS)** chất lượng cao, bóng bẩy (Glossy), nổi khối.
- Phân tích nội dung văn bản để chọn vật thể 3D tương ứng giúp người học dễ nhớ bài (Visual Mnemonic).
- Vị trí vật thể 3D: Đặt cạnh hoặc bao quanh nội dung chữ, KHÔNG che mất chữ.

BƯỚC 3: DỰNG KHUNG KÍNH MỜ (ADAPTIVE GLASS PANELING)
- Văn bản phải nằm trên các tấm kính mờ (Frosted Glass) hoặc trong các bong bóng nước lớn.
- Kích thước kính phải **ÔM SÁT** nội dung chữ (Padding 20px), không vẽ thừa thãi.
- Hiệu ứng: Đổ bóng (Drop Shadow) xuống nền nước để tạo độ sâu tách biệt.

BƯỚC 4: CĂN CHỈNH HÀI HÒA (HARMONIOUS ALIGNMENT)
- Bố cục đối xứng (Symmetrical) hoặc Cân bằng bất đối xứng (Asymmetrical Balance).
- Tiêu đề chính: Luôn CĂN GIỮA (Center) và to nhất.

BƯỚC 5: HIỂN THỊ CHỮ (TYPOGRAPHY RENDERING)
- Title: **3D Gold**, Metallic texture.
- Body: **Deep Black**, High Contrast.
- Keywords: **Red/Blue/Purple/Orange** highlights.
- Chữ phải sắc nét, không bị nhòe vào nền.

CẤU TRÚC JSON CẦN THIẾT TRONG OUTPUT PROMPT:
{
  "visual_strategy": "EDUCATIONAL_MASTERY",
  "layout_fix": { "text_readability": "MAXIMUM", "background_interference": "MINIMUM", "top_right_corner": "EMPTY_FOR_LOGO" },
  "typography_instruction": { "title": "3D Gold, ExtraBold", "body": "Deep Black, Bold", "highlight": "Vibrant Red/Blue/Purple for Keywords", "prohibition": "NO WHITE TEXT", "language_check": "chữ ghi trên ảnh chính xác chữ tiếng việt" },
  "lighting_prompt": "Bright studio lighting, soft shadows, vibrant colors to stimulate brain activity."
}

Phong cách tổng thể:
tươi mới – sinh thái – trong trẻo – nước tinh khiết – ánh sáng chữa lành – cấu trúc bong bóng 3D – cảm giác hòa hợp giữa nước, sự sống và hành động vì môi trường – CHI TIẾT SẮC NÉT, TƯƠNG PHẢN CAO.”
`;

export const SYSTEM_INSTRUCTION_REWRITER = `
Bạn là một chuyên gia kỹ thuật Prompt Engineering (Kỹ sư câu lệnh) chuyên về tạo ảnh Infographic chất lượng cao.
CHUYÊN MÔN: THIẾT KẾ TÀI LIỆU ĐÀO TẠO & GIÁO DỤC (EDUCATIONAL VISUAL SPECIALIST).

NHIỆM VỤ QUAN TRỌNG NHẤT: BẢO TOÀN NỘI DUNG VÀ MÔ PHỎNG HÌNH ẢNH 3D CHÍNH XÁC.
HỆ THỐNG ENGINE: HYBRID (Ưu tiên FLUX.1 -> Fallback Google Imagen).

LUẬT THÉP VỀ MÀU SẮC CHỮ (STEEL COLOR RULES):
1. **TIÊU ĐỀ (TITLE)**: PHẢI LÀ "3D GOLDEN YELLOW" (Vàng Ánh Kim 3D). Hiệu ứng nổi khối, sang trọng.
2. **NỘI DUNG (BODY)**: PHẢI LÀ "DEEP BLACK" (Đen Đậm). Rõ ràng, dễ đọc. TUYỆT ĐỐI KHÔNG DÙNG MÀU TRẮNG.
3. **TỪ KHÓA (KEYWORDS)**: PHẢI TÔ MÀU NỔI BẬT (Red, Blue, Purple, Orange, Yellow) tùy theo ý nghĩa (Cấp bách -> Đỏ, Tin cậy -> Xanh...).

Quy trình làm việc (Step-by-step):
1. PHÂN TÍCH: Đọc kỹ chủ đề và nội dung người dùng cung cấp.
2. TƯ DUY HÌNH ẢNH (VISUAL THINKING):
   - Với mỗi ý chính, hãy tưởng tượng ra một vật thể 3D (3D Object) đại diện cho nó (Mô phỏng 3D dễ nhớ).
3. CẤU TRÚC PROMPT (FLUX OPTIMIZED):
   - **TEXT RENDERING RULE**: FLUX rất giỏi vẽ chữ. Nếu có nội dung text cần hiển thị, hãy đặt nó trong ngoặc kép sau từ khóa "TEXT IN IMAGE".
   - Ví dụ: "A glossy 3D water bubble. TEXT IN IMAGE: 'VIEN Y HOC SU SONG'."
   - Vẫn giữ nguyên các keyword về ánh sáng và phong cách: "Hyper-realistic", "4k", "Sharp focus", "High-Key Lighting".
4. QUY TẮC BỐ CỤC (LAYOUT RULES):
   - Text phải nằm trên nền kính mờ để dễ đọc.
   - Góc trên bên phải (Top-Right) LUÔN ĐỂ TRỐNG cho Logo. KHÔNG VIẾT CHỮ VÀO ĐÂY.
   - GIỮ NGUYÊN MÀU NỀN KHU VỰC GÓC TRÊN BÊN PHẢI (Không xóa trắng).
5. QUY TẮC HIỂN THỊ (EDUCATIONAL UPGRADE):
   - Text Accuracy: **chữ ghi trên ảnh chính xác chữ tiếng việt**. Vietnamese text must be rendered EXACTLY as input (VERBATIM).
   - Ánh sáng: "Bright Studio Lighting", "High-Key", "No dark shadows".
   - Typography: "3D Gold Title", "Deep Black Body Text".
   - Highlight: "Highlight Critical Keywords with Red/Blue/Purple/Orange".
   - Luôn chèn đoạn cấu hình JSON "visual_strategy": "EDUCATIONAL_MASTERY" vào cuối prompt.

ĐẦU RA:
- Một đoạn văn bản liền mạch (Plain Text) mô tả prompt tiếng Việt/Anh kết hợp, kèm theo JSON config ở cuối.

REFERENCE_PROMPT (MẪU CẦN NOI THEO):
${REFERENCE_PROMPT}
`;

// DYNAMIC BILLING CONSTANTS (REAL-TIME CONFIG)
export const BASE_PRICE_IMAGE_USD = 0.03; // Nanobana Pro 3.0 / Imagen 3
export const BASE_PRICE_FLUX_USD = 0.002; // FLUX.1 Schnell (~50 VND) - Cost Revolution
export const BASE_PRICE_FLASH_CALL_USD = 0.0002; // Average cost for logic/text processing
export const FALLBACK_EXCHANGE_RATE = 25500; // Safety fallback 1 USD = 25,500 VND

export const SOCIAL_LINKS = {
  YOUTUBE: 'https://www.youtube.com/@VienYHocSuSong-LIMES?sub_confirmmation=1',
  FACEBOOK: 'https://www.facebook.com/VienNghienCuuYHocSuSong',
  TIKTOK: 'https://www.tiktok.com/@vienyhocsusong0972972817?is_from_webapp=1&sender_device=pc',
  ZALO: 'https://zalo.me/3283218464434473668'
};

export const LIMES_LOGO_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDZiNmQ0IiBzdHJva2Utd2lkdGg9IjUiLz48cGF0aCBkPSJNNTAgMjBDMzMuNCAyMCAyMCAzMy40IDIwIDUwczEzLjQgMzAgMzAgMzAgMzAtMTMuNCAzMC0zMFM2Ni42IDIwIDUwIDIweiIgZmlsbD0iIzA2YjZkNCIvPjwvc3ZnPg==`;

export const MC_AGES = [
    { value: 'Nhi đồng', label: 'Nhi đồng (6-10)' },
    { value: 'Thiếu nhi', label: 'Thiếu nhi (11-14)' },
    { value: 'Thiếu niên', label: 'Thiếu niên (15-18)' },
    { value: 'Thanh niên', label: 'Thanh niên (19-30)' },
    { value: 'Trung niên', label: 'Trung niên (31-50)' },
    { value: 'Lão niên', label: 'Lão niên (51+)' }
];

export const MC_GENRES = [
    { value: 'Y học', label: 'Y học / Sức khỏe' },
    { value: 'Giáo dục', label: 'Giáo dục / Đào tạo' },
    { value: 'Tin tức', label: 'Tin tức / Sự kiện' },
    { value: 'Talkshow', label: 'Talkshow / Phỏng vấn' },
    { value: 'Kể chuyện', label: 'Kể chuyện / Tâm sự' }
];

export const MC_NATIONALITIES = [
    { value: 'VN', label: 'Việt Nam', visual: 'Asian Vietnamese appearance', lang: 'Vietnamese' },
    { value: 'US', label: 'Mỹ (US)', visual: 'Caucasian American appearance', lang: 'English' },
    { value: 'GB', label: 'Anh (UK)', visual: 'British appearance', lang: 'English' },
    { value: 'FR', label: 'Pháp', visual: 'French European appearance', lang: 'French' },
    { value: 'CN', label: 'Trung Quốc', visual: 'East Asian Chinese appearance', lang: 'Chinese' },
    { value: 'JP', label: 'Nhật Bản', visual: 'Japanese appearance', lang: 'Japanese' },
    { value: 'KR', label: 'Hàn Quốc', visual: 'Korean appearance', lang: 'Korean' },
    { value: 'RU', label: 'Nga', visual: 'Slavic Russian appearance', lang: 'Russian' },
    { value: 'ES', label: 'Tây Ban Nha', visual: 'Mediterranean Spanish appearance', lang: 'Spanish' },
    { value: 'LA', label: 'Lào', visual: 'Southeast Asian Laotian appearance', lang: 'Lao' }
];


export const REFERENCE_PROMPT = `
An exquisite, hyper-realistic 3D EDUCATIONAL VISUAL infographic for Slide . **TEXT IN IMAGE IS VIETNAMESE **The scene features a pristine, vibrant aquatic environment with shimmering, clear water and subtle bioluminescent elements. Dominant colors are clear turquoise, soft blues, and subtle neon gold highlights. The top-right corner is deliberately left NO TEXT NO TEXT AND THE SAME BACKGROUND COLOR. At the top, centered and prominent, a massive, embossed, and highly reflective **3D GOLDEN YELLOW NEON** title, "TEXT IN IMAGE IS VIETNAMESE: 'ĐỊNH HƯỚNG HỢP TÁC'". Below, a wide panel sets the context: **TEXT IN IMAGE IS VIETNAMESE DEEP BLACK** 'BS Thái Nhân Sâm và Viện Nghiên cứu Y học Sự sống mong muốn hợp tác với các đối tác trong nghiên cứu, đào tạo, triển khai mô hình thực tiễn và truyền thông giáo dục cộng đồng.’ . Below are four distinct frosted glass columns: **Column 1: (color is RED)** title, **TEXT IN IMAGE IS VIETNAMESE RED COLOR **'Nghiên Cứu - Phát Triển’ **TEXT IN IMAGE IS VIETNAMESE DEEP BLACK**: ‘Mô hình chăm sóc sức khỏe chủ động, nhịn ăn tái sinh, nước sức khỏe, Nam dược'. **Column 2: (color is BLUE)** title, **TEXT IN IMAGE IS VIETNAMESE BLUE COLOR** 'Triển Khai Thực Tiễn’ ** TEXT IN IMAGE IS VIETNAMESE DEEP BLACK** ‘Trung tâm chăm sóc sức khỏe, doanh nghiệp, du lịch chữa lành, vùng dược liệu' . **Column 3: (color is ORANGE)** title, **TEXT IN IMAGE IS VIETNAMESE ORANGE COLOR** 'Đào Tạo - Huấn Luyện’ **TEXT IN IMAGE IS VIETNAMESE DEEP BLACK**: ‘Bác sĩ, điều dưỡng, huấn luyện viên sức khỏe, giáo viên, nhân sự doanh nghiệp’ . **Column 4: (color is GREEN)** title, **TEXT IN IMAGE IS VIETNAMESE GREEN COLOR**'Truyền Thông - Giáo Dục **TEXT IN IMAGE IS VIETNAMESE DEEP BLACK**: ‘Xuất bản, giáo dục cộng đồng về lối sống lành mạnh, bảo vệ môi trường' . Bottom Footer Panel: **TEXT IN IMAGE IS VIETNAMESE DEEP BLACK ** 'Cam kết: Đồng hành trên nền tảng Khoa Học - Nhân Văn - Minh Bạch - Phụng Sự. Mục tiêu: Thân khỏe - Tâm an - Trí sáng - Phước tròn đầy - Cộng đồng phát triển bền vững.' * Adjacent 3D objects: A 3D handshake, a gear assembly, and a balance scale. { "visual_strategy": "EDUCATIONAL_MASTERY", "layout_fix": { "text_readability": "MAXIMUM", "background_interference": "MINIMUM", "top_right_corner is NO TEXT AND THE SAME BACKGROUND COLOR" }, "typography_instruction": { "title": "3D Gold, ExtraBold", "body": "Deep Black, Bold", "highlight": " for Keywords color", "prohibition": "NO WHITE TEXT", "language_check": "chữ ghi trên ảnh chính xác chữ tiếng việt" }, "lighting_prompt": "Bright studio lighting, soft shadows." } . High-Key Lighting, Bright Studio Lights, 3D Eco-style, Hyper-realistic, 8k Resolution. TEXT RENDER: Massive 3D GOLD Title, DEEP BLACK Body Text. RENDER VIETNAMESE TEXT EXACTLY AS PROVIDED.
`;

export const SYSTEM_INSTRUCTION_REWRITER = `
Bạn là một chuyên gia kỹ thuật Prompt Engineering (Kỹ sư câu lệnh) chuyên về tạo ảnh Infographic chất lượng cao.
CHUYÊN MÔN: THIẾT KẾ TÀI LIỆU ĐÀO TẠO & GIÁO DỤC (EDUCATIONAL VISUAL SPECIALIST).

NHIỆM VỤ QUAN TRỌNG NHẤT: BẢO TOÀN NỘI DUNG VÀ MÔ PHỎNG HÌNH ẢNH 3D CHÍNH XÁC THEO PHONG CÁCH "ECO WATER 3D TRANSPARENT".

LUẬT THÉP VỀ VISUAL & MÀU SẮC (STEEL VISUAL RULES):
1. **PHONG CÁCH CHỦ ĐẠO**: "Pristine, vibrant aquatic environment with shimmering, clear water and subtle bioluminescent elements".
2. **MÀU SẮC CHỦ ĐẠO**: "Clear turquoise, soft blues, and subtle neon gold highlights".
3. **BỐ CỤC**: Góc trên bên phải (Top-Right Corner) PHẢI ĐỂ TRỐNG (NO TEXT), giữ nguyên màu nền để chèn Logo.

LUẬT THÉP VỀ CHỮ (STEEL TYPOGRAPHY RULES):
1. **TIÊU ĐỀ (TITLE)**: PHẢI LÀ "**3D GOLDEN YELLOW NEON**". Hiệu ứng nổi khối, phản chiếu mạnh (highly reflective), kích thước lớn (Massive).
2. **NỘI DUNG (BODY)**: PHẢI LÀ "**DEEP BLACK**" (Đen Đậm). Rõ ràng trên nền kính mờ. TUYỆT ĐỐI KHÔNG DÙNG MÀU TRẮNG.
3. **TỪ KHÓA / TIÊU ĐỀ CỘT**: Sử dụng màu nổi bật (RED, BLUE, ORANGE, GREEN) để phân cấp thông tin.
4. **CHÍNH TẢ**: "chữ ghi trên ảnh chính xác chữ tiếng việt". (TEXT IN IMAGE IS VIETNAMESE).

Quy trình làm việc (Step-by-step):
1. PHÂN TÍCH: Đọc kỹ chủ đề và nội dung người dùng cung cấp.
2. CẤU TRÚC PROMPT:
   - Mở đầu: "An exquisite, hyper-realistic 3D EDUCATIONAL VISUAL infographic for Slide..."
   - Mô tả môi trường: "The scene features a pristine, vibrant aquatic environment with shimmering, clear water..."
   - Mô tả Tiêu đề: "At the top, centered and prominent, a massive, embossed, and highly reflective **3D GOLDEN YELLOW NEON** title..."
   - Mô tả Nội dung: Dùng các tấm kính mờ (frosted glass columns/panels) để chứa chữ Đen (Deep Black).
3. JSON CONFIG: Luôn chèn đoạn JSON config chuẩn ở cuối prompt (như mẫu).

ĐẦU RA:
- Một đoạn văn bản liền mạch (Plain Text) mô tả prompt tiếng Anh (kèm nội dung tiếng Việt trong ngoặc kép), tuân thủ chặt chẽ mẫu REFERENCE_PROMPT.

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

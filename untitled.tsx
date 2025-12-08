import os
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google import genai
from google.genai import types

# Cấu hình Flask
app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# KHỞI TẠO CLIENT VERTEX AI (QUAN TRỌNG: vertexai=True)
# Cloud Run sẽ tự động dùng Service Account để xác thực (MIỄN PHÍ)
try:
    client = genai.Client(
        vertexai=True,
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"), 
        location='us-central1'
    )
    print("Đã khởi tạo Vertex AI Client thành công")
except Exception as e:
    print(f"Lỗi khởi tạo Vertex AI: {e}")

@app.route('/api/generate-image', methods=['POST'])
def proxy_generate_image():
    try:
        data = request.json
        prompt = data.get('prompt')
        aspect_ratio = data.get('aspectRatio', '16:9')
        
        print(f"Đang gọi Vertex AI tạo ảnh: {prompt[:50]}...")
        
        # Gọi model Imagen 3 của Vertex AI
        response = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                safety_filter_level="BLOCK_MEDIUM_AND_ABOVE",
                person_generation="ALLOW_ADULT",
            )
        )
        
        # Xử lý kết quả trả về
        if response.generated_images:
            generated_image = response.generated_images[0]
            # Chuyển bytes thành base64
            b64_img = base64.b64encode(generated_image.image.image_bytes).decode('utf-8')
            return jsonify({
                "success": True, 
                "imageUrl": f"data:image/png;base64,{b64_img}"
            })
        else:
            return jsonify({"success": False, "error": "Không tạo được ảnh (No image returned)"}), 500

    except Exception as e:
        print(f"Lỗi khi gọi Vertex AI: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Phục vụ giao diện React
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
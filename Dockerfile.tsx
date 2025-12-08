# Giai đoạn 1: Build Frontend (React/Vite)
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Tạo biến môi trường giả để build không lỗi (Key thật không cần dùng nữa)
ENV GEMINI_API_KEY="placeholder"
RUN npm run build

# Giai đoạn 2: Setup Backend (Python Flask)
FROM python:3.9-slim
WORKDIR /app

# Cài đặt thư viện Python cần thiết
RUN pip install flask flask-cors google-genai gunicorn

# Copy kết quả build từ giai đoạn 1 sang
COPY --from=build /app/dist ./dist

# Copy code backend
COPY main.py .

# Chạy server
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
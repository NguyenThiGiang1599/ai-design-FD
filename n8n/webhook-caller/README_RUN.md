# Webhook Caller Page – Hướng dẫn chạy (macOS Intel)

Bạn có 4 cách để chạy trang web tĩnh này:

## Cách 1: Mở file `index.html` trực tiếp
1. Giải nén thư mục `webhook-caller`.
2. Mở file `index.html` bằng trình duyệt (Chrome/Edge).
3. Điền `Base URL` n8n của bạn (ví dụ: `https://your-n8n-host`), giữ path `/webhook/generate-fd`.
4. Nhập `functionName`, `accountId`, `sessionId`, `text`. Bật `finalResult` nếu cần.
5. Bấm **Gửi request**. Nếu gặp lỗi CORS, hãy dùng Cách 2/3/4 hoặc cho phép CORS ở n8n.

## Cách 2: Dùng Python HTTP server (có sẵn trên macOS)
```bash
cd webhook-caller
python3 -m http.server 8080
# Mở http://localhost:8080
```

## Cách 3: Dùng Node.js + serve
```bash
brew install node    # nếu chưa có
cd webhook-caller
npm install
npm run start        # mở http://localhost:5173
```

## Cách 4: Docker + Nginx
```bash
cd webhook-caller
docker build -t webhook-caller .
docker run --rm -p 8080:80 webhook-caller
# Mở http://localhost:8080
```

### Cấu hình cần lưu ý
- **CORS**: Nếu gọi webhook từ trình duyệt, n8n cần cho phép CORS từ origin của bạn (Settings → Security → CORS). Nếu chưa cấu hình, hãy test nhanh bằng nút **Copy cURL** rồi dán vào Terminal.
- **HTTPS**: Nếu n8n ở HTTPS và bạn chạy file trực tiếp, một số trình duyệt có thể chặn mixed content. Chạy qua HTTP server local sẽ ổn định hơn.
- **Payload mẫu**:
```json
{
  "finalResult": false,
  "text": "Xin chào",
  "accountId": "acc_123",
  "sessionId": "sess_456",
  "functionName": "createUser"
}
```

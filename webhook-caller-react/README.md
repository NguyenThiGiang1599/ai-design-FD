# Webhook Caller React (ChatGPT-style, CSS thuần)

UI dạng ChatGPT (sidebar + khung chat + composer) để gửi payload tới n8n Webhook và xem phản hồi theo kiểu “chat log”. Không dùng Tailwind – tất cả là **CSS thuần** nằm trong `App.jsx`.

## 🚀 Tính năng
- Form cấu hình: `Base URL`, `Path`, `functionName`, `accountId`, `sessionId`, `finalResult`, `text`
- Gọi webhook (`POST`) và hiển thị response theo dạng “bong bóng chat”
- **Copy cURL** (tự escape chuỗi an toàn)
- **Generate IDs** nhanh cho `accountId`/`sessionId`
- Lưu **history** & **state** bằng `localStorage` (click vào item trong sidebar để nạp lại)
- CSS thuần nhúng trực tiếp bên trong component → không cần cài Tailwind

---

## 🧰 Yêu cầu môi trường

- **Node.js ≥ 20.19** (khuyến nghị Node 20 LTS)  
  Kiểm tra:
  ```bash
  node -v
  ```

### Cài Node 20 (chọn một cách)

**Cách A – nvm (khuyên dùng)**
```bash
# cài nvm (Homebrew, Mac Intel)
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc

nvm install 20 --latest-npm
nvm use 20
nvm alias default 20
```

**Cách B – Homebrew Node 20 (không dùng nvm)**
```bash
brew install node@20
brew unlink node 2>/dev/null || true
brew link --overwrite --force node@20
echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## 📦 Cài đặt & chạy

```bash
# 1) cài dependencies
npm install

# 2) chạy dev
npm run dev
# -> mở URL mà Vite in ra (thường http://localhost:5173)
```

> Nếu bạn mới clone và muốn chắc chắn sạch sẽ:
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🏗️ Build & preview production

```bash
npm run build
npm run preview
# -> mặc định http://localhost:4173
```

### Serve build bằng Python (tùy chọn)
```bash
# sau khi build, Vite tạo ./dist
cd dist
python3 -m http.server 8080
# mở http://localhost:8080
```

---

## 🔧 Cấu hình n8n & CORS

Khi gọi webhook từ trình duyệt, cần bật CORS cho origin của bạn:

- n8n → **Settings → Security → CORS** → thêm:
  - `http://localhost:5173` (dev với Vite)
  - hoặc domain/port bạn dùng khi deploy.

Nếu không tiện chỉnh CORS, bạn có thể dùng nút **Copy cURL** và chạy trong Terminal (không gặp CORS).

---

## 🧪 Payload mẫu & cURL

**Payload JSON**
```json
{
  "finalResult": false,
  "text": "Xin chào",
  "accountId": "acc_123",
  "sessionId": "sess_456",
  "functionName": "createUser"
}
```

**cURL**
```bash
curl -X POST https://your-n8n-host/webhook/generate-fd   -H "Content-Type: application/json"   -d "{\"finalResult\":false,\"text\":\"Xin chào\",\"accountId\":\"acc_123\",\"sessionId\":\"sess_456\",\"functionName\":\"createUser\"}"
```

---

## 🗂️ Cấu trúc chính (Vite)
```
webhook-caller-react/
├─ src/
│  ├─ App.jsx        # component React (đã kèm <style> CSS thuần)
│  ├─ main.jsx       # mount React
│  └─ index.css      # có thể để trống/đơn giản; không cần Tailwind
├─ index.html
├─ package.json
└─ ...
```

> Lưu ý: **App.jsx** đã chứa thẻ `<style>{`...`}</style>` với CSS thuần. Không cần cài Tailwind.

---

## 🩺 Troubleshooting

- **`npm install` báo EBADENGINE hoặc Vite yêu cầu Node 20+**  
  → Bạn đang dùng Node quá cũ. Nâng cấp theo mục *Yêu cầu môi trường*.

- **`zsh: command not found: nvm`**  
  → Shell chưa load nvm. Thêm dòng `source` đúng đường dẫn Homebrew (Mac Intel: `/usr/local/opt/nvm/nvm.sh`) vào `~/.zshrc` và `source ~/.zshrc`.

- **Trên trình duyệt bị lỗi CORS**  
  → Bật CORS trong n8n hoặc dùng cURL (nút **Copy cURL** trong UI).

- **Mixed content (HTTPS/HTTP)**  
  → Nếu n8n dùng HTTPS, hãy chạy site qua HTTP server (Vite dev/preview) thay vì mở file tĩnh trực tiếp, hoặc dùng cùng giao thức.

- **Port đã dùng**  
  → Vite sẽ tự chọn port mới. Hoặc chỉ định: `vite --port 5174`.

---

## ✅ Checklist nhanh
- [ ] Node ≥ 20.19  
- [ ] `npm install` thành công  
- [ ] `npm run dev` chạy UI  
- [ ] CORS đã bật cho `http://localhost:5173` (nếu gọi trực tiếp)  
- [ ] Test cURL thành công

---

## 📌 Ghi chú cho phát triển thêm
- Nếu muốn tách CSS ra file riêng: di chuyển nội dung trong `<style>` sang `src/app.css`, sau đó `import './app.css'` trong `App.jsx`.
- Có thể thêm tuỳ chọn lưu nhiều cấu hình endpoint, export/import history, hoặc upload JSON làm payload.

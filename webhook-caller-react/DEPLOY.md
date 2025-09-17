# Deploy to Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo bạn đã có tài khoản Vercel tại [vercel.com](https://vercel.com)
2. Cài đặt Vercel CLI (tùy chọn):
   ```bash
   npm i -g vercel
   ```

## Bước 2: Deploy qua Vercel Dashboard (Khuyến nghị)

1. Truy cập [vercel.com](https://vercel.com) và đăng nhập
2. Click "New Project"
3. Import repository từ GitHub/GitLab/Bitbucket
4. Chọn thư mục `webhook-caller-react`
5. Vercel sẽ tự động detect React app và cấu hình:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click "Deploy"

## Bước 3: Deploy qua CLI (Tùy chọn)

1. Mở terminal trong thư mục `webhook-caller-react`
2. Chạy lệnh:
   ```bash
   vercel
   ```
3. Làm theo hướng dẫn:
   - Chọn scope (team hoặc personal)
   - Xác nhận project name
   - Chọn thư mục hiện tại
   - Không override settings (Vercel sẽ dùng vercel.json)

## Cấu hình đã được thiết lập

- ✅ `vercel.json` - Cấu hình routing cho SPA
- ✅ `package.json` - Build scripts
- ✅ `.gitignore` - Loại trừ files không cần thiết
- ✅ Vite config - Optimized cho production

## Sau khi deploy

1. Vercel sẽ cung cấp URL production (vd: `https://your-app.vercel.app`)
2. Mỗi lần push code mới, Vercel sẽ tự động deploy
3. Preview deployments cho mỗi pull request

## Troubleshooting

- Nếu gặp lỗi routing: Kiểm tra `vercel.json`
- Nếu build fail: Chạy `npm run build` local để debug
- Nếu dependencies lỗi: Xóa `node_modules` và chạy `npm install`
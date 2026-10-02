TRUE TRAIN V15.1.1

Cấu trúc chính:
- index.html: entry point và runtime của ứng dụng.
- manifest.webmanifest + sw.js: cấu hình PWA và hỗ trợ offline.
- assets/ + icons/: hình ảnh và icon tĩnh.
- supabase_setup.sql: schema Supabase cho tính năng cloud sync tùy chọn.

Deploy GitHub Pages / Netlify / hosting tĩnh:
1. Upload TOÀN BỘ nội dung của thư mục này, giữ nguyên cấu trúc thư mục.
2. Đặt index.html ở root website.
3. Mở bằng HTTPS để PWA/service worker hoạt động đầy đủ.

Chạy local (cần HTTP thay vì mở trực tiếp file):
1. Từ root repository, chạy: python3 -m http.server 8000
2. Mở http://localhost:8000/

Dữ liệu và cloud:
- Dữ liệu local được lưu với key gymTrackerV1.
- Supabase chỉ phục vụ cloud sync tùy chọn; chạy supabase_setup.sql trong project Supabase của môi trường cần cấu hình.
- Không đưa secret, access token hoặc dữ liệu người dùng vào source.

PWA/offline:
- Service worker cache app shell và các asset cùng origin sau khi chúng được tải.
- Lần cài đầu và cập nhật cache cần kết nối mạng.

Lưu ý Muscle Map 3D:
- Mô hình 3D vẫn tải Three.js và anatomy model từ CDN khi có internet.
- Nếu CDN không tải được, app dùng fallback UI hiện có; các chức năng còn lại vẫn dùng bình thường.

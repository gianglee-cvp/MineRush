# Mine Rush – web prototype (3D)

Màn hình dọc 1080×1920, dựng bằng Three.js (tải từ CDN, cần internet).
Hiện tại mới có **map / cảnh 3D** của màn `proto_01` ("Lớp đá chắn"). Logic chơi làm sau.

## Chạy
```
node serve.js
```
Mở http://localhost:5173

## Cấu trúc
- `js/level.js` – dữ liệu màn (lưới, hàng đợi mẻ, số ô sân ga).
- `js/models.js` – model 3D dựng bằng code (quặng, đá, ô "?", hầm, ray, xe goòng, lò, cửa mỏ, thợ mỏ, cây, núi).
- `js/main.js` – dựng cảnh, camera, ánh sáng, HUD, vòng lặp animation.
- `css/style.css` – HUD và thanh booster (HTML phủ lên canvas).
- `assets/manifest.js` – thay model bằng file `.glb` thật (để `null` thì dùng model dựng bằng code).
- `levels/proto_01.json` – bản màn đã được solver kiểm tra.

## Thay art thật
Điền đường dẫn `.glb` vào `assets/manifest.js`, ví dụ `ore_G: 'assets/models/gold.glb'`.
Model dựng theo tỉ lệ 1 đơn vị = 1 ô lưới, mặt trước hướng +Z (về phía camera), gốc ở tâm.

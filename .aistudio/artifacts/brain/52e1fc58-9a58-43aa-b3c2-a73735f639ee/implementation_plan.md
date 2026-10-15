# Kế Hoạch & Tổng Kết Thực Hiện: Hệ Thống Đạn Cố Định, Thời Gian Hồi Đạn & Chế Độ Chuyển Đổi Loại Đạn (Weapon Switch)

## 1. Yêu Cầu Của Người Dùng
1. **Thêm số lượng cố định và time hồi đạn**:
   - Thiết lập số lượng đạn tối đa cố định (magazine / inventory) cho từng loại đạn.
   - Thêm cơ chế hồi nạp đạn (reload / regeneration time) liên tục theo chu kỳ thời gian thực, có thanh đếm ngược và chỉ báo trực quan.
   - Khi hết đạn (0 viên), nòng pháo tạm dừng khai hỏa cho đến khi viên đạn tiếp theo được hồi nạp thành công.
2. **Có mode switch giữa các loại đạn**:
   - Cho phép người chơi tự do chuyển đổi qua lại giữa 8 loại đạn pháo chiến thuật:
     - `STANDARD`: Đạn Tiêu Chuẩn (15 viên • Hồi 0.8s/viên)
     - `EXPLOSIVE`: Đại Bác Nổ Lan (5 viên • Hồi 2.8s/viên)
     - `TRIPLE`: Pháo Chùm 3 Tia (6 viên • Hồi 2.2s/viên)
     - `PLASMA`: Laze Plasma Siêu Tốc (8 viên • Hồi 1.6s/viên)
     - `CRYO`: Băng Giá Làm Chậm (6 viên • Hồi 2.2s/viên)
     - `INCENDIARY`: Lửa Thiêu Đốt (6 viên • Hồi 2.2s/viên)
     - `RICOCHET`: Đạn Nảy Bật Tường (7 viên • Hồi 1.8s/viên)
     - `PIERCING`: Xuyên Giáp Bê Tông (5 viên • Hồi 2.8s/viên)
   - Đa dạng phương thức chuyển đổi:
     - Phím nóng bàn phím: `[1]` đến `[8]` để đổi ngay loại đạn tương ứng.
     - Phím `[Z]` (Lùi loại đạn trước) và `[X]` hoặc `[B]` (Đổi loại đạn kế tiếp xoay vòng).
     - Cuộn chuột (`Mouse Wheel Up / Down`) trên chiến trường để chuyển đổi nhanh.
     - Thanh điều khiển tương tác trực tiếp `BulletModeSelector` hiển thị 8 nút bấm chuyên dụng trên HUD.
     - Nút đổi đạn nhanh dạng ngón cái trên bộ điều khiển ảo di động (`VirtualJoystick`).

---

## 2. Kiến Trúc & Các Thành Phần Đã Triển Khai

### A. Cấu Hình & Kiểu Dữ Liệu (`src/types/game.ts`)
- Định nghĩa interface `AmmoConfig`, danh sách `AMMO_TYPES`, bảng thông số `AMMO_CONFIGS`:
  - `maxAmmo`: Số lượng đạn cố định.
  - `regenTimeSec`: Thời gian nạp hồi 1 viên đạn (giây).
  - `tag`, `description`, `icon`, `color`, `hotkey`.
- Bổ sung vào `PlayerTank`:
  - `selectedAmmo`: Loại đạn đang được trang bị.
  - `ammoInventory`: Số lượng đạn hiện tại của từng loại trong kho đạn (`Record<BulletModifier, number>`).
  - `ammoRegenTimers`: Bộ đếm thời gian tích lũy hồi nạp của từng loại đạn.
- Bổ sung vào `ClientMessage`:
  - `selectedAmmo?: BulletModifier` trong payload `INPUT`.
  - Message loại `{ type: 'SWITCH_AMMO'; ammoType: BulletModifier }`.
- Các helper `createDefaultAmmoInventory()`, `createDefaultAmmoRegenTimers()`.

### B. Game Engine Authoritative Trên Server (`server/gameEngine.ts` & `server.ts`)
- **Khởi tạo & Hồi sinh**: Thiết lập đầy đủ kho đạn cố định theo từng loại đạn chuẩn khi người chơi vào phòng hoặc hồi sinh (`respawnPlayer`).
- **Vòng lặp nạp đạn thời gian thực (`update(deltaTime)`)**:
  - Tự động nạp hồi đạn liên tục theo chu kỳ `regenTimeSec * cdMult`.
  - Tích hợp giảm thời gian nạp hồi theo cấp độ xe tăng và perk đặc quyền `RAPID_RELOAD` (-20% thời gian nạp).
- **Quy tắc bắn pháo (`fireBullet`)**:
  - Kiểm tra số lượng đạn của loại đang chọn `selectedAmmo`. Nếu số đạn `<= 0`, chặn bắn.
  - Khai hỏa thành công thì trừ chính xác 1 viên đạn khỏi kho đạn của loại đó.
- **Xử lý chuyển đổi loại đạn (`switchAmmo`)**:
  - Hỗ trợ đổi ngay tức thì khi nhận gói tin `SWITCH_AMMO` hoặc `INPUT.selectedAmmo`.
- **Bot AI Thông Minh (`updateBots`)**:
  - Bot AI tự động kiểm tra lượng đạn của mình; nếu hết đạn hiện tại sẽ đổi sang loại đạn còn viên.
  - Bot biết linh hoạt đổi sang đạn Plasma khi ở cự ly xa, đạn Nổ/Chùm khi ở cự ly gần hoặc khi săn Boss Leviathan.

### C. Giao Diện Người Dùng & HUD (`src/components/BulletModeSelector.tsx`)
- Thẻ đạn hiện tại:
  - Tên tiếng Việt, biểu tượng, thẻ phân loại, màu sắc đặc trưng.
  - Bộ đếm đạn số thực: `X / Max` (ví dụ `12 / 15`).
  - Hàng đạn trực quan (bullet pips) phát sáng theo màu đạn.
  - Thanh đếm ngược thời gian nạp hồi: `⏱️ Hồi +1 viên: X.Xs` hoặc cảnh báo `⚠️ HẾT ĐẠN! ĐANG NẠP LẠI (X.Xs)`.
- Dock 8 ô chuyển đạn:
  - Hiển thị phím tắt `[1]` đến `[8]`.
  - Số lượng đạn còn lại của từng loại `X/Y`.
  - Thanh tiến trình hồi đạn mini bên dưới từng nút.
  - Hiệu ứng viền phát sáng (Glow border) cho loại đạn đang kích hoạt.
  - Hai nút mũi tên chuyển nhanh `[◄] Z` và `X [►]`.

### D. Điều Khiển Bàn Phím, Chuột & Mobile (`src/App.tsx` & `VirtualJoystick.tsx`)
- Tích hợp các phím `1`-`8`, `Z`, `X`, `B` và cuộn chuột (`onWheel`).
- Nút chuyển đạn nhanh trên bộ điều khiển ảo di động (`VirtualJoystick`) cạnh nút BẮN.
- Tích hợp âm thanh nạp đạn và phản hồi xúc giác rung (Haptics) khi đổi loại đạn.

### E. Vẽ Đạn Trên Game Canvas (`src/components/GameCanvas.tsx`)
- Vẽ hàng vạch đạn mini (ammo dashes) phía dưới thanh máu HP và thanh EXP của xe tăng.
- Khi hết đạn, hiển thị chữ nhấp nháy `⚡ NẠP ĐẠN...` giúp người chơi nhận biết ngay lập tức trong giao tranh.

---

## 3. Kết Quả Kiểm Thử
- **TypeScript & Linting**: `npm run lint` (`tsc --noEmit`) hoàn thành với 0 lỗi.
- **Build Server & Client**: `compile_applet` biên dịch thành công.
- **Server Reload**: Khởi động lại dev server thành công, áp dụng đồng bộ cả backend socket và frontend giao diện.

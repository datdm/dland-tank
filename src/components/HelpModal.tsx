import React, { useState } from 'react';
import {
  X,
  Keyboard,
  Shield,
  Zap,
  Crosshair,
  Package,
  Flame,
  Snowflake,
  Sparkles,
  Layers,
  HelpCircle,
  Video,
  Eye,
  Check,
  Disc,
} from 'lucide-react';
import { TankVisual } from './TankVisual';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'controls' | 'skills' | 'tanks' | 'items' | 'ammo';
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'controls',
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'skills' | 'tanks' | 'items' | 'ammo'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-2xl w-full p-4 sm:p-6 text-white shadow-2xl my-auto space-y-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white font-mono">
                CẨM NANG & HƯỚNG DẪN DLAND TANK
              </h3>
              <p className="text-[11px] text-slate-400">
                Thông tin kỹ năng chiến đấu, phím tắt, 3 lớp xe tăng, linh kiện tiếp tế và 8 loại đạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng cửa sổ (Escape)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'controls'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Phím Tắt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'skills'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>4 Kỹ Năng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tanks')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tanks'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3 Lớp Xe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'items'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Linh Kiện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ammo')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ammo'
                ? 'bg-rose-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>8 Loại Đạn</span>
          </button>
        </div>

        {/* Tab Contents (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs text-slate-300">
          {/* TAB 1: CONTROLS & HOTKEYS */}
          {activeTab === 'controls' && (
            <div className="space-y-3">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm text-sky-400 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-sky-400" />
                  Điều Khiển Lái Xe & Bắn Pháo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="font-mono font-bold text-sky-300">W, S, A, D / Mũi tên</span>
                    <p className="text-slate-400 mt-0.5">Di chuyển 8 hướng linh hoạt, tự động trượt mượt khi cọ xát tường.</p>
                  </div>
                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="font-mono font-bold text-emerald-300">Phím C (Chế độ ngắm bắn)</span>
                    <p className="text-slate-400 mt-0.5">Chuyển đổi tức thì: <strong>Theo hướng di chuyển (Tank 1990)</strong> hoặc <strong>Theo chuột 360°</strong>.</p>
                  </div>
                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="font-mono font-bold text-sky-300">Space / Phím J / Chuột Trái</span>
                    <p className="text-slate-400 mt-0.5">Khai hỏa nòng pháo liên tục theo tốc độ nạp của xe. Thuần bàn phím!</p>
                  </div>
                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="font-mono font-bold text-sky-300">Enter / Esc</span>
                    <p className="text-slate-400 mt-0.5">Bật khung Chat để gửi tin nhắn / Đóng khung chat.</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Phím Tắt Tiện Ích Trong Trận Đấu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Đổi bản đồ (Map Nhỏ / To / Ẩn):</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-bold">Phím M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Ẩn / Hiện Thanh Status xe:</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-bold">Phím H</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Ẩn / Hiện Thanh Header công cụ:</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-bold">Phím U</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Bảng Xếp Hạng chi tiết:</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-bold">Phím TAB</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Đổi Tỉ Lệ Thu Phóng (Zoom):</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-bold">- / + / 0</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-slate-300">Chế độ Khán Giả (Đổi mục tiêu):</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-sky-300 rounded font-mono font-bold">Phím Q / E</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: 4 TACTICAL SKILLS */}
          {activeTab === 'skills' && (
            <div className="space-y-3">
              {/* Skill 1: Boost */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-sky-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white">Tăng Tốc Động Cơ (Nitro Turbo Boost)</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-mono font-bold">
                        [Shift]
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 font-bold">Hồi: 10s | Kéo dài: 3.5s</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kích hoạt luồng phản lực Nitro cực mạnh ở đuôi xe, tăng vọt <strong>+85% tốc độ di chuyển và khả năng drift</strong> xoay trở để thoát khỏi vùng phục kích hoặc rượt đuổi kẻ thù.
                </p>
              </div>

              {/* Skill 2: Force Shield */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-cyan-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white">Khiên Từ Trường Bảo Vệ (Force Shield)</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        [Q] hoặc [F]
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">Hồi: 12s | Kéo dài: 3.5s</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Tạo một vòm từ trường lượng tử 360° phát sáng quanh xe trong 3.5 giây, <strong>hấp thụ 100% sát thương từ mọi loại đạn pháo</strong> bắn trúng xe.
                </p>
              </div>

              {/* Skill 3: Plasma Mine */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Disc className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white">Mìn Bẫy Cảm Ứng (Plasma Landmine)</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                        [E] hoặc [F]
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">Hồi: 10s | Tồn tại: 30s</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Gài 1 quả mìn nổ điện từ tại vị trí xe đang đứng. Khi kẻ địch chạm phải sẽ phát nổ gây <strong>70 sát thương diện rộng và làm chậm 50% tốc độ trong 2.5s</strong>.
                </p>
              </div>

              {/* Skill 4: Hyper Barrage */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-rose-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-white">Pháo Cao Tốc Liên Hoàn (Hyper Barrage)</span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono font-bold">
                        [R]
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-rose-400 font-bold">Hồi: 15s | Kéo dài: 4.0s</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Quá tải hệ thống nạp đạn của tháp pháo: <strong>Tốc độ xả đạn tăng gấp đôi (2x Fire Rate)</strong>, đạn bay nhanh hơn và tầm bắn xa hơn trong 4 giây.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TANK CLASSES */}
          {activeTab === 'tanks' && (
            <div className="space-y-3">
              {/* STRIKER */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-sky-500/30 flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0 flex items-center justify-center p-2 bg-slate-900 rounded-xl border border-slate-800 w-24 h-24">
                  <TankVisual tankClass="STRIKER" color="#2563eb" size={72} animated turretAngle={-15} />
                </div>
                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Chiến Binh (Striker)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-mono font-bold">CÂN BẰNG</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">Hỏa lực 105mm</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Khung gầm hợp kim tiêu chuẩn cân bằng hoàn hảo giữa khả năng cơ động, lượng máu và hỏa lực pháo. Phù hợp cho mọi phong cách chiến thuật.
                  </p>
                  <div className="flex items-center gap-4 pt-1 font-mono text-[11px]">
                    <span className="text-emerald-400">Máu: <strong>100 HP</strong></span>
                    <span className="text-amber-400">Tốc độ: <strong>92 km/h</strong></span>
                    <span className="text-rose-400">Sát thương: <strong>25 DMG</strong></span>
                  </div>
                </div>
              </div>

              {/* SCOUT */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0 flex items-center justify-center p-2 bg-slate-900 rounded-xl border border-slate-800 w-24 h-24">
                  <TankVisual tankClass="SCOUT" color="#16a34a" size={72} animated turretAngle={-15} />
                </div>
                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Trinh Sát (Scout)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">TỐC ĐỘ CAO</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">Nạp đạn 210ms</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Thiết kế khí động học mũi tên vuốt nhọn, xích nhẹ tốc độ cao và pháo bắn tỉa nạp cực nhanh. Tuyệt vời cho lối chơi Hit & Run du kích nhanh nhẹn.
                  </p>
                  <div className="flex items-center gap-4 pt-1 font-mono text-[11px]">
                    <span className="text-emerald-400">Máu: <strong>80 HP</strong></span>
                    <span className="text-amber-400">Tốc độ: <strong>120 km/h</strong></span>
                    <span className="text-rose-400">Sát thương: <strong>18 DMG</strong></span>
                  </div>
                </div>
              </div>

              {/* JUGGERNAUT */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0 flex items-center justify-center p-2 bg-slate-900 rounded-xl border border-slate-800 w-24 h-24">
                  <TankVisual tankClass="JUGGERNAUT" color="#d97706" size={72} animated turretAngle={-15} />
                </div>
                <div className="flex-1 space-y-1 text-left w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">Thiết Giáp (Juggernaut)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">GIÁP & MÁU</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">Pháo đôi 155mm</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Pháo đài bọc thép siêu kiên cố, xích đôi hạng nặng và pháo đôi công thành uy lực hủy diệt. Dù di chuyển chậm nhưng lượng máu khủng và sát thương cực cao.
                  </p>
                  <div className="flex items-center gap-4 pt-1 font-mono text-[11px]">
                    <span className="text-emerald-400">Máu: <strong>150 HP</strong></span>
                    <span className="text-amber-400">Tốc độ: <strong>72 km/h</strong></span>
                    <span className="text-rose-400">Sát thương: <strong>45 DMG</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ITEMS & POWER-UP CRATES */}
          {activeTab === 'items' && (
            <div className="space-y-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Quy tắc Linh Kiện Tiếp Tế</strong>: Mọi hộp nhặt được trên chiến trường đều cộng thêm <strong>+35% Tốc độ di chuyển</strong>, riêng Nitro Turbo tăng vọt <strong>+85% tốc độ</strong>!
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* REPAIR */}
                <div className="bg-slate-950/85 p-3 rounded-xl border border-emerald-500/40 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span className="text-base">✚</span>
                    <span>HỘP CỨU THƯƠNG (+50 HP)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Hồi phục ngay lập tức <strong>+50 Máu HP</strong> cho xe tăng + Tăng tốc chạy +35% trong 10 giây.
                  </p>
                </div>

                {/* SHIELD */}
                <div className="bg-slate-950/85 p-3 rounded-xl border border-sky-500/40 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <span className="text-base">🛡️</span>
                    <span>LÁ CHẮN NĂNG LƯỢNG (100 GIÁP)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Tạo lớp khiên bảo vệ hấp thụ toàn bộ <strong>100 Sát thương</strong> trước khi trừ vào máu thật + Tăng tốc +35%.
                  </p>
                </div>

                {/* NITRO TURBO */}
                <div className="bg-slate-950/85 p-3 rounded-xl border border-amber-500/40 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <span className="text-base">⚡</span>
                    <span>NITRO TURBO (+85% TỐC ĐỘ)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Kích hoạt luồng phản lực Nitro siêu tốc, tăng vọt <strong>+85% tốc độ chạy</strong> trong 8 giây (lên đến ~180-220 km/h)!
                  </p>
                </div>

                {/* TRIPLE SHOT */}
                <div className="bg-slate-950/85 p-3 rounded-xl border border-purple-500/40 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <span className="text-base">🔱</span>
                    <span>ĐẠN 3 TIA (TRIPLE SHOT)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Mỗi phát bắn tỏa ra <strong>3 luồng đạn pháo</strong> diện rộng theo hình cánh quạt, áp chế đối thủ từ xa.
                  </p>
                </div>

                {/* RAPID FIRE */}
                <div className="bg-slate-950/85 p-3 rounded-xl border border-rose-500/40 space-y-1 text-left sm:col-span-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <span className="text-base">🔥</span>
                    <span>NẠP ĐẠN THẦN TỐC (RAPID FIRE)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Giảm <strong>50% thời gian nạp đạn</strong>, cho phép xả đạn liên tục như súng máy tự động + Tăng tốc +35% trong 10 giây.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AMMO TYPES */}
          {activeTab === 'ammo' && (
            <div className="space-y-2">
              <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-[11px] text-slate-300">
                💡 <strong>Cơ chế Đạn Ngẫu Nhiên</strong>: Mỗi phát bắn xe tăng của bạn sẽ nạp ngẫu nhiên 1 trong 8 loại đạn chiến thuật độc đáo sau:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-orange-500/30">
                  <div className="font-bold text-orange-400 flex items-center gap-1.5">
                    <span>💥 Đại Bác Nổ Lan (Explosive)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Tạo vùng nổ bán kính 80px khi va chạm, gây sát thương lan ra xung quanh.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-purple-500/30">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <span>🔱 Chùm 3 Tia (Triple Spread)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Bắn 3 viên đạn tỏa quạt góc hẹp tăng khả năng trúng mục tiêu di động.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-cyan-500/30">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <span>⚡ Laze Plasma (High Velocity)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Tia plasma siêu thanh bay nhanh gấp 1.7 lần, không thể né tránh ở cự ly gần.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-blue-500/30">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5">
                    <span>❄️ Đạn Băng Làm Chậm (Cryo Frost)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Làm đông cứng động cơ đối thủ, giảm 45% tốc độ di chuyển trong 3.5 giây.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-red-500/30">
                  <div className="font-bold text-red-400 flex items-center gap-1.5">
                    <span>🔥 Đạn Lửa Thiêu Đốt (Incendiary)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Thiêu đốt đối thủ gây thêm sát thương liên tục 5 lần theo thời gian.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-emerald-500/30">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>🔄 Đạn Nảy Tường (Ricochet)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Bật nảy tối đa 2 lần qua các khối thép và gạch, bắn lén qua góc tường.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-yellow-500/30">
                  <div className="font-bold text-yellow-400 flex items-center gap-1.5">
                    <span>🎯 Đạn Xuyên Giáp (Armor Piercing)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Bỏ qua 50% lớp khiên giáp năng lượng để trừ trực tiếp vào máu thân xe.</p>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-700">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🎯 Đạn Tiêu Chuẩn (Standard)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Đạn pháo ổn định, đường đạn thẳng và độ chính xác hoàn hảo.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="pt-2 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
          >
            ĐÃ HIỂU & QUAY LẠI
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  X,
  Sliders,
  Music,
  Zap,
  Radio,
  Target,
  Palette,
  HelpCircle,
  LogOut,
  Volume2,
  VolumeX,
  Shield,
  Eye,
  Swords,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface InGameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  aimMode: 'MOVEMENT' | 'MOUSE';
  onToggleAimMode: () => void;
  onOpenGarage: () => void;
  onOpenHelp: () => void;
  onExitGame: () => void;
  isSpectator: boolean;
  onToggleSpectator: () => void;
  isShortLandscape?: boolean;
}

export const InGameSettingsModal: React.FC<InGameSettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  aimMode,
  onToggleAimMode,
  onOpenGarage,
  onOpenHelp,
  onExitGame,
  isSpectator,
  onToggleSpectator,
  isShortLandscape = false,
}) => {
  const [musicVol, setMusicVol] = React.useState(Math.round(sounds.getMusicVolume() * 100));
  const [sfxVol, setSfxVol] = React.useState(Math.round(sounds.getSfxVolume() * 100));
  const [voiceEnabled, setVoiceEnabled] = React.useState(sounds.getVoiceEnabled());
  const [isMusicPlaying, setIsMusicPlaying] = React.useState(sounds.getIsMusicPlaying());

  React.useEffect(() => {
    if (isOpen) {
      setMusicVol(Math.round(sounds.getMusicVolume() * 100));
      setSfxVol(Math.round(sounds.getSfxVolume() * 100));
      setVoiceEnabled(sounds.getVoiceEnabled());
      setIsMusicPlaying(sounds.getIsMusicPlaying());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 select-none">
      <div
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md max-h-[82vh] sm:max-h-[85vh] flex flex-col my-auto overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800 p-3 sm:p-4 bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-white font-mono text-xs sm:text-sm md:text-base">CÀI ĐẶT TRẬN ĐẤU</h3>
              {!isShortLandscape && (
                <p className="text-[10px] sm:text-[11px] text-slate-400">Tùy chỉnh âm thanh, điều khiển & tiện ích chiến trường</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
            title="Đóng (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 custom-scrollbar">
          {/* 1. Âm thanh BGM Slider */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>Nhạc Nền (BGM)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const isPlaying = sounds.toggleMusic();
                  setIsMusicPlaying(isPlaying);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer active:scale-95 ${
                  isMusicPlaying
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isMusicPlaying ? 'Phát 🔊' : 'Tắt 🔇'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVol}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMusicVol(val);
                sounds.setMusicVolume(val / 100);
              }}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded"
            />
          </div>

          {/* 2. Hiệu ứng Bắn SFX */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Hiệu Ứng Âm Thanh (SFX)</span>
              </span>
              <span className="font-mono text-sky-300 text-[10px] sm:text-xs font-bold">{sfxVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSfxVol(val);
                sounds.setSfxVolume(val / 100);
              }}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-950 rounded"
            />
          </div>

          {/* 3. Giọng Phát Thanh Viên */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <div className="font-bold text-white text-[11px] sm:text-xs">Giọng Phát Thanh Viên</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400">Đọc chuỗi hạ gục, thời tiết, boss</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                sounds.setVoiceEnabled(next);
                if (next) sounds.announce('Tactical Announcer Activated', 'Đã kích hoạt giọng phát thanh viên chiến trường!');
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors cursor-pointer active:scale-95 ${
                voiceEnabled
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {voiceEnabled ? 'BẬT' : 'TẮT'}
            </button>
          </div>

          {/* 4. Chế Độ Ngắm Bắn */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 sm:p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-[11px] sm:text-xs">Chế Độ Ngắm Bắn</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400">
                  {aimMode === 'MOVEMENT' ? 'Bắn theo hướng xe (Tank 1990)' : 'Bắn tự do theo chuột 360°'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleAimMode}
              className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                aimMode === 'MOVEMENT'
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-sky-600/30 text-sky-300 border-sky-500/50'
              }`}
            >
              {aimMode === 'MOVEMENT' ? '🎯 Hướng Xe' : '🖱️ Chuột 360°'}
            </button>
          </div>

          {/* 5. Khán Giả / Tham Chiến & Gara & Hướng Dẫn Quick Buttons */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGarage();
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-fuchsia-500/40 text-fuchsia-300 p-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Gara & Skin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-sky-500/40 text-sky-300 p-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Hướng Dẫn</span>
            </button>
          </div>
        </div>

        {/* Sticky Footer Actions: Tiếp Tục & Rời Trận */}
        <div className="shrink-0 flex items-center gap-2 p-3 sm:p-4 border-t border-slate-800 bg-slate-900/95">
          <button
            type="button"
            onClick={onExitGame}
            className="flex-1 flex items-center justify-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 p-2 sm:p-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>RỜI TRẬN ĐẤU</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black p-2 sm:p-2.5 rounded-xl text-[11px] sm:text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <span>TIẾP TỤC ĐẤU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

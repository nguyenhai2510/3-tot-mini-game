import './App.css'
import { useState, useEffect, useRef, useCallback } from 'react';

import ScratchCard from 'react-scratchcard-v2';
import artboard1 from './assets/images/Artboard2.png';
import artboard2 from './assets/images/Artboard3.png';
import artboard3 from './assets/images/Artboard1.png';
import logo from './assets/images/3tot.png';
import phuCao from './assets/images/phu_cao.jpg';
import background from './assets/images/background.png';
import { useMutation } from '@tanstack/react-query';
import apis, { BaseUrlImage } from './apis/api';
import type { Play, Spin } from './types/type';

const images = {
  artboard1,
  artboard2,
  artboard3,
  logo,
  phuCao,
  background,
};


const Modal: React.FC<{ open: boolean; onClose: () => void, gift: string, handleModalOpenGift: (status: boolean) => void }> = ({ open, onClose, gift, handleModalOpenGift }) => {
  // responsive width for ScratchCard (number required by the component)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cardWidth, setCardWidth] = useState<number>(400);
  const vwDebounceRef = useRef<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // current scratch image ratio in your code: 400 x 226 -> ratio = 226/400
  const aspectRatio = 226 / 400;
  const confettiCount = 14;

  // === Scratch sound refs ===
  const scratchAudioCtxRef = useRef<AudioContext | null>(null);
  const scratchNoiseBufRef = useRef<AudioBuffer | null>(null);
  const scratchSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const scratchGainRef = useRef<GainNode | null>(null);
  const scratchFilterRef = useRef<BiquadFilterNode | null>(null);
  const lastPtRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const ensureScratchAudio = useCallback(() => {
    if (!scratchAudioCtxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scratchAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = scratchAudioCtxRef.current!;
    if (!scratchNoiseBufRef.current) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate); // 1s loop
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      scratchNoiseBufRef.current = buf;
    }
  }, []);

  const startScratchSound = useCallback((x: number, y: number) => {
    ensureScratchAudio();
    const ctx = scratchAudioCtxRef.current!;
    const src = ctx.createBufferSource();
    src.buffer = scratchNoiseBufRef.current!;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800; // sẽ modulate theo tốc độ tay
    filter.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();

    // fade in nhanh để tránh "pop"
    const now = ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);

    scratchSrcRef.current = src;
    scratchGainRef.current = gain;
    scratchFilterRef.current = filter;
    lastPtRef.current = { x, y, t: performance.now() };
  }, [ensureScratchAudio]);

  const updateScratchSound = useCallback((x: number, y: number) => {
    const ctx = scratchAudioCtxRef.current;
    const filter = scratchFilterRef.current;
    const gain = scratchGainRef.current;
    if (!ctx || !filter || !gain) return;

    const nowMs = performance.now();
    const last = lastPtRef.current;
    if (last) {
      const dx = x - last.x;
      const dy = y - last.y;
      const dt = Math.max(1, nowMs - last.t); // ms
      const speed = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms

      // map speed -> freq (300..2000 Hz) và gain (0.06..0.18)
      const freq = 300 + Math.min(1, speed * 6) * 1700;
      const targetGain = 0.06 + Math.min(0.12, speed * 0.5);

      filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
      gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.03);
    }
    lastPtRef.current = { x, y, t: nowMs };
  }, []);

  const stopScratchSound = useCallback(() => {
    const ctx = scratchAudioCtxRef.current;
    const src = scratchSrcRef.current;
    const gain = scratchGainRef.current;
    if (ctx && src && gain) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.05);
      try { src.stop(now + 0.12); } catch { /* noop */ }
    }
    scratchSrcRef.current = null;
    scratchGainRef.current = null;
    scratchFilterRef.current = null;
    lastPtRef.current = null;
  }, []);

  // attach scratch sound listeners to the container (sự kiện sẽ bubble từ canvas lên)
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;

    const getXY = (e: MouseEvent | TouchEvent) => {
      const rect = el.getBoundingClientRect();
      if ('touches' in e && e.touches.length) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((e as any).clientX != null) {
        const me = e as MouseEvent;
        return { x: me.clientX - rect.left, y: me.clientY - rect.top };
      }
      return { x: 0, y: 0 };
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getXY(e);
      startScratchSound(x, y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getXY(e);
      updateScratchSound(x, y);
    };
    const onUp = () => stopScratchSound();

    el.addEventListener('mousedown', onDown, { passive: true });
    el.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp, { passive: true });
    window.addEventListener('touchcancel', onUp, { passive: true });

    return () => {
      el.removeEventListener('mousedown', onDown as EventListener);
      el.removeEventListener('mousemove', onMove as EventListener);
      window.removeEventListener('mouseup', onUp as EventListener);
      el.removeEventListener('touchstart', onDown as EventListener);
      el.removeEventListener('touchmove', onMove as EventListener);
      window.removeEventListener('touchend', onUp as EventListener);
      window.removeEventListener('touchcancel', onUp as EventListener);
      stopScratchSound();
    };
  }, [open, startScratchSound, updateScratchSound, stopScratchSound]);

  useEffect(() => {
    // compute a reliable viewport width on iOS Safari (visualViewport preferred)
    const getViewportWidth = () => {
      // visualViewport gives correct layout viewport width on iOS when UI chrome present
      // fall back to documentElement/clientWidth / window.innerWidth
      return window.visualViewport?.width ?? document.documentElement.clientWidth ?? window.innerWidth;
    };

    const update = () => {
      const vw = getViewportWidth();
      const vw70 = Math.round(vw * 0.7);
      // optional clamp (min 200, max 500) — adjust or remove as needed
      const w = Math.round(Math.max(200, Math.min(vw70, 500)));
      setCardWidth(w);
    };

    // small debounce to avoid layout thrash while scratching
    const debounced = () => {
      if (vwDebounceRef.current) window.clearTimeout(vwDebounceRef.current);
      vwDebounceRef.current = window.setTimeout(() => {
        update();
        vwDebounceRef.current = null;
      }, 80);
    };

    // initial
    update();

    // listeners: resize, orientationchange and visualViewport resize (iOS)
    window.addEventListener('resize', debounced);
    window.addEventListener('orientationchange', debounced);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', debounced);
      window.visualViewport.addEventListener('scroll', debounced);
    }

    // keep ResizeObserver on container for cases when parent changes size
    let ro: ResizeObserver | null = null;
    if (containerRef.current) {
      ro = new ResizeObserver(debounced);
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', debounced);
      window.removeEventListener('orientationchange', debounced);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debounced);
        window.visualViewport.removeEventListener('scroll', debounced);
      }
      if (ro) ro.disconnect();
      if (vwDebounceRef.current) {
        window.clearTimeout(vwDebounceRef.current);
        vwDebounceRef.current = null;
      }
    };
  }, [containerRef]);

  // prevent background scroll when modal open (avoid page jump / shake)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (open) {
      document.body.style.overflow = 'hidden';
      setRevealed(false); // reset reveal each time modal opens
    } else {
      document.body.style.overflow = prevOverflow;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500/45 bg-opacity-100"
          onClick={onClose}>
          <div className="bg-white p-4 rounded-lg relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%"
            }}>
            <div className="absolute top-2 right-2 z-10 size-9"
              onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path fill="#0da64b" d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C221.6 240.4 221.6 255.6 231 264.9L286 319.9L231 374.9C221.6 384.3 221.6 399.5 231 408.8C240.4 418.1 255.6 418.2 264.9 408.8L319.9 353.8L374.9 408.8C384.3 418.2 399.5 418.2 408.8 408.8C418.1 399.4 418.2 384.2 408.8 374.9L353.8 319.9L408.8 264.9C418.2 255.5 418.2 240.3 408.8 231C399.4 221.7 384.2 221.6 374.9 231L319.9 286L264.9 231C255.5 221.6 240.3 221.6 231 231z" /></svg>
            </div>
            <div className="flex items-center justify-center mb-4 ">
              <img src={images.logo} alt="Scratch Card" className='rounded-full h-10' />
            </div>
            <div className="text-lg font-bold mb-2 t"
              style={{
                width: "90%",
                color: "#0DA64B"
              }}>Cào mã để xem quà</div>

            <div
              ref={containerRef}
              // disable browser touch handling on scratch area so canvas receives clean touch events
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                touchAction: 'none',           // important to prevent scrolling gestures
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
            >
              <ScratchCard
                width={cardWidth} // numeric, responsive based on parent width
                height={Math.round(cardWidth * aspectRatio)} // keep original ratio
                image={images.phuCao}
                finishPercent={50}
                onComplete={() => {
                  // reveal prize + play confetti
                  setRevealed(true);
                  setShowConfetti(true);
                  // stop confetti after 2.8s
                  handleModalOpenGift(true);
                  setTimeout(() => setShowConfetti(false), 2800);
                }}
                brushSize={100}
                customBrush={{
                  image: images.phuCao,
                  width: 15,
                  height: 15
                }}
              >
                <div
                  className={`prize-inner ${revealed ? 'revealed' : ''}`}
                  style={{
                    color: '#0DA64B',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    width: '100%',
                    fontSize: '1.5rem',
                  }}
                >
                  {/* prize content */}
                  <div className="prize-card">
                    <img src={gift} alt="prize" className="prize-image" />
                  </div>
                </div>
              </ScratchCard>

              {/* confetti (rendered on reveal) */}
              {showConfetti && (
                <div className="confetti-wrap" aria-hidden>
                  {Array.from({ length: confettiCount }).map((_, i) => {
                    const left = Math.random() * 100;
                    const delay = (Math.random() * 0.8).toFixed(2);
                    const bg = ['#FF5A5F', '#FFB400', '#7BD389', '#4D8CFF'][i % 4];
                    return <span key={i} className="confetti" style={{ left: `${left}%`, background: bg, animationDelay: `${delay}s` }} />;
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const ModalGitSuccess: React.FC<{ open: boolean; onClose: () => void, gift: string }> = ({ open, onClose, gift }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopAtRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // play simple firework SFX using WebAudio (không cần file mp3)
  const playFireworkSfx = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // white noise "pop"
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const nGain = ctx.createGain();
      nGain.gain.value = 0.35;
      nGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      noise.connect(nGain).connect(ctx.destination);
      noise.start();

      // whoosh (sawtooth sweep)
      const osc = ctx.createOscillator();
      const oGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.35);
      oGain.gain.value = 0.12;
      oGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(oGain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!open) return;

    // iOS detect + reduced motion
    const isIOS =
      /iP(hone|od|ad)/.test(navigator.platform) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion) {
      // Người dùng yêu cầu giảm chuyển động -> không chạy pháo hoa
      return;
    }

    // fireworks canvas
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    // Giới hạn DPR để giảm tải GPU ở iPhone
    const MAX_DPR = isIOS ? 1.5 : 2;
    const dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));

    const size = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const onResize = () => size();
    window.addEventListener('resize', onResize);

    type Particle = { x: number; y: number; vx: number; vy: number; alpha: number; color: string; life: number; };
    type Rocket = { x: number; y: number; vx: number; vy: number; exploded: boolean; color: string; };
    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    const colors = ['#FF5A5F', '#FFB400', '#7BD389', '#4D8CFF', '#FF6B6B', '#F72585'];

    // Giảm mật độ trên iOS để mượt hơn
    const spawnProb = isIOS ? 0.08 : 0.12;
    const particleMin = isIOS ? 24 : 40;
    const particleRand = isIOS ? 18 : 30;

    const launchRocket = () => {
      const w = window.innerWidth;
      const x = Math.random() * w * 0.8 + w * 0.1;
      rockets.push({
        x, y: window.innerHeight + 10,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(6 + Math.random() * 2.5),
        exploded: false,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    };

    // launch for 10s
    stopAtRef.current = performance.now() + 10000;

    const explode = (rx: Rocket) => {
      const count = particleMin + Math.floor(Math.random() * particleRand);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = 2 + Math.random() * 3.5;
        particles.push({
          x: rx.x, y: rx.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: rx.color,
          life: 60 + Math.floor(Math.random() * 40),
        });
      }
      playFireworkSfx();
    };

    const step = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // launch cadence
      if (now < stopAtRef.current && Math.random() < spawnProb) launchRocket();

      // update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.06; // gravity
        // explode when apex reached or high enough
        if (!r.exploded && (r.vy > -0.5 || r.y < window.innerHeight * 0.35)) {
          r.exploded = true;
          explode(r);
          rockets.splice(i, 1);
          continue;
        }
        // draw rocket
        ctx.beginPath();
        ctx.fillStyle = r.color;
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985; // air drag
        p.vy = p.vy * 0.985 + 0.03; // gravity
        p.alpha *= 0.985;
        p.life -= 1;

        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.globalAlpha = 1;

        if (p.life <= 0 || p.alpha < 0.02) {
          particles.splice(i, 1);
        }
      }

      rafRef.current = requestAnimationFrame(step);

      // stop loop khi đã quá 10s và không còn hạt/rocket
      if (now > stopAtRef.current && rockets.length === 0 && particles.length === 0) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        return;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    // Tạm dừng khi tab/ứng dụng bị ẩn để tiết kiệm pin/CPU
    const onVis = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    playFireworkSfx();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [open, playFireworkSfx]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 h-screen w-screen">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${images.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Fireworks layer */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      />
      {/* Content */}
      <div className="relative flex items-center justify-center h-full">
        <img src={gift} alt="Gift" className="w-full h-full object-contain modal-pop" />
        <div className="absolute bottom-5 w-full flex justify-center">
          <div
            onClick={onClose}
            className="bg-white text-black px-4 py-2 rounded w-3/4 text-center font-semibold modal-pop"
            style={{ color: "#0DA64B" }}
          >
            Đã nhận
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert modal đơn giản
type AlertModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

const AlertModal: React.FC<AlertModalProps> = ({ open, onClose, title = 'Thông báo', message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[88%] max-w-sm rounded-lg bg-white shadow-lg modal-pop">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-[#0DA64B] font-semibold">{title}</h3>
          <div aria-label="Đóng" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="w-5 h-5">
              <path fill="#0da64b" d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM231 231C221.6 240.4 221.6 255.6 231 264.9L286 319.9L231 374.9C221.6 384.3 221.6 399.5 231 408.8C240.4 418.1 255.6 418.2 264.9 408.8L319.9 353.8L374.9 408.8C384.3 418.2 399.5 418.2 408.8 408.8C418.1 399.4 418.2 384.2 408.8 374.9L353.8 319.9L408.8 264.9C418.2 255.5 418.2 240.3 408.8 231C399.4 221.7 384.2 221.6 374.9 231L319.9 286L264.9 231z" />
            </svg>
          </div>
        </div>
        <div className="px-4 py-4 text-gray-700">{message}</div>
        <div className="px-4 pb-4">
          <div onClick={onClose} className="w-full bg-[#0DA64B] text-white rounded-md py-2 font-semibold text-center">
            Đóng
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenGift, setIsModalOpenGift] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const slides = [images.artboard1, images.artboard2, images.artboard3];
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDelta = useRef(0);
  const [phone, setPhone] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [errPhone, setErrPhone] = useState("");
  const [alert, setAlert] = useState<{ open: boolean; title?: string; message?: string }>({ open: false });

  const handleModalOpenGift = (status: boolean) => {
    setIsModalOpenGift(status);
  };

  const showAlert = useCallback((message: string, title?: string) => setAlert({ open: true, message, title }), []);
  const closeAlert = useCallback(() => setAlert((p) => ({ ...p, open: false })), []);

  const goTo = useCallback((i: number) => {
    setIndex(() => (i + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Auto play every 3s
  useEffect(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 3000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  // Pause autoplay while user interacts (touch / mouse enter)
  const pause = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const resume = () => {
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, 3000);
    }
  };

  // Touch handlers for swipe
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    pause();
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current != null) {
      touchDelta.current = e.touches[0].clientX - touchStartX.current;
      // nếu người dùng đang vuốt ngang, ngăn browser scroll dọc
      if (Math.abs(touchDelta.current) > 5) {
        e.preventDefault();
      }
    }
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (touchStartX.current != null) {
      if (touchDelta.current > 50) {
        prev();
      } else if (touchDelta.current < -50) {
        next();
      }

    }
    touchStartX.current = null;
    touchDelta.current = 0;
    resume();
  };

  // Mouse pause on hover (desktop)
  const onMouseEnter = pause;
  const onMouseLeave = resume;

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.className = 'ripple';
    const existing = button.getElementsByClassName('ripple')[0];
    if (existing) existing.remove();
    button.appendChild(circle);
    window.setTimeout(() => {
      circle.remove();
    }, 600);
  };

  const { mutate: play, data: playData } = useMutation<Play, Error, { phone: string }>({
    mutationFn: (variables: { phone: string; }) => apis.play.countPlay(variables).then(res => res.data),
    onSuccess: (data: Play) => {
      console.log('Play successful:', phone, data);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Play failed:', error?.response?.data?.message);
      setErrPhone(error?.response?.data?.message || 'Có lỗi xảy ra');
      setIsLogin(true);
      showAlert(error?.response?.data?.message || 'Có lỗi xảy ra khi xác thực lượt chơi');
    },
  });
  console.log('Play data:', playData);

  const { mutate: spin, data: spinData } = useMutation<Spin, Error, { phone: string }>({
    mutationFn: (variables: { phone: string; }) => apis.play.spin(variables).then(res => res.data),
    onSuccess: (data: Spin) => {
      if (data.status) {
        setIsModalOpen(true);
        setButtonClicked(true);
        play({ phone: phone });
      } else {
        setAlert({
          open: true,
          title: 'Thông báo',
          message: data.msg || 'Có lỗi xảy ra',
        });
      }
      console.log('Spin successful:', data);

    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Spin failed:', error);
      setIsLogin(true);
      setPhone('');
      showAlert(error?.response?.data?.message || 'Quay thưởng thất bại, vui lòng thử lại');
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setPhone(e.target.value);
    if (!/^\d{10}$/.test(e.target.value)) {
      setErrPhone("Số điện thoại không hợp lệ");

      setIsLogin(true);
    } else {
      setErrPhone("");
    }
  };

  const handleLogin = () => {
    if (phone === "") {
      setErrPhone("Số điện thoại không được để trống");
    } else {
      play({ phone: phone });
      setErrPhone("");
      setIsLogin(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${images.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      <div className="w-screen h-full flex items-center justify-center m-auto flex-col">

        <div
          className="relative w-screen overflow-hidden select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={{ touchAction: 'pan-x' }} // <-- cho phép thao tác ngang, chặn cuộn dọc
        >
          <div
            className="flex transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          >
            {slides.map((src, i) => (
              <div key={i} className="flex-shrink-0 w-full h-screen ">
                <img
                  src={src}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-screen object-contain pointer-events-none"
                  decoding="async"
                  draggable={false}
                  style={{ display: 'block' }}
                />
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1 w-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>

          <div
            aria-label="Previous slide"
            onClick={prev}
            className="absolute top-1/2 -translate-y-1/2 left-2 bg-white size-[40px] rounded-full text-sm flex items-center justify-center"
            style={{ color: "#0DA64B" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className='w-7 rotate-180'>
              <path fill="#0da64b" d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z" />
            </svg>
          </div>
          <div
            aria-label="Next slide"
            onClick={next}
            className="absolute top-1/2 -translate-y-1/2 right-2 bg-white size-[40px] rounded-full text-sm flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className='w-7 '>
              <path fill="#0da64b" d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z" />
            </svg>
          </div>
        </div>

      </div>
      <div className="fixed bottom-2 w-full flex justify-center">
        <button
          onClick={() => {
            if (phone === "") {
              setIsLogin(true);

            } else {

              spin({ phone: phone });

            }
          }}
          onMouseDown={createRipple}
          className={`relative overflow-hidden text-white font-bold px-6 py-3 rounded-full cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl focus:outline-none ${!buttonClicked ? 'pulse' : ''}`}
          style={{ backgroundColor: "#0DA64B", width: "80%" }}
        >
          Tham gia chương trình
        </button>
      </div>


      {
        isLogin && <div className="fixed inset-0 h-screen w-screen" style={{
          backgroundImage: `url(${images.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // backgroundColor: "#0DA64B"
        }}>

          <div className="flex flex-col justify-center items-center p-5 h-full w-full">
            <div className="w-full bg-white py-5 px-3 rounded-lg border border-[#0DA64B]">
              <div className="flex justify-center">
                <img src={logo} alt="" className='w-32' />
              </div>
              <div className="">
                <label htmlFor="phone" className='text-[#0DA64B] font-semibold text-base'>Nhập số điện thoại</label>
                <input
                  id="phone"
                  type="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className='border border-[#0DA64B] rounded-lg p-2 w-full mt-2 text-gray-700'
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={handlePhoneChange}
                />
              </div>
              {
                errPhone && <p className='text-red-500 text-sm'>{errPhone}</p>
              }
              <div className="">

                <div className="w-3/4 mx-auto mt-5 bg-[#0DA64B] text-white font-semibold text-center py-2 rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200"
                  onClick={handleLogin}
                >
                  Đăng nhập
                </div>
              </div>

            </div>
          </div>
        </div>
      }

      <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); setButtonClicked(false); }} handleModalOpenGift={handleModalOpenGift} gift={BaseUrlImage + spinData?.prize?.image} />
      <ModalGitSuccess open={isModalOpenGift} onClose={() => { setIsModalOpenGift(false); setButtonClicked(false); }} gift={BaseUrlImage + spinData?.prize?.image} />
      <AlertModal open={alert.open} onClose={closeAlert} title={alert.title} message={alert.message} />
    </div >
  );
}

export default App;


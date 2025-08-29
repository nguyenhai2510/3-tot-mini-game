import { useCallback, useEffect, useRef } from "react";

import background from '../assets/images/background.png';
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
        <div className="fixed inset-0 z-50" style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}>

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
                        className="bg-white text-black px-4 py-2 rounded w-3/4 text-center font-semibold modal-pop absolute bottom-5"
                        style={{ color: "#0DA64B" }}
                    >
                        Đã nhận
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalGitSuccess;
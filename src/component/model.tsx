import { useEffect, useRef, useState } from 'react';
import { ScratchCard, SCRATCH_TYPE } from 'scratchcard-js';

import logo from '../assets/images/3tot.png';
import phuCao from '../assets/images/phu_cao.png';

type Props = {
    open: boolean;
    onClose: () => void;
    gift: string;
    handleModalOpenGift: (status: boolean) => void;
};

const Modal: React.FC<Props> = ({ open, onClose, gift, handleModalOpenGift }) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);   // khung chứa toàn bộ
    const mountRef = useRef<HTMLDivElement | null>(null);     // nơi mount scratchcard
    const infoRef = useRef<HTMLDivElement | null>(null);      // hiển thị %
    const [sizeKey, setSizeKey] = useState(0);                // trigger re-init khi resize
    const aspectRatio = 16 / 9;

    // Khoá scroll nền khi mở modal
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    // Theo dõi resize của wrapper để re-init scratchcard
    useEffect(() => {
        if (!open || !wrapperRef.current) return;
        const ro = new ResizeObserver(() => setSizeKey(k => k + 1));
        ro.observe(wrapperRef.current);
        return () => ro.disconnect();
    }, [open]);

    // Khởi tạo scratchcard-js
    useEffect(() => {
        if (!open || !wrapperRef.current || !mountRef.current) return;

        const mount = mountRef.current;
        const wrapRect = wrapperRef.current.getBoundingClientRect();

        // Tính kích thước: fit vào wrapper, không vượt chiều cao cha
        const width = Math.floor(Math.min(wrapRect.width, wrapRect.height / aspectRatio));
        const height = Math.floor(width * aspectRatio);

        // Làm sạch chỗ mount
        mount.innerHTML = '';

        let completed = false;

        // Có thể truyền trực tiếp element thay vì selector
        const sc = new ScratchCard(mount, {
            scratchType: SCRATCH_TYPE.SPRAY,
            containerWidth: width,
            containerHeight: height,
            imageForwardSrc: phuCao,
            htmlBackground: `<div>...</div>`,
            imageBackgroundSrc: gift,
            brushSrc: 'https://cdn.jsdelivr.net/npm/scratchcard-js@1.5.5/dist/brush.png',
            clearZoneRadius: 70,
            enabledPercentUpdate: true,
            percentToFinish: 50,
            nPoints: 60,
            pointSize: 8,
            callback: function () {
                if (completed) return;
                completed = true;
                try { sc.clear(); } catch {
                    // ignore errors when clearing
                }
                handleModalOpenGift(true);
                onClose();
            }
        });

        const onScratchMove = () => {
            try {
                const percent = Number(sc.getPercent().toFixed(0));
                if (infoRef.current) infoRef.current.textContent = percent + '%';
                if (!completed && percent >= 50) {
                    completed = true;
                    try { sc.clear(); } catch {
                        //
                    }
                    handleModalOpenGift(true);
                    onClose();
                }
            } catch { /* ignore */ }
        };

        sc.init()
            .then(() => {
                sc.canvas.addEventListener('scratch.move', onScratchMove as EventListener, { passive: true } as AddEventListenerOptions);
            })
            .catch((error: Error) => {
                alert(error.message);
            });

        return () => {
            try { sc.canvas?.removeEventListener('scratch.move', onScratchMove as EventListener); } catch {
                // ignore errors when removing event listener
            }
            mount.innerHTML = '';
        };
    }, [open, gift, handleModalOpenGift, onClose, sizeKey]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500/45">
            <div
                className="bg-white p-4 rounded-lg relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '90%', height: '85%' }}
            >
                <div className="absolute top-2 right-2 z-10 size-9" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path fill="#0da64b" d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C221.6 240.4 221.6 255.6 231 264.9L286 319.9L231 374.9C221.6 384.3 221.6 399.5 231 408.8C240.4 418.1 255.6 418.2 264.9 408.8L319.9 353.8L374.9 408.8C384.3 418.2 399.5 418.2 408.8 408.8C418.1 399.4 418.2 384.2 408.8 374.9L353.8 319.9L408.8 264.9C418.2 255.5 418.2 240.3 408.8 231C399.4 221.7 384.2 221.6 374.9 231L319.9 286L264.9 231C255.5 221.6 240.3 221.6 231 231z" />
                    </svg>
                </div>

                <div className="flex items-center justify-center mb-4">
                    <img src={logo} alt="Scratch Card" className="rounded-full h-10" />
                </div>

                <div className="text-lg font-bold mb-2" style={{ width: '90%', color: '#0DA64B' }}>
                    Cào mã để xem quà
                </div>

                {
                    gift && (
                        <div
                            ref={wrapperRef}
                            className="flex-1 flex items-center justify-center relative overflow-hidden"
                            style={{
                                // backgroundImage: `url(${gift})`, // bỏ: sẽ dùng lớp riêng để blur
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        >
                            {/* Lớp nền blur */}
                            <div
                                aria-hidden
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: `url(${gift})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    filter: 'blur(10px)',
                                    transform: 'scale(1.06)', // tránh viền đen do blur
                                    zIndex: 0,
                                }}
                            />

                            {/* nơi mount scratchcard-js */}
                            <div
                                ref={mountRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    zIndex: 1, // trên lớp blur
                                }}
                            />
                        </div>
                    )
                }


                {/* <div ref={infoRef} className="text-center text-sm text-gray-500 mt-2 sc__infos" /> */}
            </div>
        </div>
    );
};

export default Modal;
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
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [sizeKey, setSizeKey] = useState(0);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (!open) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    // Re-initialize scratch card on resize
    useEffect(() => {
        if (!open || !wrapperRef.current) return;
        const resizeObserver = new ResizeObserver(() => setSizeKey(k => k + 1));
        resizeObserver.observe(wrapperRef.current);
        return () => resizeObserver.disconnect();
    }, [open]);

    // Initialize scratch card
    useEffect(() => {
        if (!open || !wrapperRef.current || !mountRef.current) return;

        const mountElement = mountRef.current;
        const wrapRect = wrapperRef.current.getBoundingClientRect();

        // Lấy kích thước đầy đủ của thẻ main
        const width = Math.floor(wrapRect.width);
        const height = Math.floor(wrapRect.height);

        // Clean up previous instance
        mountElement.innerHTML = '';
        let isCompleted = false;

        const sc = new ScratchCard(mountElement, {
            scratchType: SCRATCH_TYPE.LINE,
            containerWidth: width,
            containerHeight: height,
            imageForwardSrc: phuCao,
            htmlBackground: '<div class="absolute inset-0 flex items-center justify-center"><img src="' + gift + '" alt="Gift" class="max-w-full max-h-full object-contain" /></div>', // Lớp phủ để cào (ở trên)
            // Thêm các thuộc tính bắt buộc để khớp với kiểu SC_CONFIG
            imageBackgroundSrc: '',          // Cung cấp giá trị rỗng vì nền được quản lý bằng JSX
            enabledPercentUpdate: true,      // Bắt buộc khi dùng percentToFinish

            // Dùng 'clearZoneRadius' để điều chỉnh độ dày nét cào cho SCRATCH_TYPE.LINE
            // Giảm giá trị này để nét cào mảnh hơn
            clearZoneRadius: 20,

            brushSrc: '',                     // Cung cấp giá trị rỗng vì cọ được quản lý bằng JSX
            percentToFinish: 50,             // Auto-clear at 50%
            nPoints: 100,
            pointSize: 8,
            callback: () => {
                if (isCompleted) return;
                isCompleted = true;
                handleModalOpenGift(true);
                onClose();
            }
        });

        sc.init().catch((error: Error) => {
            console.error("ScratchCard initialization failed:", error);
            alert(error.message);
        });

        return () => {
            // Ensure canvas and listeners are cleaned up
            if (mountElement) {
                mountElement.innerHTML = '';
            }
        };
    }, [open, gift, handleModalOpenGift, onClose, sizeKey]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        // onClick={onClose}
        >
            <div
                className="bg-white rounded-lg relative flex flex-col w-[95%] h-1/2 p-1 "
                onClick={(e) => e.stopPropagation()}
            >
                {/* <div
                    aria-label="Close"
                    className="absolute top-2 right-2 z-10 h-9 w-9"
                    onClick={onClose}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path fill="#0da64b" d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C221.6 240.4 221.6 255.6 231 264.9L286 319.9L231 374.9C221.6 384.3 221.6 399.5 231 408.8C240.4 418.1 255.6 418.2 264.9 408.8L319.9 353.8L374.9 408.8C384.3 418.2 399.5 418.2 408.8 408.8C418.1 399.4 418.2 384.2 408.8 374.9L353.8 319.9L408.8 264.9C418.2 255.5 418.2 240.3 408.8 231C399.4 221.7 384.2 221.6 374.9 231L319.9 286L264.9 231C255.5 221.6 240.3 221.6 231 231z" />
                    </svg>
                </div> */}

                <header className="flex items-center justify-center mb-4 mt-4">
                    <img src={logo} alt="Logo" className="h-10 rounded-full" />
                </header>
                <div className="text-[#0DA64B] font-mono  font-semibold px-2">
                    Cào để xem quà
                </div>

                <main
                    ref={wrapperRef}
                    className="flex-1 flex items-center justify-center relative rounded-lg overflow-hidden"
                >
                    {/* Lớp ảnh quà (nền) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img src={gift} alt="Gift" className="max-w-full max-h-full object-contain " />
                    </div>
                    {/* Lớp cào (nằm trên) */}
                    <div ref={mountRef} className="absolute inset-0" />
                </main>
            </div>
        </div>
    );
};

export default Modal;
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

export default AlertModal;
import './App.css'
import { useState, useEffect, useRef, useCallback } from 'react';
import images from './assets';

import ScratchCard from 'react-scratchcard-v2';

const Modal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
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
              }}>Cào mã để nhận thưởng</div>

            <div className="" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}>
              <ScratchCard
                width={400} // hoặc width={500} tùy ý
                height={226} // hoặc height={Math.round(400 * tỉ lệ ảnh)}
                image={images.phu_cao}
                finishPercent={50}
                onComplete={() => console.log('complete')}
                brushSize={100}
                customBrush={{
                  image: images.phu_cao,
                  width: 15,
                  height: 15
                }}
              >


                <div
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
                  Chúc bạn may mắn lần sau
                </div>
              </ScratchCard>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const slides = [images.artboard_1, images.artboard_2, images.artboard_3];
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDelta = useRef(0);

  // const imagesSwiper = [
  //   images.artboard_1,
  //   images.artboard_2,
  //   images.artboard_3
  // ]

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



  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
      <div className="min-[455px] h-full flex items-center justify-  m-auto  flex-col"

      >
        {/* <div className="flex items-center justify-center mb-4 mt-10">
          <img src={images.logo} alt="Logo" className="h-20 rounded-full" />
        </div> */}
        {/* Slider */}
        <div
          className="relative w-full max-w-[500px] overflow-hidden select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((src, i) => (
              <div key={i} className="flex-shrink-0 w-full">
                <img
                  src={src}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-auto pointer-events-none "
                  draggable={false}
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
          {/* Prev / Next (optional) */}
          {/* <button
            aria-label="Previous slide"
            onClick={prev}
            className="absolute top-1/2 -translate-y-1/2 left-2 bg-black  size-[40px] rounded-full text-sm"
            style={{ color: "#0DA64B" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style={{ color: "#0DA64B", fill: "#0DA64B" }}>
              <path d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z" /></svg>
          </button> */}
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
          onClick={() => { setIsModalOpen(true); setButtonClicked(true); }}
          onMouseDown={createRipple}
          className={`relative overflow-hidden text-white font-bold px-6 py-3 rounded-full cursor-pointer flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-xl focus:outline-none ${!buttonClicked ? 'pulse' : ''}`}
          style={{ backgroundColor: "#0DA64B", width: "80%" }}
        >
          Tham gia chương trình
        </button>
      </div>
      <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false); setButtonClicked(false); }} />
    </div >
  );
}

export default App;


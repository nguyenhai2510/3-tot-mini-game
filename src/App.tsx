import './App.css'
import { useState, useEffect, useRef, useCallback } from 'react';
import images from './assets';

import ScratchCard from 'react-scratchcard-v2';

const Modal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  // responsive width for ScratchCard (number required by the component)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cardWidth, setCardWidth] = useState<number>(400);
  const [revealed, setRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // current scratch image ratio in your code: 400 x 226 -> ratio = 226/400
  const aspectRatio = 226 / 400;
  const confettiCount = 14;

  const vwDebounceRef = useRef<number | null>(null);
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
                image={images.phu_cao}
                finishPercent={50}
                onComplete={() => {
                  // reveal prize + play confetti
                  setRevealed(true);
                  setShowConfetti(true);
                  // stop confetti after 2.8s
                  setTimeout(() => setShowConfetti(false), 2800);
                }}
                brushSize={100}
                customBrush={{
                  image: images.phu_cao,
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
                    <img src={'https://product.hstatic.net/200000852645/product/sua_bot_abbott_glucerna_viet_-_lon_850g_d962f98c01e449b8a2657ef81218343e.png'} alt="prize" className="prize-image" />
                    <div className="prize-text">Bạn đã trúng 1 phần quà!</div>
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



  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
      <div className="w-screen h-full flex items-center justify-center m-auto flex-col">


        {/* <div className="flex items-center justify-center mb-4 mt-10">
          <img src={images.logo} alt="Logo" className="h-20 rounded-full" />
        </div> */}
        {/* Slider */}
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
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((src, i) => (
              <div key={i} className="flex-shrink-0 w-full h-screen bg-[#06CE65]">
                <img
                  src={src}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-screen object-contain pointer-events-none"
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


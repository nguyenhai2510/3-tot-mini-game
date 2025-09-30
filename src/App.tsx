import './App.css'
import { useState, useEffect, useCallback } from 'react';

// 1. Import Swiper components and modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// 2. Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import artboard1 from './assets/images/Artboard2.png';
import artboard2 from './assets/images/Artboard3.png';
import artboard3 from './assets/images/Artboard1.png';
import logo from './assets/images/3tot.png';
import phuCao from './assets/images/phu_cao.png';
import background from './assets/images/background.png';
import { useMutation } from '@tanstack/react-query';
import apis, { BaseUrlImage } from './apis/api';
import type { Play, Spin } from './types/type';
import Modal from './component/model';
import AlertModal from './component/alertModal';
import ModalGitSuccess from './component/modalGitSuccess';
// Bỏ Swiper, SwiperSlide ở đây vì đã import ở trên
const images = {
  artboard1,
  artboard2,
  artboard3,
  logo,
  phuCao,
  background,
};


function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenGift, setIsModalOpenGift] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const slides = [images.artboard1, images.artboard2, images.artboard3];
  // Xóa state và ref không còn dùng cho carousel cũ
  // const [index, setIndex] = useState(0);
  // const intervalRef = useRef<number | null>(null);
  // const touchStartX = useRef<number | null>(null);
  // const touchDelta = useRef(0);
  const [phone, setPhone] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [errPhone, setErrPhone] = useState("");
  const [alert, setAlert] = useState<{ open: boolean; title?: string; message?: string }>({ open: false });

  const handleModalOpenGift = useCallback((status: boolean) => {
    setIsModalOpenGift(status);
  }, []);

  const onCloseScratchModal = useCallback(() => {
    setIsModalOpen(false);
    setButtonClicked(false);
  }, []);

  const showAlert = useCallback((message: string, title?: string) => setAlert({ open: true, message, title }), []);
  const closeAlert = useCallback(() => setAlert((p) => ({ ...p, open: false })), []);

  // Xóa các hàm và useEffect của carousel cũ
  // const goTo = ...
  // const next = ...
  // const prev = ...
  // useEffect for autoplay ...
  // pause, resume, onTouchStart, onTouchMove, onTouchEnd, onMouseEnter, onMouseLeave

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
      console.log(phone);

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
    setIsLogin(true);
    // if (!/^\d{10}$/.test(e.target.value)) {
    //   setErrPhone("Số điện thoại không hợp lệ");


    // } else {
    //   setErrPhone("");
    // }
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

  // Chiều cao app theo visualViewport (đã trừ UI header/bottom của trình duyệt)
  useEffect(() => {
    const setAppHeight = () => {
      const vv = window.visualViewport;
      const h = Math.round(vv?.height ?? window.innerHeight);
      document.documentElement.style.setProperty('--app-height', `${h}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setAppHeight);
      window.visualViewport.addEventListener('scroll', setAppHeight);
    }
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setAppHeight);
        window.visualViewport.removeEventListener('scroll', setAppHeight);
      }
    };
  }, []);

  useEffect(() => {
    history.replaceState(null, '', location.href);
  }, []);

  return (
    <div className="flex w-screen items-center justify-center overflow-hidden"
      style={{
        height: 'var(--app-height, 100dvh)', // dùng chiều cao thực tế
        backgroundImage: `url(${images.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      <div className="w-screen h-full flex items-center justify-center m-auto flex-col">

        {/* 3. Thay thế carousel cũ bằng Swiper */}
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          className="relative w-screen h-full select-none"
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false, // Tiếp tục autoplay sau khi người dùng tương tác
            pauseOnMouseEnter: true, // Tự động dừng khi hover
          }}
          pagination={{
            el: '.swiper-pagination-custom', // Sử dụng container tùy chỉnh
            clickable: true,
          }}
          navigation={{
            nextEl: '.swiper-button-next-custom', // Sử dụng nút tùy chỉnh
            prevEl: '.swiper-button-prev-custom', // Sử dụng nút tùy chỉnh
          }}
        >
          {slides.map((src, i) => (
            <SwiperSlide key={i} className="flex-shrink-0 w-full" style={{ height: 'var(--app-height, 100dvh)' }}>
              <img
                src={src}
                alt={`Slide ${i + 1}`}
                className="w-full object-contain pointer-events-none"
                decoding="async"
                draggable={false}
                style={{ display: 'block', height: 'var(--app-height, 100dvh)' }}
              />
            </SwiperSlide>
          ))}

          {/* Custom Pagination container */}
          <div className="swiper-pagination-custom absolute bottom-2 left-0 right-0 flex justify-center gap-2"></div>

          {/* Custom Navigation Buttons */}
          <div
            aria-label="Previous slide"
            className="swiper-button-prev-custom absolute top-1/2 -translate-y-1/2 left-2 bg-white/60 size-[40px] rounded-full text-sm flex items-center justify-center cursor-pointer z-10"
            style={{ color: "#0DA64B" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className='w-7 rotate-180'>
              <path fill="#0da64b" d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z" />
            </svg>
          </div>
          <div
            aria-label="Next slide"
            className="swiper-button-next-custom absolute top-1/2 -translate-y-1/2 right-2 bg-white/60 size-[40px] rounded-full text-sm flex items-center justify-center cursor-pointer z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className='w-7 '>
              <path fill="#0da64b" d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z" />
            </svg>
          </div>
        </Swiper>

      </div>
      <div className="fixed bottom-2 w-full flex justify-center z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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

      {isLogin && (
        <div className="fixed inset-0 " style={{
          backgroundImage: `url(${images.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 10
        }}>
          <div className="flex flex-col justify-center items-center p-5 h-full w-full">
            <div className="w-full bg-white py-5 px-3 rounded-lg border border-[#0DA64B]">
              <div className="flex justify-center">
                <img src={logo} alt="" className='w-32' />
              </div>
              <div>
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
              {errPhone && <p className='text-red-500 text-sm'>{errPhone}</p>}
              <div>
                <div
                  className="w-3/4 mx-auto mt-5 bg-[#0DA64B] text-white font-semibold text-center py-2 rounded-lg cursor-pointer hover:bg-green-600 transition-colors duration-200"
                  onClick={handleLogin}
                >
                  Đăng nhập
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={onCloseScratchModal}
        handleModalOpenGift={handleModalOpenGift}
        gift={BaseUrlImage + (spinData?.prize?.image ?? '')}
      />
      <ModalGitSuccess open={isModalOpenGift} onClose={() => { setIsModalOpenGift(false); setButtonClicked(false); }} gift={BaseUrlImage + (spinData?.prize?.image ?? '')} />
      <AlertModal open={alert.open} onClose={closeAlert} title={alert.title} message={alert.message} />
    </div >
  );
}

export default App;


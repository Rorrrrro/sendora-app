"use client"
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Navigation } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

const logos = [
  { src: "/Loomy.png", alt: "Loomy", bg: "#AB3D69" },
  { src: "/Shopinova.png", alt: "Shopinova", bg: "#002031" },
  { src: "/GreenElec.png", alt: "GreenElec", bg: "#FDF9F2" },
  { src: "/Fleur%20d'Azur.png", alt: "Fleur d'Azur", bg: "#FAF9F7" },
  { src: "/Studio%20Cr%C3%A9atif.png", alt: "Studio Créatif", bg: "#446456" },
  { src: "/LabalPackMachine.png", alt: "LabalPackMachine", bg: "#fff" },
  { src: "/WEBNOVA.png", alt: "WEBNOVA", bg: "#fff" },
]

export default function LogosCarousel() {
  const swiperRef = useRef(null)
  // Responsive logo size
  const logoWidth = 180
  const logoHeight = 90
  const logoPadding = 12
  const slideContainerHeight = 120
  const logoWidthMobile = 120
  const logoHeightMobile = 60
  const logoPaddingMobile = 6
  const slideContainerHeightMobile = 80

  return (
    <div className="relative max-w-5xl mx-auto px-4 md:px-8">
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow p-2 hover:bg-gray-100 transition disabled:opacity-30"
        aria-label="Précédent"
        style={{ left: 8 }}
        onClick={() => {
          if (swiperRef.current) {
            // @ts-ignore
            swiperRef.current.slidePrev()
          }
        }}
      >
        <ChevronLeft className="w-6 h-6 text-gray-500" />
      </button>
      <Swiper
        modules={[Navigation]}
        onSwiper={swiper => {
          // @ts-ignore
          swiperRef.current = swiper
        }}
        loop={true}
        slidesPerView={5}
        spaceBetween={24}
        breakpoints={{
          0: {
            slidesPerView: 2,
            spaceBetween: 8,
          },
          480: {
            slidesPerView: 2,
            spaceBetween: 12,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 24,
          },
        }}
        className="w-full"
        style={{ height: slideContainerHeight }}
      >
        {logos.map((logo, i) => (
          <SwiperSlide key={i} style={{ height: slideContainerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              className="flex items-center justify-center transition-all duration-200 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 box-border"
              style={{
                width: `min(${logoWidth}px, 100%)`,
                height: `min(${logoHeight}px, 100%)`,
                background: logo.bg,
                padding: logoPadding,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                width={logoWidth - 2 * logoPadding}
                height={logoHeight - 2 * logoPadding}
                className="object-contain max-w-full max-h-full block md:w-auto md:h-auto"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: logoWidth - 2 * logoPadding,
                  maxHeight: logoHeight - 2 * logoPadding,
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow p-2 hover:bg-gray-100 transition disabled:opacity-30"
        aria-label="Suivant"
        style={{ right: 8 }}
        onClick={() => {
          if (swiperRef.current) {
            // @ts-ignore
            swiperRef.current.slideNext()
          }
        }}
      >
        <ChevronRight className="w-6 h-6 text-gray-500" />
      </button>
      <style jsx global>{`
        @media (max-width: 768px) {
          .swiper-slide > div {
            width: ${logoWidthMobile}px !important;
            height: ${logoHeightMobile}px !important;
            padding: ${logoPaddingMobile}px !important;
          }
          .swiper {
            height: ${slideContainerHeightMobile}px !important;
          }
        }
      `}</style>
    </div>
  )
} 
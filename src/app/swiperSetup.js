import Swiper from 'swiper';
import { Navigation, Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const createSwiperOptions = (type) =>
  ({
    mainBanner: {
      autoplay: { delay: 2000 },
      loop: true,
      speed: 1500,
      navigation: {
        nextEl: '#banner-next',
        prevEl: '#banner-prev',
      },
      a11y: {
        prevSlideMessage: '이전',
        nextSlideMessage: '다음',
      },
    },
    productList: (listType) => ({
      slidesPerView: 4,
      slidesPerGroup: 4,
      speed: 300,
      spaceBetween: 18,
      navigation: {
        nextEl: `#${listType}-next`,
        prevEl: `#${listType}-prev`,
        disabledClass: 'swiper-button-hidden',
      },
      a11y: {
        prevSlideMessage: '이전',
        nextSlideMessage: '다음',
      },
    }),
  })[type];

export const initializeAllSwiper = () => {
  // 메인 배너 Swiper
  const mainBannerEl = document.querySelector('#main-banner-swiper');
  if (mainBannerEl) {
    new Swiper(mainBannerEl, {
      ...createSwiperOptions('mainBanner'),
      modules: [Navigation, Autoplay, A11y],
    });
  }

  // 추천 상품 Swiper
  const recommendedEl = document.querySelector('#recommended-product-list-swiper');
  if (recommendedEl) {
    new Swiper(recommendedEl, {
      ...createSwiperOptions('productList')('recommended'),
      modules: [Navigation, A11y],
    });
  }

  // 할인 상품 Swiper
  const discountEl = document.querySelector('#discount-product-list-swiper');
  if (discountEl) {
    new Swiper(discountEl, {
      ...createSwiperOptions('productList')('discount'),
      modules: [Navigation, A11y],
    });
  }
};

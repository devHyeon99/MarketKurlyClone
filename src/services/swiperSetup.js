import Swiper from 'swiper';
import { Navigation, Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { createSwiperOptions } from '@/utils';

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

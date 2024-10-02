import './main.scss';
import {
  header,
  headerSmall,
  footer,
  AdPopup,
  Sidebar,
  CartButton,
  ProductSkeleton,
} from '@/components';
import { initializeAuth, initializeAllSwiper, setupViewedProductTracking } from '@/services';
import { getRecommendedProducts, getDiscountedProducts } from '@/api';
import { defineCustomElements } from '@/utils';
import { renderProductSection } from './renderProductSection';

const CUSTOM_ELEMENTS = [
  ['c-header', header],
  ['c-header-small', headerSmall],
  ['c-footer', footer],
  ['c-popup', AdPopup],
  ['c-sidebar', Sidebar],
  ['c-cart', CartButton],
  ['c-product-skeleton', ProductSkeleton],
];

(async () => {
  // 1. 인증 정보 초기화 함수 호출
  initializeAuth();

  // 2. 웹 컴포넌트 정의
  defineCustomElements(CUSTOM_ELEMENTS);

  // 3. 상품 리스트 렌더링
  await Promise.all([
    renderProductSection('recommended', getRecommendedProducts),
    renderProductSection('discount', getDiscountedProducts),
  ]);

  // 4. 렌더링된 HTML을 바탕으로 Swiper 초기화
  initializeAllSwiper();

  // 5. 상품 클릭 시 최근 본 상품으로 등록하는 이벤트 리스너 초기화
  setupViewedProductTracking();
})();

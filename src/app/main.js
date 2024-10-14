import './main.scss';
import { header } from '@/components/header/header.js';
import { headerSmall } from '@/components/header-small/header-small.js';
import { footer } from '@/components/footer/footer.js';
import { AdPopup } from '@/components/ad-popup/ad-popup.js';
import { RecentProduct } from '@/components/recent-product/recent-product.js';
import { CartButton } from '@/components/cart-button/cart-button.js';
import { ProductSkeleton } from '@/components/product-card-skeleton/product-card-skeleton.js';
import { ConfirmModal } from '@/components/confirmModal/confirmModal.js';
import { initializeAuth } from '@/services/auth';
import { setupViewedProductTracking } from '@/services/viewedProductTracking';
import { getRecommendedProducts, getDiscountedProducts } from '@/api/products';
import { defineCustomElements } from '@/utils/customElements';
import { renderProductSection } from './renderProductSection';
import { initializeAllSwiper } from './swiperSetup';

const CUSTOM_ELEMENTS = [
  ['c-header', header],
  ['c-header-small', headerSmall],
  ['c-footer', footer],
  ['c-popup', AdPopup],
  ['c-recent-product', RecentProduct],
  ['c-cart', CartButton],
  ['c-product-skeleton', ProductSkeleton],
  ['c-confirm-modal', ConfirmModal],
];

(async () => {
  // 1. 인증 정보 초기화 함수 호출
  initializeAuth();

  // 2. 웹 컴포넌트 정의
  defineCustomElements(CUSTOM_ELEMENTS);

  // 3. Swiper 초기화
  initializeAllSwiper();

  // 4. 상품 클릭 시 최근 본 상품으로 등록하는 이벤트 리스너 초기화
  setupViewedProductTracking();

  // 5. 상품 리스트 렌더링
  await Promise.all([
    renderProductSection('recommended', getRecommendedProducts),
    renderProductSection('discount', getDiscountedProducts),
  ]);
})();

import { addViewedProduct } from '@/services/viewedProduct';

/**
 * 상품 클릭 시 최근 본 상품으로 등록하는 이벤트 위임 설정
 * - document에 리스너 하나만 등록해 모든 상품 카드 클릭을 처리
 * - 재렌더링·동적 추가된 카드에도 별도 재등록 없이 동작
 * - 상품 ID와 이미지 URL은 data 속성(data-id, data-image)에서 추출
 */

export const setupViewedProductTracking = () => {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('.product-item__link');
    if (!anchor) return;

    const { id, image } = anchor.dataset;

    if (id && image) {
      addViewedProduct(id, image);
    }
  });
};

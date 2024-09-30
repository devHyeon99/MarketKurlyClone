import { addViewedProduct } from '@/services/viewedProduct';

/**
 * 상품 카드에 이벤트 핸들러 추가하는 로직
 * - 이벤트 위임 방식 사용
 * - 상품 ID 및 이미지 URL은 data 속성에서 추출
 */

export const setupViewedProductTracking = () => {
  const productContainers = document.querySelectorAll('.product-item-group');

  if (!productContainers.length) return;

  productContainers.forEach((container) => {
    container.addEventListener('click', (e) => {
      const anchor = e.target.closest('.product-item__link');
      if (!anchor) return;

      console.log(anchor);

      const id = anchor.dataset.id;
      const image = anchor.dataset.image;

      if (id && image) {
        addViewedProduct(id, image);
      }
    });
  });
};

import { createProductCard, createViewAllCard } from '@/components/product-card/productCard';

/**
 * 상품 목록 섹션을 렌더링하는 함수
 * @param {string} type - 렌더링할 섹션 타입 ('recommended' 또는 'discount')
 * @param {function} fetcher - 상품 데이터를 가져올 API 함수
 */

export const renderProductSection = async (type, fetcher) => {
  const productGroup = document
    .querySelector(`#${type}-product-list-swiper`)
    .closest('[role="group"]');

  try {
    const productList = await fetcher();
    const swiperWrapper = document.querySelector(`#${type}-product-list-swiper .swiper-wrapper`);

    if (swiperWrapper) {
      const productCards = productList.map(createProductCard).join('');
      const viewAllCard = createViewAllCard();

      swiperWrapper.innerHTML = productCards + viewAllCard;

      if (productGroup) {
        productGroup.setAttribute('aria-busy', 'false');
      }
    }
  } catch (error) {
    console.error(`${type} 상품 리스트 렌더링 실패`, error);
  }
};

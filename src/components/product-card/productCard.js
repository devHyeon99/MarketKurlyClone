import { getImageUrl, html } from '@/utils';

// 리뷰 수 텍스트를 생성하는 헬퍼 함수
const formatReviewCount = (count) => {
  if (count >= 9999) return '9,999+';
  if (count >= 999) return '999+';
  return String(count);
};

// '전체보기' 카드 HTML을 생성하는 함수
export const createViewAllCard = () => {
  return html`
    <div class="swiper-slide">
      <div class="product-item__view-all">
        <a
          class="product-item__link"
          href="/src/pages/product-list/"
          aria-label="상품 페이지로 이동"
        >
          <img src="/assets/icons/arrow/view-all.svg" alt="" aria-hidden="true" />
          <p>전체보기</p>
        </a>
      </div>
    </div>
  `;
};

// 상품 카드 HTML을 생성하는 함수
export const createProductCard = (product) => {
  const discountedPrice = Math.floor(product.product_price * (1 - product.discount_rate / 100));
  const imageUrl = getImageUrl(product);
  const reviewCountText = formatReviewCount(product.review_count);

  const discountRateHtml =
    product.discount_rate > 0
      ? html`
          <span class="product-item__discount-rate">
            ${product.discount_rate}%<span class="sr-only">할인</span>
          </span>
        `
      : '';

  const productPriceHtml =
    product.discount_rate > 0 ? `${product.product_price.toLocaleString()}원` : '';

  const priceClass =
    product.discount_rate > 0
      ? 'product-item__price product-item__price--discounted'
      : 'product-item__price';

  return html`
    <div class="swiper-slide">
      <div class="product-item">
        <a
          class="product-item__link"
          href="/src/pages/product-detail/?id=${product.id}"
          data-id="${product.id}"
          data-image="${imageUrl}"
          aria-label="${product.product_name} 상품 페이지"
        >
          <div class="product-item__img-wrapper">
            <img src="${imageUrl}" alt="${product.product_name}" class="product-item__img" />
          </div>
          <p class="product-item__title">${product.product_name}</p>
          <div class="price-group">
            <p class="${priceClass}"><span class="sr-only">정가</span>${productPriceHtml}</p>
            <p class="product-item__real-price">
              ${discountRateHtml}
              <span class="sr-only">구매가</span>${discountedPrice.toLocaleString()}원
            </p>
          </div>
          <p class="product-item__reviews">
            <span class="sr-only">리뷰 수</span>${reviewCountText}
          </p>
        </a>
        <c-cart
          data-product-id="${product.id}"
          data-product-image="${imageUrl}"
          data-product-name="${product.product_name}"
          data-product-price="${product.product_price}"
          data-discounted-price="${discountedPrice}"
        ></c-cart>
      </div>
    </div>
  `;
};

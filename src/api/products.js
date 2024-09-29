import { pb } from './index';

/**
 * 추천 상품 목록을 가져오는 함수
 * @returns {Promise<PocketBase.Record[]>}
 */
export const getRecommendedProducts = async () => {
  const productListResult = await pb.collection('product').getList(1, 16, {
    sort: '-sales_count',
    requestKey: 'recommended',
  });
  return productListResult.items;
};

/**
 * 할인 상품 목록을 가져오는 함수
 * @returns {Promise<PocketBase.Record[]>}
 */
export const getDiscountedProducts = async () => {
  const productListResult = await pb.collection('product').getList(1, 16, {
    sort: '-discount_rate',
    filter: 'discount_rate >= 10',
    requestKey: 'discounted',
  });
  return productListResult.items;
};

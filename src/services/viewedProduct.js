import { getViewedProducts, setViewedProducts } from '@/utils/index';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const addViewedProduct = (id, image) => {
  const now = Date.now();
  const existingProducts = getViewedProducts();

  const filtered = existingProducts.filter((p) => now < p.expirationTime && p.id !== id);

  filtered.unshift({
    id,
    image,
    expirationTime: now + ONE_DAY_MS,
  });

  setViewedProducts(filtered);
  window.dispatchEvent(new CustomEvent('productViewed'));
};

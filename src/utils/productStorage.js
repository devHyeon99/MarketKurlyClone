const STORAGE_KEY = 'viewed_products';

export const getViewedProducts = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveViewedProducts = (products) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

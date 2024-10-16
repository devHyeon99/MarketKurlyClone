const createCartStore = () => {
  let items = JSON.parse(localStorage.getItem('cartItems') || '[]');

  const persist = () => {
    localStorage.setItem('cartItems', JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cartUpdated', { detail: items.length }));
  };

  return {
    getCartLength: () => items.length,

    addToCart(item) {
      items.push(item);
      persist();
    },

    addOrIncreaseQuantity(productId, quantity) {
      const existingItem = items.find((item) => item.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.push({ productId, quantity });
      }

      persist();
    },
  };
};

export const cartStore = createCartStore();

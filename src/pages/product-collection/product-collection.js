import './product-collection.scss';
import { defineCustomElements } from '@/utils/index';

import { pb } from '@/api/index';
import { header } from '@/components/header/header';
import { headerSmall } from '@/components/header-small/header-small';
import { footer } from '@/components/footer/footer';
import { CartButton } from '@/components/cart-button/cart-button';
import { SideFilter } from '@/components/side-filter-panel/side-filter-panel';
import { RecentProduct } from '@/components/recent-product/recent-product';
import { createProductListCard } from '@/components/product-card/productCard';
import { setupViewedProductTracking } from '@/services/viewedProductTracking';

(function () {
  const ITEMS_PER_PAGE = 15;
  const FILTER_MAP = {
    recent: '-created',
    best: '-sales_count',
    discount: '-discount_rate',
  };

  let isLoading = false;
  let initialCategory;
  let allProducts = [];

  const setLoading = (loading) => {
    isLoading = loading;
  };

  const getCategoryFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category') || 'recent';
  };

  const fetchProducts = async (filter = 'recent') => {
    const sort = FILTER_MAP[filter] || FILTER_MAP.recent;
    return await pb.collection('product').getList(1, 1000, { sort });
  };

  const sortProducts = (products, additionalFilter) => {
    return products.sort((a, b) => {
      // 초기 정렬 기준에 따른 비교
      if (initialCategory === 'recent') {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
      } else if (initialCategory === 'best') {
        if (a.sales_count !== b.sales_count) {
          return b.sales_count - a.sales_count;
        }
      } else if (initialCategory === 'discount') {
        if (a.discount_rate !== b.discount_rate) {
          return b.discount_rate - a.discount_rate;
        }
      }

      // 초기 정렬 기준이 같은 경우, 추가 필터 적용
      if (additionalFilter === 'lowPrice') {
        return a.product_price - b.product_price;
      } else if (additionalFilter === 'highPrice') {
        return b.product_price - a.product_price;
      }

      // 모든 기준이 같으면 순서 유지
      return 0;
    });
  };

  const renderProductList = async (filter = 'recent', page = 1) => {
    try {
      setLoading(true);

      if (allProducts.length === 0) {
        const productsData = await fetchProducts(filter);
        allProducts = productsData.items;
      }

      const sortedProducts = sortProducts([...allProducts], filter);

      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginatedProducts = sortedProducts.slice(start, end);

      const productCount = allProducts.length;

      const countText = document.querySelector('.product-filter__count');
      const categoryTitle = document.querySelector('.product-header');
      const itemGroup = document.querySelector('.product-item-group');

      countText.textContent = `총 ${productCount}건`;
      categoryTitle.textContent =
        initialCategory === 'recent'
          ? '신상품'
          : initialCategory === 'best'
            ? '베스트'
            : initialCategory === 'discount'
              ? '알뜰쇼핑'
              : '';

      itemGroup.innerHTML = paginatedProducts.map(createProductListCard).join('');

      updatePagination(productCount, ITEMS_PER_PAGE, page, filter);
      updateActiveFilter(filter);
    } catch (e) {
      console.error('Error : ', e);
    } finally {
      setLoading(false);
    }
  };

  const updatePagination = (totalItems, itemsPerPage, currentPage, filter) => {
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    const numbers = document.querySelector('.numbers');
    numbers.innerHTML = Array.from(
      { length: pageCount },
      (_, i) => `<li><a class="pagination__link" href="#" data-page="${i + 1}">${i + 1}</a></li>`
    ).join('');

    const numberButtons = numbers.querySelectorAll('.pagination__link');

    numberButtons.forEach((item) => {
      const pageNum = parseInt(item.dataset.page);
      item.addEventListener('click', (e) => handlePageClick(e, pageNum, filter));
      item.classList.toggle('pagination__link--is-selected', pageNum === currentPage);
      item.toggleAttribute('aria-current', pageNum === currentPage);
    });

    setupPaginationButtons(currentPage, pageCount, filter);
  };

  const handlePageClick = async (e, pageNum, filter) => {
    e.preventDefault();
    if (isLoading) return;
    await renderProductList(filter, pageNum);
  };

  const setupPaginationButtons = (currentPage, pageCount, filter) => {
    const buttons = document.querySelectorAll('.pagination__button');
    buttons.forEach((button) => {
      button.removeEventListener('click', button._listener);
      button._listener = async () => {
        if (isLoading) return;

        let newPage;
        if (button.classList.contains('first-prev-button')) newPage = 1;
        else if (button.classList.contains('second-prev-button'))
          newPage = Math.max(1, currentPage - 1);
        else if (button.classList.contains('next-button'))
          newPage = Math.min(pageCount, currentPage + 1);
        else if (button.classList.contains('last-next-button')) newPage = pageCount;

        if (newPage !== currentPage) {
          await renderProductList(filter, newPage);
        }
      };
      button.addEventListener('click', button._listener);
    });
  };

  const handleClickFilter = async (e) => {
    if (isLoading) return;
    const filter = e.target.dataset.filter;
    if (filter) {
      await renderProductList(filter);
    }
  };

  const updateActiveFilter = (activeFilter) => {
    const filterButtons = document.querySelectorAll('.product-filter__button');
    filterButtons.forEach((button) => {
      button.classList.toggle(
        'product-filter__button--is-active',
        button.dataset.filter === activeFilter
      );
    });
  };

  const init = async () => {
    defineCustomElements([
      ['c-header', header],
      ['c-header-small', headerSmall],
      ['c-footer', footer],
      ['c-cart', CartButton],
      ['c-sidebar-category', SideFilter],
      ['c-recent-product', RecentProduct],
    ]);

    const filterContainer = document.querySelector('.product-filter__list');
    filterContainer.addEventListener('click', handleClickFilter);

    initialCategory = getCategoryFromURL();
    await renderProductList(initialCategory);
    setupViewedProductTracking();
  };

  init();
})();

import './product-list.scss';
import { defineCustomElements } from '@/utils';
import { pb } from '@/api';
import { header } from '@/components/header/header';
import { headerSmall } from '@/components/header-small/header-small';
import { footer } from '@/components/footer/footer';
import { CartButton } from '@/components/cart-button/cart-button';
import { SideFilter } from '@/components/side-filter-panel/side-filter-panel';
import { RecentProduct } from '@/components/recent-product/recent-product';
import { createProductListCard } from '@/components/product-card/productCard';
import { setupViewedProductTracking } from '@/services/viewedProductTracking';

(function () {
  // 페이지 수 상수로 정의
  const ITEMS_PER_PAGE = 15;

  // 상태 변수 정의
  let isLoading = false;
  let allProducts = [];
  let currentCategory = '';
  let currentFilter = '';

  // 로딩 상태를 설정하는 함수
  const setLoading = (loading) => {
    isLoading = loading;
  };

  // URL에서 카테고리 파라미터를 가져오는 함수
  const getCategoryFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category') || '';
  };

  // URL에서 검색 파라미터를 가져오는 함수
  const getSearchFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('search') || '';
  };

  // 주어진 필터와 페이지 번호에 따라 상품 데이터를 서버에서 가져오는 함수
  const fetchAllProducts = async (category, search) => {
    let filter = '';

    if (category) {
      filter += `category.category_name = "${category}"`;
    }

    if (search) {
      if (filter) filter += ' && ';
      filter += `(product_name ~ "${search}" || product_description ~ "${search}" || category.category_name ~ "${search}" || brand.brand_name ~ "${search}")`;
    }

    return await pb.collection('product').getFullList({
      expand: 'category, brand',
      filter: filter,
    });
  };

  // 상품 목록을 렌더링하는 함수. 필터와 페이지 정보를 받아 상품을 가져오고 화면에 표시
  const renderProductList = (products, page = 1) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const displayedProducts = products.slice(startIndex, endIndex);

    const countText = document.querySelector('.product-filter__count');
    const itemGroup = document.querySelector('.product-item-group');

    countText.textContent = `총 ${products.length}건`;
    itemGroup.innerHTML = displayedProducts.map(createProductListCard).join('');

    updatePagination(products.length, ITEMS_PER_PAGE, page);
    updateActiveFilter(currentFilter);
  };

  // 페이지네이션을 업데이트하는 함수. 총 아이템 수, 페이지당 아이템 수, 현재 페이지, 현재 필터를 기반으로 페이지네이션을 생성
  const updatePagination = (totalItems, itemsPerPage, currentPage) => {
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    const numbers = document.querySelector('.numbers');
    numbers.innerHTML = Array.from(
      { length: pageCount },
      (_, i) => `<li><a class="pagination__link" href="#" data-page="${i + 1}">${i + 1}</a></li>`
    ).join('');

    const numberButtons = numbers.querySelectorAll('.pagination__link');

    numberButtons.forEach((item) => {
      const pageNum = parseInt(item.dataset.page);
      item.addEventListener('click', (e) => handlePageClick(e, pageNum));
      item.classList.toggle('pagination__link--is-selected', pageNum === currentPage);
      item.toggleAttribute('aria-current', pageNum === currentPage);
    });

    setupPaginationButtons(currentPage, pageCount);
  };

  // 페이지 번호를 클릭했을 때 실행되는 함수입. 해당 페이지의 상품 목록을 렌더링
  const handlePageClick = (e, pageNum) => {
    e.preventDefault();
    if (isLoading) return;
    renderProductList(allProducts, pageNum);
  };

  // 페이지네이션 버튼(첫 페이지, 이전, 다음, 마지막 페이지)의 동작을 설정하는 함수
  const setupPaginationButtons = (currentPage, pageCount) => {
    const buttons = document.querySelectorAll('.pagination__button');
    buttons.forEach((button) => {
      button.removeEventListener('click', button._listener);
      button._listener = () => {
        if (isLoading) return;

        let newPage;
        if (button.classList.contains('first-prev-button')) newPage = 1;
        else if (button.classList.contains('second-prev-button'))
          newPage = Math.max(1, currentPage - 1);
        else if (button.classList.contains('next-button'))
          newPage = Math.min(pageCount, currentPage + 1);
        else if (button.classList.contains('last-next-button')) newPage = pageCount;

        if (newPage !== currentPage) {
          renderProductList(allProducts, newPage);
        }
      };
      button.addEventListener('click', button._listener);
    });
  };

  // 필터 버튼을 클릭했을 때 실행되는 함수 선택된 필터에 따라 상품 목록을 다시 렌더링
  const handleClickFilter = (e) => {
    if (isLoading) return;
    const filter = e.target.dataset.filter;
    if (filter) {
      currentFilter = filter;
      const sortedProducts = sortProducts(allProducts, filter);
      renderProductList(sortedProducts);
    }
  };

  // 상품을 정렬하는 함수
  const sortProducts = (products, filter) => {
    const sortFunctions = {
      recent: (a, b) => new Date(b.created) - new Date(a.created),
      best: (a, b) => b.sales_count - a.sales_count,
      discount: (a, b) => b.discount_rate - a.discount_rate,
      lowPrice: (a, b) => a.product_price - b.product_price,
      highPrice: (a, b) => b.product_price - a.product_price,
    };

    return [...products].sort(sortFunctions[filter]);
  };

  // 현재 활성화된 필터 버튼의 스타일을 업데이트하는 함수
  const updateActiveFilter = (activeFilter) => {
    const filterButtons = document.querySelectorAll('.product-filter__button');
    filterButtons.forEach((button) => {
      button.classList.toggle(
        'product-filter__button--is-active',
        button.dataset.filter === activeFilter
      );
    });
  };

  // 카테고리 제목을 설정하는 함수
  const setCategoryTitle = (category, search) => {
    const categoryTitle = document.querySelector('.product-header');
    if (search) {
      categoryTitle.textContent = `'${search}' 검색 결과`;
    } else {
      categoryTitle.textContent = category || '전체보기';
    }
  };

  // 커스텀 엘리먼트를 정의, 이벤트 리스너를 설정, URL 파라미터를 읽어와 초기 상품 목록을 렌더링
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

    currentCategory = getCategoryFromURL();
    const currentSearch = getSearchFromURL();
    setCategoryTitle(currentCategory, currentSearch);

    try {
      setLoading(true);
      allProducts = await fetchAllProducts(currentCategory, currentSearch);
      renderProductList(allProducts);
      setupViewedProductTracking();
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  init();
})();

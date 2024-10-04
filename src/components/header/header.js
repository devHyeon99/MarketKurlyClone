import styles from './header.scss?inline';
import templateHTML from './index.html?raw';
import { cart } from '@/utils/cart';
import { pb } from '@/api/index';
import { defaultAuthData } from '@/constants';

export class header extends HTMLElement {
  constructor() {
    super();
    // Shadow DOM을 사용하여 캡슐화된 스타일과 마크업 생성
    this.attachShadow({ mode: 'open' });

    // 1. HTML 템플릿 준비
    const template = document.createElement('template');
    template.innerHTML = templateHTML;

    // 2. 스타일 태그 준비
    const style = document.createElement('style');
    style.textContent = styles; // import한 CSS 문자열을 삽입

    // 3. Shadow DOM에 스타일과 HTML을 모두 추가
    // append 여러 노드를 한 번에 추가
    this.shadowRoot.append(style, template.content.cloneNode(true));

    this.initElements();
    this.usingKeyboard = false;
    this.currentFocusedItem = null;
    // Map을 사용하여 여러 요소의 타이머를 효율적으로 관리
    this.hideTimeouts = new Map();
    this.closeTime = localStorage.getItem('topBanner');
    this.DELAY = 250; // 모든 지연에 사용되는 공통 값
  }

  // 쿼리 셀렉터를 사용하여 필요한 DOM 요소 초기화
  initElements() {
    const selectors = {
      categoryMenu: '.category-menu',
      categoryMenuButton: '.category-menu__text',
      menuContainer: '.menu-container',
      menuLists: '.menu-list__item',
      menuItems: '.menu-list__item a',
      locationButton: '.user-actions__location',
      locationTooltip: '.location-tooltip',
      topBanner: '.top-banner',
      topBannerCloseButton: '.top-banner__close',
      modal: 'c-modal',
      cartIcon: '.user-actions__cart',
      categoryLinks: '.category-item__link',
      searchField: '#product_search',
      searchButton: '.product_search_button',
    };

    this.elements = Object.entries(selectors).reduce((acc, [key, selector]) => {
      if (key === 'menuLists' || key === 'menuItems' || key === 'categoryLinks') {
        acc[key] = this.shadowRoot.querySelectorAll(selector);
      } else {
        acc[key] = this.shadowRoot.querySelector(selector);
      }
      return acc;
    }, {});
  }

  // Web Component 생명주기 메서드: 컴포넌트가 DOM에 연결될 때 호출
  connectedCallback() {
    this.checkBanner();
    this.checkAuth();
    this.setupEventListeners();
    this.updateCartBadge();
    this.setActiveCategoryLink();
  }

  // 이벤트 위임 및 이벤트 리스너를 사용하여 사용자 상호작용 처리
  setupEventListeners() {
    document.addEventListener('keydown', () => (this.usingKeyboard = true));
    document.addEventListener('mousedown', () => (this.usingKeyboard = false));

    this.shadowRoot.addEventListener('focusin', this.handleFocusIn.bind(this));
    this.shadowRoot.addEventListener('focusout', this.handleFocusOut.bind(this));

    this.addToggleEvents(
      this.elements.categoryMenu,
      () => this.showElement(this.elements.menuContainer),
      () => this.hideWithDelay(this.elements.menuContainer)
    );
    this.addToggleEvents(
      this.elements.categoryMenu,
      () => this.toggleMenu(true),
      () => this.toggleMenu(false)
    );
    this.addToggleEvents(
      this.elements.locationButton,
      () => this.showElement(this.elements.locationTooltip),
      () => this.hideWithDelay(this.elements.locationTooltip)
    );
    this.addToggleEvents(
      this.elements.locationTooltip,
      () => this.clearHideTimeout(this.elements.locationTooltip),
      () => this.hideWithDelay(this.elements.locationTooltip)
    );

    this.elements.topBannerCloseButton.addEventListener('click', this.handleCloseBanner.bind(this));
    this.elements.searchButton.addEventListener('click', this.handleSearchProduct.bind(this));
    this.elements.searchField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearchProduct.bind(this)();
    });
    document.addEventListener('cartUpdated', this.updateCartBadge.bind(this));
  }

  // 재사용 가능한 이벤트 리스너 추가 함수
  addToggleEvents(element, showCallback, hideCallback) {
    element.addEventListener('mouseenter', showCallback);
    element.addEventListener('mouseleave', hideCallback);
  }

  // 포커스 이벤트 처리: 키보드 접근성 지원
  handleFocusIn({ target }) {
    if (!this.usingKeyboard) return;

    if (target === this.elements.categoryMenuButton) {
      this.elements.categoryMenu.classList.add('focused');
      this.showElement(this.elements.menuContainer);
    } else if (target.closest('.menu-list__item')) {
      this.handleMenuItemFocus(target);
    } else if (target === this.elements.locationButton || target.closest('.location-tooltip')) {
      this.showElement(this.elements.locationTooltip);
    }
  }

  // 포커스 아웃 이벤트 처리
  handleFocusOut({ target }) {
    if (target === this.elements.categoryMenuButton) {
      this.elements.categoryMenu.classList.remove('focused');
    } else if (target.closest('.menu-list__item')) {
      this.handleMenuItemBlur();
    } else if (target === this.elements.locationButton || target.closest('.location-tooltip')) {
      this.hideWithDelay(this.elements.locationTooltip);
    }
  }

  // 메뉴 아이템 포커스 처리: 시각적 피드백 제공
  handleMenuItemFocus(item) {
    if (this.currentFocusedItem) {
      this.currentFocusedItem.classList.remove('focused');
    }
    const menuList = item.closest('.menu-list__item');
    if (menuList) {
      menuList.classList.add('focused');
      this.currentFocusedItem = menuList;
    }
  }

  // 메뉴 아이템 블러 처리
  handleMenuItemBlur() {
    setTimeout(() => {
      if (!this.shadowRoot.activeElement?.closest('.menu-list__item')) {
        this.hideElement(this.elements.menuContainer);
        if (this.currentFocusedItem) {
          this.currentFocusedItem.classList.remove('focused');
          this.currentFocusedItem = null;
        }
      }
    }, 0);
  }

  toggleMenu(expand = true) {
    const { categoryMenuButton, menuContainer } = this.elements;

    menuContainer.hidden = !expand;
    categoryMenuButton.setAttribute('aria-expanded', String(expand));
  }

  // 배너 닫기 처리: localStorage를 사용한 상태 저장
  handleCloseBanner() {
    this.hideElement(this.elements.topBanner);
    const closeTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('topBanner', closeTime);
  }

  // 배너 표시 여부 확인: 저장된 시간과 현재 시간 비교
  checkBanner() {
    if (!this.closeTime) return;

    const currentTime = Date.now();
    if (currentTime < this.closeTime) {
      this.hideElement(this.elements.topBanner);
    } else {
      localStorage.removeItem('topBanner');
    }
  }

  // 장바구니 뱃지 업데이트 메서드
  updateCartBadge(event) {
    const cartItemCount = event ? event.detail : cart.length;
    if (cartItemCount > 0) {
      this.elements.cartIcon.innerHTML = `
        <span class="user-actions__badge">${cartItemCount}</span>
      `;
    }
  }

  // 현재 URL에 따라 활성 카테고리 링크 설정
  setActiveCategoryLink() {
    const currentUrl = new URL(window.location.href);
    const category = currentUrl.searchParams.get('category');
    const search = currentUrl.searchParams.get('search');
    const pathname = currentUrl.pathname;

    this.elements.categoryLinks.forEach((link) => {
      link.classList.remove('__is-active');
    });

    // 검색 파라미터가 있으면 어떤 카테고리도 활성화하지 않음
    if (search) {
      return;
    }

    if (category === 'best') {
      this.elements.categoryLinks[1].classList.add('__is-active'); // 베스트
    } else if (category === 'discount') {
      this.elements.categoryLinks[2].classList.add('__is-active'); // 알뜰쇼핑
    } else if (pathname === '/src/pages/product-list/' && !category) {
      this.elements.categoryLinks[3].classList.add('__is-active'); // 전체보기
    } else if (category === 'recent' || pathname === '/src/pages/product-collection/') {
      this.elements.categoryLinks[0].classList.add('__is-active'); // 신상품
    }
  }

  // 로그인 여부에 따른 조건부 렌더링
  checkAuth() {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    const { isAuth, user } = auth;
    const authLink = this.shadowRoot.querySelector('.auth-links');
    const locationTooltip = this.shadowRoot.querySelector('.location-tooltip');

    const getAuthButton = () => {
      if (isAuth) {
        return `
        <button
          type="button"
          class="auth-links__logout"
          aria-label="로그아웃 버튼"
        >로그아웃
        </button>
      `;
      }
      return `<a href="/src/pages/login/" class="auth-links__login">로그인</a>`;
    };

    const getUserInfo = () => {
      if (isAuth) {
        return `<span class="auth-links__username">${user.name}</span>`;
      }
      return `<a href="/src/pages/register/" class="auth-links__signup">회원가입</a>`;
    };

    const getLocationTooltipContent = () => {
      if (isAuth) {
        return `
          <p class="modal-notice">배송지 변경</p>
          <div class="modal-divider"></div>
          <span class="modal-location-register__title">현재 주소</span>
          <p class="modal-location__address">${user.address}</p>
          <span class="modal-location-delivery">${user.morning_delivery ? '샛별배송' : '일반배송'}</span>
          <div class="location-tooltip-button">
            <button
              type="button"
              class="location-tooltip-button__location"
              aria-label="주소 변경 모달 버튼"
            >
              주소 변경
            </button>
          </div>
        `;
      } else {
        return `
          <p class="modal-notice2"><strong>배송지를 등록</strong>하고<br />구매 가능한 상품을 확인하세요!</p>
          <div class="location-tooltip-button">
            <a
              href="/src/pages/login/"
              role="button"
              class="location-tooltip-button__login"
              aria-label="로그인 페이지로 이동"
            >로그인</a>
          </div>
        `;
      }
    };

    const authLinksHtml = `
      ${getUserInfo()}
      <div class="divider" aria-hidden="true"></div>
      ${getAuthButton()}
      <div class="divider" aria-hidden="true"></div>
      <div class="customer-service">
        <a href="#">고객센터</a>
      </div>
    `;

    authLink.innerHTML = authLinksHtml;
    locationTooltip.innerHTML = getLocationTooltipContent();

    if (isAuth) {
      const logOutButton = this.shadowRoot.querySelector('.auth-links__logout');
      logOutButton?.addEventListener('click', this.handleLogout.bind(this));
    }

    const locationButton = this.shadowRoot.querySelector('.location-tooltip-button__location');
    locationButton?.addEventListener(
      'click',
      this.handleLocationRegistration.bind(this, user, getLocationTooltipContent)
    );
  }

  // 로그아웃 기능 메서드
  handleLogout() {
    const modalContent = {
      title: '로그아웃',
      body: '로그아웃 하시겠습니까?',
      closeText: '취소',
      logoutText: '확인',
    };

    const createModalHTML = ({ title, body, closeText, logoutText }) => `
    <h2 slot="header" class="logout-modal__title">${title}</h2>
    <p slot="header" class="logout-modal__body">${body}</p>
    <div slot="footer" class="logout-modal-button">
      <button slot="footer" type="button" id="modal__close" class="logout-modal__close">${closeText}</button>
      <button slot="footer" type="button" id="modal__logout" class="logout-modal__logout">${logoutText}</button>
    </div>
  `;

    const setupModal = () => {
      this.elements.modal.setAttribute('width', '350px');
      this.elements.modal.setAttribute('height', '180px');
      this.elements.modal.innerHTML = createModalHTML(modalContent);
      this.elements.modal.showModal();
    };

    const initEventListeners = () => {
      const logout = this.shadowRoot.querySelector('.logout-modal__logout');
      const close = this.shadowRoot.querySelector('.logout-modal__close');

      const handleLogoutClick = () => {
        pb.authStore.clear();
        localStorage.setItem('auth', JSON.stringify(defaultAuthData));
        location.reload();
      };

      const handleCloseClick = () => {
        this.elements.modal.close();
      };

      logout.addEventListener('click', handleLogoutClick);
      close.addEventListener('click', handleCloseClick);

      // 모달이 닫힐 때 이벤트 리스너 제거
      this.elements.modal.addEventListener(
        'close',
        () => {
          logout.removeEventListener('click', handleLogoutClick);
          close.removeEventListener('click', handleCloseClick);
        },
        { once: true }
      );
    };

    setupModal();
    initEventListeners();
  }

  // 주소 등록 메서드
  async handleLocationRegistration(user, getLocationTooltipContent) {
    const modalContent = {
      title: '배송지 변경',
      subTitle: user.address,
      placeholder: '변경할 주소를 입력 해주세요.',
      closeText: '닫기',
      registerText: '변경하기',
    };

    const createModalHTML = ({ title, subTitle, placeholder, closeText, registerText }) => `
    <h2 slot="header" class="modal-header">${title}</h2>
    <h3 slot="header" class="modal-sub-header">${subTitle}</h3>
    <span slot="header" class="modal-divider"></span>
    <input slot="body" class="modal__input" type="text" placeholder="${placeholder}"/>
    <div slot="footer" class="modal-button-group">
      <button slot="footer" type="button" class="modal__close" id="close-btn" aria-label="배송지 변경 모달창 닫기">${closeText}</button>
      <button slot="footer" class="modal__address-change" type="button" aria-label="배송지 변경 하기">${registerText}</button>
    </div>
  `;

    const createDialog = (className, innerHTML) => {
      const dialog = document.createElement('dialog');
      dialog.className = className;
      dialog.innerHTML = innerHTML;
      return dialog;
    };

    const showModal = (modal) => {
      this.shadowRoot.appendChild(modal);
      modal.showModal();
      return modal;
    };

    const showAlertModal = (message) => {
      const alertModal = createDialog(
        'alert-modal',
        `
          <style>
          dialog {
            width: 25rem;
            height: 11.875rem;
            border: none;
            border-radius: 0.3125rem;
            padding: 20px;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .alert-modal {
            display: flex;
            flex-flow: column nowrap;
            justify-content: space-between;
            align-items: center;
          }
          .alert-modal::backdrop {
            background-color: rgba(0, 0, 0, 0.5);
          }
          .modal__message {
            font-size: 1rem;
            font-weight: 500;
          }
          </style>
          <h2 slot="header" class="modal-header">알림</h2>
          <p slot="body" class="modal__message">${message}</p>
          <div slot="footer" class="modal-button-group">
            <button slot="footer" type="button" class="modal__close" id="alert-close-btn" aria-label="알림 모달창 닫기">확인</button>
          </div>
      `
      );

      const closeAlertModal = () => {
        alertModal.close();
        alertModal.remove();
        location.reload();
      };

      alertModal
        .querySelector('#alert-close-btn')
        .addEventListener('click', closeAlertModal, { once: true });
      showModal(alertModal);
    };

    const setupMainModal = () => {
      this.elements.modal.setAttribute('width', '400px');
      this.elements.modal.setAttribute('height', '190px');
      this.elements.modal.innerHTML = createModalHTML(modalContent);
      showModal(this.elements.modal);
    };

    const updateLocalStorage = (updatedUser) => {
      const authData = JSON.parse(localStorage.getItem('auth'));
      if (authData && authData.user) {
        authData.user = { ...authData.user, ...updatedUser };
        localStorage.setItem('auth', JSON.stringify(authData));
      }
    };

    // 배송 유형 업데이트
    const updateMorningDelivery = (address) => {
      const morningDeliveryAreas = ['안성', '서울', '영주', '거제'];
      return morningDeliveryAreas.some((area) => address.includes(area));
    };

    const handleAddressChange = async (inputField) => {
      const newAddress = inputField.value.trim();
      if (!newAddress) {
        showAlertModal('새 주소를 입력해주세요.');
        return;
      }

      try {
        const newMorningDelivery = updateMorningDelivery(newAddress);
        const data = { address: newAddress, morning_delivery: newMorningDelivery };
        // eslint-disable-next-line no-unused-vars
        const updatedRecord = await pb.collection('users').update(user.id, data);
        this.elements.modal.close();
        updateLocalStorage({
          address: newAddress,
          morning_delivery: newMorningDelivery,
        });
        showAlertModal('주소가 성공적으로 변경되었습니다.');
      } catch (error) {
        console.error('주소 변경 중 오류 발생:', error.message);
      }
    };

    const initEventListeners = () => {
      const registerButton = this.shadowRoot.querySelector('.modal__address-change');
      const closeButton = this.shadowRoot.querySelector('.modal__close');
      const inputField = this.shadowRoot.querySelector('.modal__input');

      registerButton.addEventListener('click', () => handleAddressChange(inputField));
      closeButton.addEventListener('click', () => this.elements.modal.close());

      this.elements.modal.addEventListener(
        'close',
        () => {
          registerButton.removeEventListener('click', handleAddressChange);
          closeButton.removeEventListener('click', () => this.elements.modal.close());
        },
        { once: true }
      );
    };

    const subscribeToAddressChanges = () => {
      pb.collection('users').subscribe(user.id, (e) => {
        if (
          e.record.address !== user.address ||
          e.record.morning_delivery !== user.morning_delivery
        ) {
          updateLocalStorage({
            address: e.record.address,
            morning_delivery: e.record.morning_delivery,
          });
          user.address = e.record.address;
          user.morning_delivery = e.record.morning_delivery;

          // 툴팁 내용 업데이트
          const locationTooltip = this.shadowRoot.querySelector('.location-tooltip');
          locationTooltip.innerHTML = getLocationTooltipContent();
        }
      });
    };

    setupMainModal();
    initEventListeners();
    subscribeToAddressChanges(); // 실시간 구독 시작
  }

  // 제품 검색 기능
  handleSearchProduct() {
    window.location.href = `/src/pages/product-list/?search=${this.elements.searchField.value}`;
  }

  // 유틸리티 함수: 요소 표시
  showElement(element) {
    this.clearHideTimeout(element);
    element.style.display = 'block';
  }

  // 유틸리티 함수: 요소 숨기기
  hideElement(element) {
    element.style.display = 'none';
  }

  // 유틸리티 함수: 지연 후 요소 숨기기
  hideWithDelay(element) {
    this.clearHideTimeout(element);
    const timeout = setTimeout(() => this.hideElement(element), this.DELAY);
    this.hideTimeouts.set(element, timeout);
  }

  // 유틸리티 함수: 숨김 타이머 제거
  clearHideTimeout(element) {
    const timeout = this.hideTimeouts.get(element);
    if (timeout) {
      clearTimeout(timeout);
      this.hideTimeouts.delete(element);
    }
  }
}

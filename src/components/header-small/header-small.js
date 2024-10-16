import './header-small.scss';
import { cartStore } from '@/services/cart';
import { pb } from '@/api/index';
import styles from './header-small.scss?inline';
import templateHTML from './index.html?raw';

export class headerSmall extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const template = document.createElement('template');
    template.innerHTML = templateHTML;

    const style = document.createElement('style');
    style.textContent = styles;

    this.shadowRoot.append(style, template.content.cloneNode(true));

    this.header = this.shadowRoot.querySelector('.karly-header');

    this.initElements();
    this.usingKeyboard = false;
    this.currentFocusedItem = null;
    this.hideTimeouts = new Map();
    this.DELAY = 250;
  }

  initElements() {
    this.elements = {
      categoryMenu: this.shadowRoot.querySelector('.category-menu'),
      categoryMenuButton: this.shadowRoot.querySelector('.category-menu__text'),
      menuContainer: this.shadowRoot.querySelector('.menu-container'),
      menuLists: this.shadowRoot.querySelectorAll('.menu-list__item'),
      menuItems: this.shadowRoot.querySelectorAll('.menu-list__item a'),
      locationButton: this.shadowRoot.querySelector('.user-actions__location'),
      locationTooltip: this.shadowRoot.querySelector('.location-tooltip'),
      modal: this.shadowRoot.querySelector('c-modal'),
      cartIcon: this.shadowRoot.querySelector('.user-actions__cart'),
      categoryLinks: this.shadowRoot.querySelectorAll('.category-item__link'),
      searchField: this.shadowRoot.querySelector('#product_search'),
      searchButton: this.shadowRoot.querySelector('.product_search_button'),
    };
  }

  connectedCallback() {
    this.checkAuth();
    this.setupEventListeners();
    this.setupScrollListener();
    this.updateHeaderVisibility();
    this.updateCartBadge();
    this.setActiveCategoryLink();
  }

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
      this.elements.locationButton,
      () => this.showElement(this.elements.locationTooltip),
      () => this.hideWithDelay(this.elements.locationTooltip)
    );
    this.addToggleEvents(
      this.elements.locationTooltip,
      () => this.clearHideTimeout(this.elements.locationTooltip),
      () => this.hideWithDelay(this.elements.locationTooltip)
    );

    this.elements.searchButton.addEventListener('click', this.handleSearchProduct.bind(this));
    this.elements.searchField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearchProduct.bind(this)();
    });
    document.addEventListener('cartUpdated', this.updateCartBadge.bind(this));
  }

  setupScrollListener() {
    window.addEventListener('scroll', () => {
      this.updateHeaderVisibility();
    });
  }

  updateHeaderVisibility() {
    if (window.scrollY > 242) {
      this.header.classList.add('visible');
    } else {
      this.header.classList.remove('visible');
    }
  }

  addToggleEvents(element, showCallback, hideCallback) {
    if (element) {
      element.addEventListener('mouseenter', showCallback);
      element.addEventListener('mouseleave', hideCallback);
    }
  }

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

  handleFocusOut({ target }) {
    if (target === this.elements.categoryMenuButton) {
      this.elements.categoryMenu.classList.remove('focused');
    } else if (target.closest('.menu-list__item')) {
      this.handleMenuItemBlur();
    } else if (target === this.elements.locationButton || target.closest('.location-tooltip')) {
      this.hideWithDelay(this.elements.locationTooltip);
    }
  }

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

  // 장바구니 뱃지 업데이트 메서드
  updateCartBadge(event) {
    const cartItemCount = event ? event.detail : cartStore.getCartLength();
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
    const pathname = currentUrl.pathname;

    this.elements.categoryLinks.forEach((link) => {
      link.classList.remove('__is-active');
    });

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

  checkAuth() {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    const { isAuth, user } = auth;
    const locationTooltip = this.shadowRoot.querySelector('.location-tooltip');

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

    locationTooltip.innerHTML = getLocationTooltipContent();

    const locationButton = this.shadowRoot.querySelector('.location-tooltip-button__location');
    locationButton?.addEventListener(
      'click',
      this.handleLocationRegistration.bind(this, user, getLocationTooltipContent)
    );
  }

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
        if (typeof updatedUser === 'object') {
          authData.user = { ...authData.user, ...updatedUser };
        } else {
          authData.user = { ...authData.user, address: updatedUser };
        }
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

  showElement(element) {
    if (element) {
      this.clearHideTimeout(element);
      element.style.display = 'block';
    }
  }

  hideElement(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  hideWithDelay(element) {
    if (element) {
      this.clearHideTimeout(element);
      const timeout = setTimeout(() => this.hideElement(element), this.DELAY);
      this.hideTimeouts.set(element, timeout);
    }
  }

  clearHideTimeout(element) {
    const timeout = this.hideTimeouts.get(element);
    if (timeout) {
      clearTimeout(timeout);
      this.hideTimeouts.delete(element);
    }
  }
}

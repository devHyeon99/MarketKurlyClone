import styles from './header.scss?inline';
import templateHTML from './index.html?raw';
import { createAuthLinksTemplate, createLocationTooltipTemplate } from './headerTemplates';
import { cart } from '@/services/cart';
import { getAuth } from '@/services';
import { defaultAuthData } from '@/constants';
import { pb } from '@/api';

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
    this.currentFocusedItem = null;
    this.hideTimeouts = new Map();
    this.closeTime = localStorage.getItem('topBanner');
    this.DELAY = 250;
  }

  // 쿼리 셀렉터를 사용하여 필요한 DOM 요소 초기화
  initElements() {
    const selectors = {
      locationButton: '.user-actions__location',
      locationTooltip: '.location-tooltip',
      topBanner: '.top-banner',
      topBannerCloseButton: '.top-banner__close',
      modal: 'c-modal',
      confirmModal: 'c-confirm-modal',
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
    this.elements.topBannerCloseButton.addEventListener('click', this.handleCloseBanner.bind(this));
    this.elements.searchButton.addEventListener('click', this.handleSearchProduct.bind(this));
    this.elements.searchField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearchProduct.bind(this)();
    });
    document.addEventListener('cartUpdated', this.updateCartBadge.bind(this));
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
    const { searchParams, pathname } = new URL(window.location.href);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // 1. 모든 링크의 활성 상태를 초기화합니다.
    this.elements.categoryLinks.forEach((link) => {
      link.classList.remove('__is-active');
    });

    // 2. 검색어가 있으면 아무것도 활성화하지 않고 종료합니다.
    if (search) {
      return;
    }

    // 3. 카테고리 활성화 조건을 설정 객체로 관리합니다.
    //   - 더 구체적인 조건을 위에 배치해야 합니다.
    const categoryConfig = [
      {
        // 조건: 신상품 카테고리이거나, 상품 컬렉션 페이지일 때
        condition: category === 'recent' || pathname.includes('/product-collection/'),
        href: 'recent', // '신상품' 링크의 href에 포함될 고유 문자열
      },
      {
        condition: category === 'best',
        href: 'best', // '베스트' 링크의 href에 포함될 고유 문자열
      },
      {
        condition: category === 'discount',
        href: 'discount', // '알뜰쇼핑' 링크의 href에 포함될 고유 문자열
      },
      {
        // 조건: 상품 목록 페이지이면서, 카테고리 지정이 없을 때
        condition: pathname.includes('/product-list/') && !category,
        href: '/product-list/', // '전체보기' 링크의 href
      },
    ];

    // 4. 조건에 맞는 첫 번째 설정을 찾습니다.
    const activeConfig = categoryConfig.find((config) => config.condition);

    // 5. 해당하는 링크를 찾아 활성화합니다.
    if (activeConfig) {
      const linkToActivate = Array.from(this.elements.categoryLinks).find((link) =>
        link.getAttribute('href').includes(activeConfig.href)
      );

      if (linkToActivate) {
        linkToActivate.classList.add('__is-active');
      }
    }
  }

  // 로그인 여부에 따른 조건부 렌더링
  checkAuth() {
    const { isAuth, user } = getAuth();

    // 템플릿 함수를 호출하여 HTML을 가져옴
    const authLinksHtml = createAuthLinksTemplate(isAuth, user);
    const locationTooltipHtml = createLocationTooltipTemplate(isAuth, user);

    // DOM에 렌더링
    this.shadowRoot.querySelector('.auth-links').innerHTML = authLinksHtml;
    this.shadowRoot.querySelector('.location-tooltip').innerHTML = locationTooltipHtml;

    // 이벤트 핸들러 바인딩
    if (isAuth) {
      const logOutButton = this.shadowRoot.querySelector('.auth-links__logout');
      logOutButton?.addEventListener('click', this.handleLogout.bind(this));
    }

    const locationButton = this.shadowRoot.querySelector('.location-tooltip-button__location');
    locationButton?.addEventListener('click', this.handleLocationRegistration.bind(this));
  }

  // 로그아웃 기능 메서드
  async handleLogout() {
    const confirmModal = this.elements.confirmModal;

    const userConfirmed = await confirmModal.confirm();

    if (userConfirmed) {
      pb.authStore.clear();
      localStorage.setItem('auth', JSON.stringify(defaultAuthData));
      location.reload();
    }
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
}

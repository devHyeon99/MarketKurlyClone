// 먼저, 부모 클래스인 Modal을 import 합니다.
// 파일 경로는 실제 프로젝트 구조에 맞게 조정하세요.
import { Modal } from '@/components/modal/modal.js';

export class ConfirmModal extends Modal {
  constructor() {
    // super()를 가장 먼저 호출하여 부모 클래스의 생성자를 실행합니다.
    super();

    // ConfirmModal에 필요한 요소들을 추가합니다.
    this._renderConfirmContent();
    this._attachButtonEvents();
  }

  // Promise의 resolve 함수를 저장할 내부 변수
  _resolvePromise = null;

  /**
   * 확인/취소 버튼과 메시지 영역을 생성하여 슬롯에 추가합니다.
   * @private
   */
  _renderConfirmContent() {
    // 메시지를 표시할 p 태그
    this.messageElement = document.createElement('p');
    this.messageElement.setAttribute('slot', 'body');
    this.messageElement.textContent = this.getAttribute('message') || '확인하시겠습니까?';

    // 버튼들을 감쌀 div 컨테이너
    const footerContainer = document.createElement('div');
    footerContainer.setAttribute('slot', 'footer');
    footerContainer.className = 'confirm-footer'; // 스타일링을 위한 클래스

    // 취소 버튼
    this.cancelButton = document.createElement('button');
    this.cancelButton.className = 'btn-cancel';
    this.cancelButton.textContent = this.getAttribute('cancel-text') || '취소';

    // 확인 버튼
    this.confirmButton = document.createElement('button');
    this.confirmButton.className = 'btn-confirm';
    this.confirmButton.textContent = this.getAttribute('confirm-text') || '확인';

    footerContainer.append(this.cancelButton, this.confirmButton);
    this.append(this.messageElement, footerContainer);
  }

  /**
   * 버튼 클릭 이벤트를 설정합니다.
   * @private
   */
  _attachButtonEvents() {
    this.confirmButton.addEventListener('click', () => {
      this._resolveAndClose(true);
    });

    this.cancelButton.addEventListener('click', () => {
      this._resolveAndClose(false);
    });
  }

  /**
   * 사용자의 선택(true/false)으로 Promise를 resolve하고 모달을 닫습니다.
   * @param {boolean} value - 사용자의 선택 (확인: true, 취소: false)
   * @private
   */
  _resolveAndClose(value) {
    if (this._resolvePromise) {
      this._resolvePromise(value);
    }
    this.close();
  }

  /**
   * 모달을 열고 사용자의 선택을 기다리는 Promise를 반환합니다.
   * @returns {Promise<boolean>} 사용자가 '확인'을 누르면 true, '취소'를 누르면 false를 resolve하는 Promise
   */
  confirm() {
    return new Promise((resolve) => {
      // resolve 함수를 클래스 속성에 저장해두면,
      // 버튼 이벤트 핸들러에서 접근하여 호출할 수 있습니다.
      this._resolvePromise = resolve;
      this.showModal();
    });
  }

  // --- 속성(Attribute) 변경 감지 ---

  static get observedAttributes() {
    // 부모의 속성들과 함께 새로운 속성들을 등록합니다.
    return [...super.observedAttributes, 'message', 'confirm-text', 'cancel-text'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // 부모의 attributeChangedCallback을 먼저 호출하여 부모 속성을 처리하게 합니다.
    super.attributeChangedCallback(name, oldValue, newValue);

    if (oldValue !== newValue) {
      switch (name) {
        case 'message':
          // constructor에서 생성한 messageElement가 있을 경우에만 업데이트
          if (this.messageElement) {
            this.messageElement.textContent = newValue;
          }
          break;
        case 'confirm-text':
          if (this.confirmButton) {
            this.confirmButton.textContent = newValue;
          }
          break;
        case 'cancel-text':
          if (this.cancelButton) {
            this.cancelButton.textContent = newValue;
          }
          break;
      }
    }
  }
}

customElements.define('c-confirm-modal', ConfirmModal);

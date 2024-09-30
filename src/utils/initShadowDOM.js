/**
 * Shadow DOM에 템플릿 HTML과 스타일을 초기화합니다.
 *
 * @param {ShadowRoot} shadowRoot - 컴포넌트의 this.shadowRoot
 * @param {string} templateHTML - 렌더링할 HTML 템플릿 문자열
 * @param {string} [styles=''] - 적용할 CSS 스타일 문자열 (선택)
 *
 * @example
 * initShadowDOM(this.shadowRoot, '<div class="box"></div>', '.box { color: red; }');
 */

export const initShadowDOM = (shadowRoot, templateHTML, styles = '') => {
  const template = document.createElement('template');
  template.innerHTML = templateHTML;

  const style = document.createElement('style');
  style.textContent = styles;

  shadowRoot.append(style, template.content.cloneNode(true));
};

/**
 * 템플릿 리터럴을 HTML 문자열로 반환하는 유틸 함수
 * 주로 DOM 조작이나 Shadow DOM에 삽입할 HTML을 깔끔하게 구성
 * 아래와 같이 사용하면 js 내에서도 html 코드 정렬이 깔끔하게 됨.
 *
 * @param {TemplateStringsArray} strings - 고정 문자열 배열 (템플릿 리터럴의 정적 부분)
 * @param {...any} values - 표현식의 값 (템플릿 리터럴의 동적 부분)
 * @returns {string} - 조합된 순수 HTML 문자열
 *
 * @example
 * const name = '현호';
 * const template = html`
 *   <div class="greeting">
 *     <p>Hello, ${name}!</p>
 *   </div>
 * `;
 *
 * someElement.innerHTML = template;
 */
export const html = (strings, ...values) => String.raw({ raw: strings }, ...values);

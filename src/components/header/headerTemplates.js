// 인증 상태에 따른 툴팁 HTML 생성
export function createLocationTooltipTemplate(isAuth, user) {
  if (isAuth) {
    return `
      <p class="modal-notice">배송지 변경</p>
      <div class="modal-divider"></div>
      <span class="modal-location-register__title">현재 주소</span>
      <p class="modal-location__address">${user.address}</p>
      <span class="modal-location-delivery">${user.morning_delivery ? '샛별배송' : '일반배송'}</span>
      <div class="location-tooltip-button">
        <button type="button" class="location-tooltip-button__location" aria-label="주소 변경 모달 버튼">
          주소 변경
        </button>
      </div>
    `;
  } else {
    return `
      <p class="modal-notice2"><strong>배송지를 등록</strong>하고<br />구매 가능한 상품을 확인하세요!</p>
      <div class="location-tooltip-button">
        <a href="/src/pages/login/" role="button" class="location-tooltip-button__login" aria-label="로그인 페이지로 이동">로그인</a>
      </div>
    `;
  }
}

// 인증 상태에 따른 상단 링크 HTML 생성
export function createAuthLinksTemplate(isAuth, user) {
  // getUserInfo, getAuthButton 등의 로직을 이 안에서 처리하거나 인자로 받음
  const userInfoHtml = isAuth
    ? `<span class="user-welcome">${user.name} 님</span>`
    : '<a href="/src/pages/register/">회원가입</a>';
  const authButtonHtml = isAuth
    ? '<button type="button" class="auth-links__logout">로그아웃</button>'
    : '<a href="/src/pages/login/">로그인</a>';

  return `
    ${userInfoHtml}
    <div class="divider" aria-hidden="true"></div>
    ${authButtonHtml}
    <div class="divider" aria-hidden="true"></div>
    <div class="customer-service">
      <a href="#">고객센터</a>
    </div>
  `;
}

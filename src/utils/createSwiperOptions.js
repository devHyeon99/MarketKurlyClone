export const createSwiperOptions = (type) =>
  ({
    mainBanner: {
      autoplay: { delay: 2000 },
      loop: true,
      speed: 1500,
      navigation: {
        nextEl: '#banner-next',
        prevEl: '#banner-prev',
      },
      a11y: {
        prevSlideMessage: '이전',
        nextSlideMessage: '다음',
      },
    },
    productList: (listType) => ({
      slidesPerView: 4,
      slidesPerGroup: 4,
      speed: 300,
      spaceBetween: 18,
      navigation: {
        nextEl: `#${listType}-next`,
        prevEl: `#${listType}-prev`,
        disabledClass: 'swiper-button-hidden',
      },
      a11y: {
        prevSlideMessage: '이전',
        nextSlideMessage: '다음',
      },
    }),
  })[type];

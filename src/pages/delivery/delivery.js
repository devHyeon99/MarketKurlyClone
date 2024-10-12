import './delivery.scss';
import { defineCustomElements } from '@/utils/index';
import { header } from '@/components/header/header';
import { headerSmall } from '@/components/header-small/header-small';
import { footer } from '@/components/footer/footer';

const init = () => {
  defineCustomElements([
    ['c-header', header],
    ['c-header-small', headerSmall],
    ['c-footer', footer],
  ]);
};

init();

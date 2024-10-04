import styles from './product-card-skeleton.scss?inline';
import { html, initShadowDOM } from '@/utils/';

export class ProductSkeleton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const templateHTML = html`
      <div class="product-item">
        <div class="product-item__img skeleton"></div>
        <div class="product-item__title skeleton"></div>
        <div class="price-group">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
        </div>
        <div class="product-item__reviews skeleton"></div>
      </div>
    `;

    initShadowDOM(this.shadowRoot, templateHTML, styles);
  }
}

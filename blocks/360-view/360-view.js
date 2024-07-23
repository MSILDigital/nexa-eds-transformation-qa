import ctaUtils from '../../utility/ctaUtils.js';
import utility from '../../utility/utility.js';

export default function decorate(block) {
  const [
    titleEl,
    descriptionEl,
    ctaTextEl,
    ctaLinkEl,
    ctaTargetEl,
    exteriorLabelEl,
    interiorLabelEl,
  ] = block.children;

  const title = titleEl.querySelector(':is(h1,h2,h3,h4,h5,h6)');
  title?.classList?.add('view360__title');
  const description = descriptionEl.querySelector('div')?.innerHTML;
  const cta = (ctaLinkEl) ? ctaUtils.getLink(ctaLinkEl, ctaTextEl, ctaTargetEl, 'view360__primary-btn') : null;
  const exteriorLabel = exteriorLabelEl?.textContent?.trim();
  const interiorLabel = interiorLabelEl?.textContent?.trim();

  block.innerHTML = utility.sanitizeHtml(`
    <div class="view360__container">
      <div class="view360__top-section">
        <div class="view360__left-section">
          ${(title) ? title.outerHTML : ''}
        </div>
        <div class="view360__right-section">
          ${(description) ? `<div class="view360__description">${description}</div>` : ''}
          ${(cta) ? `<div class="cta__primary">${cta.outerHTML}</div>` : ''}
        </div>
      </div>
      <div class="view360__bottom-section">
        <div class="view360__colors-wrapper">
        </div>
        <div class="view360__content">
        </div>
        <div class="view360__tabs-wrapper">
          <div class="view360__tabs">
            ${(exteriorLabel) ? `<span class="view360__tab-label view360__tab-label--active">${exteriorLabel}</span>` : ''} 
            ${(interiorLabel) ? `<span class="view360__tab-label">${interiorLabel}</span>` : ''} 
          </div>
        </div>
      </div>
    </div>
  `);

  block.querySelectorAll('.view360__tab-label').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (!tab.classList.contains('view360__tab-label--active')) {
        block.querySelector('.view360__tab-label--active')?.classList?.remove('view360__tab-label--active');
        tab.classList.add('view360__tab-label--active');
      }
    });
  });
}

import utility from '../../utility/utility.js';
import teaser from '../../utility/teaserUtils.js';
import ctaUtils from '../../utility/ctaUtils.js';

export default function decorate(block) {
  function getImmersiveTeaser() {
    const [
      imageEl,
      altTextEl,
      titleEl,
      subtitleEl,
      descriptionEl,
      ctaTextEl,
      ctaLinkEl,
      ctaTargetEl,
    ] = block.children;
    const image = imageEl?.querySelector('picture');
    if (image) {
      const img = image.querySelector('img');
      img.setAttribute('width', '100%');
      img.removeAttribute('height');
      const alt = altTextEl?.textContent?.trim() || 'image';
      img.setAttribute('alt', alt);
    }
    const title = titleEl?.querySelector(':is(h1,h2,h3,h4,h5,h6)');
    title?.classList?.add('immersive__title');
    const subtitle = subtitleEl?.textContent?.trim();
    const description = descriptionEl?.querySelector('div')?.innerHTML;
    const cta = (ctaLinkEl) ? ctaUtils.getLink(ctaLinkEl, ctaTextEl, ctaTargetEl) : null;

    return {
      image,
      title,
      subtitle,
      description,
      cta,
    };
  }

  const immersiveTeaser = getImmersiveTeaser();
  const teaserEl = block.children[8];
  let teaserObj;
  if (teaserEl?.innerHTML) {
    teaserObj = teaser.getTeaser(teaserEl);
    teaserObj.classList.add('teaser-wrapper');
  }
  immersiveTeaser.cta?.classList.add('btn-title');
  const immersiveTeaserHtml = utility.sanitizeHtml(`
        ${(immersiveTeaser.image) ? `<div class="immersive__image">${immersiveTeaser.image.outerHTML}</div>` : ''}
         <div class="immersive__content">
           ${(immersiveTeaser.title) ? `${immersiveTeaser.title.outerHTML}` : ''}
           ${(immersiveTeaser.subtitle) ? `<p class="immersive__subtitle">${immersiveTeaser.subtitle}</p>` : ''}
           ${(immersiveTeaser.description) ? `<div class="immersive__description">${immersiveTeaser.description}</div>` : ''}
           ${(immersiveTeaser.cta) ? `<div class="immersive__action"><div class="cta__primary">${immersiveTeaser.cta.outerHTML}</div></div>` : ''}
          </div>
    `);

  block.innerHTML = utility.sanitizeHtml(`
    <div class="immersive__wrapper right-seperator">
        ${immersiveTeaserHtml}
        ${(teaserObj?.innerHTML) ? teaserObj.outerHTML : ''}
    </div>
  `);
}

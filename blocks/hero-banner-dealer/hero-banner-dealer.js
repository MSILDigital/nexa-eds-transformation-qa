import { moveInstrumentation } from '../../scripts/scripts.js';
import utility from '../../utility/utility.js';

export default function decorate(block) {
  function getHeroBannerDealer() {
    const [
      imageEl,
      pretitleEl,
      descriptionEl,
      ...ctaEls
    ] = block.children;

    const image = imageEl?.querySelector('picture');
    if (image) {
      const img = image.querySelector('img');
      img.removeAttribute('width');
      img.removeAttribute('height');
      const altTextEl = imageEl.querySelector('figcaption');
      const alt = altTextEl?.textContent?.trim() || 'image';
      img.setAttribute('alt', alt);
      img.classList.add('hero-banner-dealer__image-container');
    }

    const pretitle = pretitleEl?.textContent?.trim() || '';
    const description = Array.from(descriptionEl.querySelectorAll('p')).map((p) => p.outerHTML).join('');
    const ctas = Array.from(ctaEls).map((ctaEl) => {
      const [ctaTextEl, ctaLinkEl] = ctaEl.children;
      const ctaText = ctaTextEl?.textContent?.trim() || '';
      const ctaLink = ctaLinkEl?.querySelector('a')?.href || '#';
      const li = document.createElement('li');
      li.innerHTML = `<a href="${ctaLink}" class="cta-text">${ctaText}</a>`;
      moveInstrumentation(ctaEl, li);
      return li.outerHTML;
    });

    return {
      image, pretitle, description, ctas,
    };
  }
const heroBannerDealer = getHeroBannerDealer();

  block.innerHTML = utility.sanitizeHtml(`
    <div class="hero-banner-dealer__container right-seperator">
      <div class="hero-banner-dealer__container">
        <div class="hero-banner-dealer__section">
          <div class="hero-banner-dealer__image-container">
            ${(heroBannerDealer.image) ? heroBannerDealer.image.outerHTML : ''}
            <div class="hero-banner-dealer__overlay">
              <div class="hero-banner-dealer__content">
                <p class="pre-title">${heroBannerDealer.pretitle}</p>
              </div>
              <div class="hero-banner-dealer__description">${heroBannerDealer.description}</div>
              <div class="hero-banner-dealer__action">
                <div class="scroll-bar"></div>
                <ul class="list-container">
                  ${heroBannerDealer.ctas.join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  function getCTAHeight() {
    if (window.matchMedia("(min-width: 999px)").matches) {
      return 64; // Height for desktop
    } else {
      return 35; // Height for mobile
    }
  }

  function setupScrollHighlight() {
    const ctaElements = document.querySelectorAll('.hero-banner-dealer__action .cta-text');
    const scrollBar = document.querySelector('.hero-banner-dealer__action .scroll-bar');

    // Initial highlight setup
    function highlightFirstCTA() {
      if (ctaElements.length > 0) {
        ctaElements[0].classList.add('highlight');
        const ctaHeight = getCTAHeight();
        scrollBar.style.height = `${ctaHeight}px`;
        scrollBar.style.top = '0';
        scrollBar.classList.add('highlight');
      }
    }

    // Call highlightFirstCTA after DOM update
    requestAnimationFrame(highlightFirstCTA);

    // Add hover effects
    ctaElements.forEach((cta) => {
      cta.addEventListener('mouseover', () => {
        ctaElements.forEach((ctaElement) => {
          ctaElement.classList.remove('highlight');
        });
        cta.classList.add('highlight');

        const ctaIndex = Array.from(ctaElements).indexOf(cta);
        const ctaHeight = getCTAHeight();
        const ctaOffsetTop = ctaIndex * ctaHeight;
        scrollBar.style.height = `${ctaHeight}px`;
        scrollBar.style.top = `${ctaOffsetTop}px`;
      });
    });
  }

  // Call the function to set up scroll highlighting
  setupScrollHighlight();

  // Re-run the highlight setup on resize to adjust heights dynamically
  window.addEventListener('resize', setupScrollHighlight);
}
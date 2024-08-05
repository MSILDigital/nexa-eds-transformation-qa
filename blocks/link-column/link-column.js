import { moveInstrumentation } from '../../scripts/scripts.js';
import utility from '../../utility/utility.js';

export default function decorate(block) {
  const [titleEl, orientationEl, ...ctasEl] = block.children;

  let titleHtml = '';
  const heading = titleEl?.querySelector('h1, h2, h3, h4, h5, h6') || '';
  if (heading) {
    heading?.classList?.add('accordian-item', 'link-column__heading');
    titleHtml = heading.outerHTML;
  } else {
    const titleText = titleEl?.textContent?.trim();
    if (titleText) {
      titleHtml = `
        <p class="accordiant-item link-column__heading">${titleText}</p>
      `;
    }
  }

  const orientation = orientationEl?.textContent?.trim() || 'link-column-vertical';

  let ctaElementsHTML = '';
  if (ctasEl.length > 0) {
    ctaElementsHTML = ctasEl.map((element) => {
      const [ctaTextEl, linkEl, targetEL] = element.children;
      const ctaText = ctaTextEl?.textContent?.trim() || '';
      const link = linkEl?.querySelector('a')?.href || '';
      const target = targetEL?.textContent?.trim() || '_self';
      const li = document.createElement('li');
      moveInstrumentation(element, li);
      li.innerHTML = `<a href="${link}" target="${target}" aria-label="${ctaText}">${ctaText}</a>`;
      return li.outerHTML;
    }).join('');
  }

  block.innerHTML = utility.sanitizeHtml(
    `<div class="link-grid-column ${orientation}">
      ${titleHtml}
      <ul class="content links-container accordian-content">
        ${ctaElementsHTML || ''}
      </ul>
    </div>`,
  );
}

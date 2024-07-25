export default function decorate(block) {
  const [titleEl, ...ctasEl] = block.children;

  const title = titleEl?.querySelector('h1, h2, h3, h4, h5, h6') || '';
  title?.classList?.add('accordian-item');

  let ctaElementsHTML = '';
  if (ctasEl.length > 0) {
    ctaElementsHTML = ctasEl.map((element) => {
      const [ctaTextEl, linkEl] = element.children;
      const ctaText = ctaTextEl?.textContent?.trim() || '';
      const link = linkEl?.querySelector('a')?.href || '';

      return `<li><a href="${link}" target="_self" aria-label="${ctaText}">${ctaText}</a></li>`;
    }).join('');
  }

  block.innerHTML = `<div class="link-grid-column">
                           ${title.outerHTML || ''}
                           <ul class="content links-container">
                             ${ctaElementsHTML || ''}
                           </ul>
                         </div>`;
}

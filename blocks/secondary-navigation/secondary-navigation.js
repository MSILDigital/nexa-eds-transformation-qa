import { moveInstrumentation } from '../../scripts/scripts.js';
import utility from '../../utility/utility.js';

export default function decorate(block) {
  const [imageEl, altTextEl, logoLinkEl, ...ctasEl] = block.children;
  const picture = imageEl?.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    img.removeAttribute('width');
    img.removeAttribute('height');
    const alt = altTextEl?.textContent?.trim() || 'image';
    img.setAttribute('alt', alt);
  }
  const logoLink = logoLinkEl?.querySelector('a')?.href || '';

  const ctaElements = ctasEl.map((element, index) => {
    const [ctaTextEl, linkEl] = element.children;
    const ctaText = ctaTextEl?.textContent?.trim() || '';
    const link = linkEl?.querySelector('.button-container a')?.href;

    const newButton = document.createElement('a');
    newButton.href = link;
    newButton.innerHTML = `<p>${ctaText}</p>`;

    if (index === 0) {
      newButton.classList.add('nav-button', 'active');
    } else {
      newButton.classList.add('nav-button');
    }

    element.innerHTML = '';
    element.appendChild(newButton);

    moveInstrumentation(element, newButton);

    return element.innerHTML;
  }).join('');

  function setupNavButtons(navButtons) {
    navButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        navButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }

  block.innerHTML = utility.sanitizeHtml(`
    <div class="secondary-navbar-container">
        <nav class="secondary-navbar">
            <a href="${logoLink}" class="logo-container">
            ${imageEl.innerHTML} 
            </a>
            <div class="buttons-container">
                ${ctaElements}
            </div>
        </nav>
    </div>
    `);
  const navbarbuttons = block.querySelectorAll('.nav-button');
  setupNavButtons(navbarbuttons);

  let lastScrollTop = 0;
  const section = document.querySelector('.secondary-navigation').closest('.section');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const navbar = block.querySelector('.secondary-navbar-container');
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionBottom = sectionTop + sectionHeight;

    if (currentScroll < sectionTop) {
      navbar.style.visibility = 'visible';
      navbar.style.position = 'relative';
    } else if (currentScroll >= sectionTop && currentScroll < sectionBottom) {
      navbar.style.visibility = 'visible';
      navbar.style.position = 'fixed';

      if (lastScrollTop <= currentScroll) {
        navbar.style.top = '0';
      } else {
        navbar.style.visibility = 'hidden';
      }
    } else {
      navbar.style.visibility = 'hidden';
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
}

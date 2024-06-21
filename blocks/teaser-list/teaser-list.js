import utility from '../../utility/utility.js';
import teaser from '../../utility/teaserUtils.js';

export default function decorate(block) {
  // Toggle Focused Class Method
  function toggleFocusedClass() {
    const cards = block.querySelectorAll('.teaser__cards .teaser__card');
    cards[0].classList.add('teaser__card--focused', 'teaser__left');
    cards[1].classList.add('teaser__card--unfocused', 'teaser__right');

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((el) => {
          el.classList.remove('teaser__card--focused');
          el.classList.add('teaser__card--unfocused');
        });
        card.classList.add('teaser__card--focused');
        card.classList.remove('teaser__card--unfocused');
      });
    });

    const teaserCards = block.querySelectorAll('.teaser__card');

    teaserCards.forEach((teaserCard) => {
      teaserCard.addEventListener('click', () => {
        teaserCards.forEach((c) => c.classList.remove('teaser__card--focused'));
        teaserCard.classList.add('teaser__card--focused');

        const focusedTeaserCard = this.block.querySelector('.teaser__card--focused');

        if (focusedTeaserCard) {
          const container = focusedTeaserCard.closest('.teaser__cards');
          const cardOffsetLeft = focusedTeaserCard.offsetLeft;
          const containerOffsetLeft = container.offsetLeft;
          const scrollLeft = cardOffsetLeft - containerOffsetLeft;
          const containerWidth = container.clientWidth;
          const maxScrollLeft = Math.min(scrollLeft, container.scrollWidth - containerWidth);

          container.scrollTo({
            left: maxScrollLeft,
            behavior: 'smooth',
          });
        }
      });
    });
  }
  // Toggle Focused Class Method End

  const [titleEl, styleEl, ...teaserListEl] = block.children;

  const style = styleEl?.textContent?.trim().split(',');
  block.classList.add(...style);
  const commonTitle = titleEl?.textContent?.trim() || '';
  const teasers = teaserListEl.map((card) => {
    const teaserObj = teaser.getTeaser(card);
    utility.mobileLazyLoading(teaserObj, '.teaser__image img');
    return teaserObj.outerHTML;
  });

  const newHtml = `
    <div class="container">
        <div class="row">
            <div class="col-lg-6 col-sm-8 col-sm-10">
                <h2 class="text-color">
                    ${commonTitle}
                </h2>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-12">
                <div class="teaser__cards">
                     ${teasers.join('')}
                </div>
            </div>
        </div>
    </div>
    `;

  block.innerHTML = '';
  block.insertAdjacentHTML('beforeend', utility.sanitizeHtml(newHtml));
  toggleFocusedClass();
}

import TabUtils from '../../utility/tabsUtils.js';
import utility from '../../utility/utility.js';

function createHotspotsHTML(hotspotsEl) {
  return hotspotsEl
    .map((point) => {
      // Assuming each el is structured as a <div> with three <p> elements
      const [topPercent, leftPercent, title, description] = Array.from(
        point.querySelectorAll('p'),
      ).map((p) => p?.textContent?.trim() || '');

      // Check if topPercent or leftPercent is '0'
      if (topPercent === undefined || leftPercent === undefined || (topPercent === '0' && leftPercent === '0')) {
        return ''; // Return an empty string for invalid positions
      }
      return `
      <div class="circle open-top" style="top: ${topPercent}%; left: ${leftPercent}%">
        <div class="text-container">
          <div class ="hotspot__title">
          ${title}
          </div>
          <div class ="hotspot__description">
           ${description}
          </div>

        
        </div>
      </div>
    `;
    })
    .join('');
}

function generateHighlightItemHTML(highlightItem, index) {
  const [titleEl, subtitleEl, , imageEl, ...hotspotsEl] = highlightItem.children;

  const hotspotsHTML = createHotspotsHTML(hotspotsEl);

  const image = imageEl?.querySelector('picture');
  if (image) {
    const img = image.querySelector('img');
    const alt = image.querySelector('img').alt || 'Image Description';
    img.classList.add('hotspot-img');
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.setAttribute('alt', alt);
  }

  const subtitle = subtitleEl?.textContent?.trim() || '';
  if (titleEl) {
    titleEl.classList.add('title');
  }

  const newHTML = utility.sanitizeHtml(`
        <div class="text-section">
            ${titleEl ? titleEl.outerHTML : ''}
        <div class="description">
            <p>${subtitle}</p>
          </div>
        </div>
        <div class="hotspots-wrapper">
          <div class="hotspots">
            ${image ? image.outerHTML : ''}
            ${hotspotsHTML || ''}
          </div>
        </div>  
    `);

  highlightItem.classList.add('safetyTabItem', `switch-index-${index}`);
  highlightItem.innerHTML = newHTML;
  return highlightItem.outerHTML;
}

function initializeHotspotExpansion(block) {
  const circles = block.querySelectorAll('.circle');

  // Function to close all expanded hotspots
  function closeAllHotspots(currentCircle) {
    circles.forEach((circle) => {
      if (circle !== currentCircle && circle.classList.contains('moved')) {
        circle.style.top = circle.dataset.originalTop;
        circle.style.left = circle.dataset.originalLeft;
        const lines = circle.parentElement.querySelectorAll(`.line[data-circle="${circle.dataset.circle}"]`);
        lines.forEach((line) => line.remove());
        circle.querySelector('.text-container').style.display = 'none';
        circle.classList.remove('moved');
      }
    });
  }

  // Function to draw lines from old position to new position
  function drawLines(circle, oldRect, newRect, containerRect, isMobile) {
    if (isMobile) {
      // Draw horizontal line
      const horizontalLine = document.createElement('div');
      horizontalLine.classList.add('line', 'horizontal-line');
      horizontalLine.style.top = `${oldRect.top - containerRect.top + oldRect.height / 2}px`;

      if (oldRect.left < newRect.left) {
        horizontalLine.style.left = `${oldRect.left + oldRect.width - containerRect.left}px`;
        horizontalLine.style.width = `${Math.abs(newRect.left - oldRect.left - oldRect.width + newRect.width / 2 - 3)}px`;
        horizontalLine.dataset.circle = circle.dataset.circle;
      } else if (oldRect.left === newRect.left) {
        horizontalLine.style.left = '0';
        horizontalLine.style.width = '0';
      } else {
        horizontalLine.style.left = `${newRect.left - containerRect.left + 5}px`;
        horizontalLine.style.width = `${Math.abs(newRect.left - oldRect.left - oldRect.width + newRect.width / 2 - 3)}px`;
        horizontalLine.dataset.circle = circle.dataset.circle;
      }

      // Draw vertical line
      const verticalLine = document.createElement('div');
      verticalLine.classList.add('line', 'vertical-line');
      verticalLine.style.left = `${newRect.left - containerRect.left + 5}px`;
      verticalLine.style.top = `${-68}px`;
      verticalLine.style.height = `${Math.abs(oldRect.bottom - newRect.bottom - 0.5)}px`;
      verticalLine.dataset.circle = circle.dataset.circle;

      circle.parentElement.appendChild(horizontalLine);
      circle.parentElement.appendChild(verticalLine);
    } else {
      // Draw vertical line
      const verticalLine = document.createElement('div');
      verticalLine.classList.add('line', 'vertical-line');
      verticalLine.style.left = `${oldRect.left - containerRect.left + 5 + 12}px`;
      verticalLine.style.top = `${-68}px`;
      verticalLine.style.height = `${oldRect.bottom - containerRect.top + 68}px`;
      verticalLine.dataset.circle = circle.dataset.circle;

      circle.parentElement.appendChild(verticalLine);
    }
  }

  // Add click event listener to each circle
  circles.forEach((circle) => {
    circle.addEventListener('click', function handleClick() {
      const rect = this.getBoundingClientRect();
      const containerRect = this.parentElement.getBoundingClientRect();
      const textContainer = this.querySelector('.text-container');

      // Close any other expanded hotspots
      closeAllHotspots(this);

      if (this.classList.contains('moved')) {
        // Move back to original position and remove lines
        this.style.top = this.dataset.originalTop;
        this.style.left = this.dataset.originalLeft;
        const lines = this.parentElement.querySelectorAll(`.line[data-circle="${this.dataset.circle}"]`);
        lines.forEach((line) => line.remove());
        textContainer.style.display = 'none';
        this.classList.remove('moved');
      } else {
        // Save original position
        if (!this.dataset.originalTop) {
          this.dataset.originalTop = this.style.top;
        }
        if (!this.dataset.originalLeft) {
          this.dataset.originalLeft = this.style.left;
        }
        this.dataset.circle = `${Math.random().toString(36).substr(2, 9)}`;

        const isMobile = window.matchMedia('(max-width: 400px)').matches;
        const isTablet = window.matchMedia('(min-width: 401px) and (max-width: 999px)').matches;
        let newLeft;

        if (isMobile) {
          // Center position for mobile
          newLeft = '20%';
        } else if (isTablet) {
          newLeft = '40%';
        } else {
          newLeft = `${rect.left - containerRect.left + 12}px`;
        }

        // Move circle to the new position
        const newTop = 'calc(0% - 68px - 10px)';
        this.style.top = newTop;
        this.style.left = newLeft;
        textContainer.style.top = '0';
        textContainer.style.left = '15px';

        const newRect = this.getBoundingClientRect();

        drawLines(this, rect, newRect, containerRect, isMobile || isTablet);

        this.classList.add('moved');
        textContainer.style.display = 'block';
      }
    });
  });

  // Add resize event listener to window
  window.addEventListener('resize', () => closeAllHotspots(null));
}

export default function decorate(block) {
  const blockClone = block.cloneNode(true);
  const highlightItemListElements = Array.from(block.children);
  const highlightItemListElementsClone = Array.from(blockClone.children);

  const highlightItemsHTML = highlightItemListElements
    .map((highlightItem, index) => generateHighlightItemHTML(highlightItem, index))
    .join('');
  const switchListHTML = TabUtils.generateSwitchListHTML(
    highlightItemListElementsClone,
    (highlightItem) => {
      const [, , tabNameEl] = highlightItem.children;
      return tabNameEl?.textContent?.trim() || '';
    },
  );

  block.innerHTML = utility.sanitizeHtml(`
    <div class="safetyTabItems-container">${highlightItemsHTML}</div>
    ${switchListHTML}`);

  TabUtils.setupTabs(block, 'safetyTabItem');

  initializeHotspotExpansion(block);

  return block;
}

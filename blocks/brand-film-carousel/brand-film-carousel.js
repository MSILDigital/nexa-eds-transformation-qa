import { fetchPlaceholders } from '../../scripts/aem.js';
import carouselUtils from '../../utility/carouselUtils.js';
import utility from '../../utility/utility.js';

export default async function decorate(block) {
  const [titleEl, subTitleEl, descriptionEl, thumbnailEl, ...videosEl] = block.children;
  const { publishDomain } = await fetchPlaceholders();

  const title = titleEl.querySelector(':is(h1,h2,h3,h4,h5,h6');
  title?.classList?.add('brand-film__title');
  const subTitle = subTitleEl.textContent?.trim();
  const description = Array.from(descriptionEl.querySelectorAll('p')).map((el) => {
    el.classList.add('brand-film__description-text');
    return el.outerHTML;
  }).join('');
  const thumbnail = thumbnailEl.querySelector('img')?.src;
  const videos = videosEl.map((videoEl, index) => {
    const [videoPathEl] = videoEl.children;
    const path = videoPathEl?.querySelector('a')?.textContent?.trim();
    videoEl.classList?.add('brand-film__video-container');
    videoEl.innerHTML = `
      <video class="brand-film__video" src="${publishDomain + path}" poster=${thumbnail} width="100%" playsinline preload="none">
      </video>
      <span class="brand-film__play-btn"></span>
    `;
    return videoEl.outerHTML;
  });

  block.innerHTML = utility.sanitizeHtml(`
    <div class="brand-film__container">
      ${(description) ? `<div class="brand-film__description">${description}</div>` : ''}
      <div class="brand-film__wrapper">
        <div class="brand-film__asset">
          <div class="brand-film__actions">
            <button class="brand-film__fullscreen-btn">Full Screen</button>
            <button class="brand-film__pip-btn">Pip</button>
          </div>
          <div class="brand-film__close-btn"></div>
          <div class="brand-film__slides brand-film__video--paused">
            ${videos.join('')}
          </div>
        </div>
      </div>
      <div class="brand-film__content">
        <div class="brand-film__info">
          ${(title) ? title.outerHTML : ''}
          ${(subTitle) ? `<p class="brand-film__subtitle">${subTitle}</p>` : ''}
        </div>
        <div class="brand-film__navigation-wrapper">
        </div>
      </div>
    </div>
  `);

  let isEnded = false;
  const onChange = (currentSlide, targetSlide, direction) => {
    const currentVideo = currentSlide.querySelector('video');
    currentVideo?.pause();
    const video = targetSlide.querySelector('video');
    if (document.pictureInPictureElement) {
      video?.requestPictureInPicture();
    }
    video?.play().then(() => {
      if (direction !== 0) {
        currentVideo.currentTime = 0;
      }
    });
  };

  const controller = carouselUtils.init(
    block.querySelector('.brand-film__container'),
    'brand-film__slides',
    'fade',
    {
      onChange,
      onReset: onChange,
      showArrows: false,
      navigationContainerClassName: 'brand-film__navigation-wrapper',
    },
  );

  let isPlayed = false;
  const initPlay = () => {
    if (!isPlayed) {
      block.querySelectorAll('.brand-film__video-container video')?.forEach((vd) => {
        vd.removeAttribute('preload');
      });
      isPlayed = true;
    }
  };

  block.querySelectorAll('.brand-film__video-container')?.forEach((el) => {
    const video = el.querySelector('video');
    if (video) {
      el.addEventListener('click', () => {
        isEnded = false;
        if (video.paused) {
          video.play().then(() => {
            initPlay();
          });
        } else {
          video?.pause();
        }
      });
      video.addEventListener('ended', () => {
        isEnded = true;
        block.querySelector('.brand-film__slides').classList.remove('brand-film__video--paused');
        if (!controller.next()) {
          controller.reset();
        }
      });
      video.addEventListener('playing', () => {
        isEnded = false;
        if (!block.querySelector('.carousel__slide--active video').paused) {
          block.querySelector('.brand-film__slides').classList.remove('brand-film__video--paused');
        }
        video.removeAttribute('poster');
        initPlay();
      });
      video.addEventListener('pause', () => {
        isEnded = (parseFloat(video.currentTime) === parseFloat(video.duration));
        if (!isEnded && block.querySelector('.carousel__slide--active video').paused) {
          block.querySelector('.brand-film__slides').classList.add('brand-film__video--paused');
        }
      });
      video.addEventListener('waiting', () => {
        block.querySelector('.brand-film__slides').classList.remove('brand-film__video--paused');
      });
    }
  });

  let hideCloseBtn;
  const controlHandler = () => {
    clearTimeout(hideCloseBtn);
    block.querySelector('.brand-film__wrapper--fullscreen')?.classList?.add('brand-film__wrapper--fullscreen-controls');
    hideCloseBtn = setTimeout(() => {
      block.querySelector('.brand-film__wrapper--fullscreen')?.classList?.remove('brand-film__wrapper--fullscreen-controls');
    }, 3000);
  };

  const mouseDrag = {
    handleDrag: (e) => {
      const assetContainer = block.querySelector('.brand-film__asset');
      const size = assetContainer.getBoundingClientRect();
      assetContainer.style.left = `${e.clientX - size.width / 2}px`;
      assetContainer.style.top = `${e.clientY - size.height / 2}px`;
    },
    removeListeners: () => {
      document.removeEventListener('mousemove', mouseDrag.handleDrag);
      document.removeEventListener('mouseup', mouseDrag.removeListeners);
    },
    initDrag: () => {
      document.addEventListener('mouseup', mouseDrag.removeListeners);
      document.addEventListener('mousemove', mouseDrag.handleDrag);
    },
    reset: () => {
      block.querySelector('.brand-film__slides').removeEventListener('mousedown', mouseDrag.initDrag);
    },
    apply: () => {
      mouseDrag.reset();
      block.querySelector('.brand-film__slides').addEventListener('mousedown', mouseDrag.initDrag);
    },
  };

  const touchDrag = {
    handleDrag: (e) => {
      e.preventDefault();
      const assetContainer = block.querySelector('.brand-film__asset');
      const size = assetContainer.getBoundingClientRect();
      assetContainer.style.left = `${e.touches[0].clientX - size.width / 2}px`;
      assetContainer.style.top = `${e.touches[0].clientY - size.height / 2}px`;
    },
    removeListeners: () => {
      document.removeEventListener('touchmove', touchDrag.handleDrag);
      document.removeEventListener('touchend', touchDrag.removeListeners);
    },
    initDrag: () => {
      document.addEventListener('touchend', touchDrag.removeListeners);
      document.addEventListener('touchmove', touchDrag.handleDrag, { passive: false });
    },
    reset: () => {
      block.querySelector('.brand-film__slides').removeEventListener('touchstart', touchDrag.initDrag);
    },
    apply: () => {
      touchDrag.reset();
      block.querySelector('.brand-film__slides').addEventListener('touchstart', touchDrag.initDrag);
    },
  };

  const resetPip = (wrapper, assetContainer) => {
    wrapper.classList.remove('brand-film__wrapper--pip');
    assetContainer.style.left = null;
    assetContainer.style.top = null;
    mouseDrag.reset();
    touchDrag.reset();
  };

  const resetFullScreen = () => {
    const wrapper = block.querySelector('.brand-film__wrapper--fullscreen');
    wrapper?.classList?.remove('brand-film__wrapper--fullscreen');
    wrapper?.classList?.remove('brand-film__wrapper--fullscreen-controls');
    wrapper?.removeEventListener('mousemove', controlHandler);
    clearTimeout(hideCloseBtn);
  };

  block.querySelector('.brand-film__fullscreen-btn')?.addEventListener('click', async () => {
    const el = block.querySelector('.brand-film__wrapper');
    if (el) {
      if (document.pictureInPictureEnabled && document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (el.classList.contains('brand-film__wrapper--pip')) {
        resetPip(el, el.querySelector('.brand-film__asset'));
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
        resetFullScreen();
      } else if (el.requestFullscreen) {
        el.classList.add('brand-film__wrapper--fullscreen', 'brand-film__wrapper--fullscreen-controls');
        const options = { navigationUI: 'hide' };
        el.requestFullscreen(options).then(() => {
          hideCloseBtn = setTimeout(() => {
            block.querySelector('.brand-film__wrapper--fullscreen')?.classList?.remove('brand-film__wrapper--fullscreen-controls');
          }, 3000);
          el.addEventListener('mousemove', controlHandler);
        });
      }
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      resetFullScreen();
    }
  });

  block.querySelector('.brand-film__close-btn')?.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      resetFullScreen();
    } else {
      const wrapper = block.querySelector('.brand-film__wrapper');
      wrapper.classList.remove('brand-film__wrapper--pip');
      resetPip(wrapper, wrapper.querySelector('.brand-film__asset'));
    }
  });

  block.querySelector('.brand-film__pip-btn')?.addEventListener('click', async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      resetFullScreen();
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      block.querySelector('.brand-film__slides .carousel__slide--active video').requestPictureInPicture();
    } else {
      const wrapper = block.querySelector('.brand-film__wrapper');
      if (wrapper.classList.contains('brand-film__wrapper--pip')) {
        resetPip(wrapper, wrapper.querySelector('.brand-film__asset'));
      } else {
        wrapper.classList.add('brand-film__wrapper--pip');
        mouseDrag.apply();
        touchDrag.apply();
      }
    }
  });
}

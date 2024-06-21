const utility = {
  mobileLazyLoading(element, imgSelector) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const imgElement = element.querySelector(imgSelector);
    if (isMobile && imgElement) {
      imgElement.setAttribute('loading', 'lazy');
    } else if (!isMobile && imgElement) {
      imgElement.setAttribute('loading', 'eager');
    }
  },
  isInternalLink(href) {
    return !/^https?:\/\//i.test(href);
  },
  sanitizeHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.innerHTML;
  },
};

export default utility;

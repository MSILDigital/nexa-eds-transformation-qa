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
  /**
     * Format Price to Lakhs.
     */
  formatToLakhs(num) {
    if (num >= 100000) {
      const lakhs = (num / 100000).toFixed(2);
      return `${lakhs}`;
    }
    return num.toString();
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

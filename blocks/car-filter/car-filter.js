import { fetchPlaceholders } from '../../scripts/aem.js';
import utility from '../../utility/utility.js';

export default async function decorate(block) {
  const [
    titleEl,
    subtitleEl,
    priceTextEl,
    selectVariantEl,
    filterSelectEl,
  ] = block.children;

  const { publishDomain } = await fetchPlaceholders();

  const title = titleEl?.textContent?.trim();
  const subtitle = subtitleEl?.textContent?.trim();
  const priceText = priceTextEl?.textContent?.trim();
  const componentVariation = selectVariantEl?.textContent?.trim();
  const filterList = filterSelectEl?.textContent?.trim();

  function carModelInfo(result) {
    const cars = result.data.carModelList.items;

    if (!Array.isArray(cars) || cars.length === 0) {
      return null;
    }

    const newContainer = document.createElement('div');
    newContainer.classList.add('filter-cars');

    const carFiltersContainer = document.createElement('div');
    carFiltersContainer.classList.add('car-filter-list');

    const carCardsContainer = document.createElement('div');
    carCardsContainer.classList.add('card-list');

    const carCardsWithTeaser = document.createElement('div');
    carCardsWithTeaser.classList.add('card-list-teaser');
    carCardsWithTeaser.append(carCardsContainer);
    newContainer.appendChild(carFiltersContainer);

    const textElement = document.createElement('div');
    textElement.classList.add('filter-text');
    newContainer.appendChild(textElement);

    const titleElement = document.createElement('div');
    titleElement.classList.add('title');
    titleElement.textContent = title;
    textElement.appendChild(titleElement);

    const subtitleElement = document.createElement('div');
    subtitleElement.classList.add('subtitle');
    subtitleElement.textContent = subtitle;
    textElement.appendChild(subtitleElement);

    newContainer.append(carCardsWithTeaser);

    let selectedFilter = 'All';
    const filters = {};
    const filterTypes = filterList.split(',');

    filterTypes.forEach((type) => {
      filters[type] = new Set();
    });

    cars.forEach((car) => {
      filterTypes.forEach((type) => {
        if (car && Array.isArray(car[type])) {
          car[type].forEach((option) => {
            if (typeof option === 'string') {
              filters[type].add(option);
            } else if (Array.isArray(option)) {
              option.forEach((opt) => filters[type].add(opt));
            }
          });
        } else if (car && typeof car[type] === 'string') {
          filters[type].add(car[type]);
        }
      });
    });

    Object.keys(filters).forEach((filterType) => {
      filters[filterType] = [...filters[filterType]];
    });

    let unifiedFilterOptions;

    if (componentVariation === 'arena-variant') {
      unifiedFilterOptions = [...new Set(filterTypes.flatMap((type) => filters[type]))];
    } else {
      unifiedFilterOptions = ['All', ...new Set(filterTypes.flatMap((type) => filters[type]))];
    }

    function updateFilterStyles() {
      carFiltersContainer.querySelectorAll('.filter').forEach((filter) => {
        filter.classList.toggle('selected', filter.textContent === selectedFilter);
      });
    }

    function priceFormatting(price) {
      if (componentVariation === 'arena-variant') {
        return utility.formatToLakhs(price);
      }
      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      });
      return formatter.format(price);
    }

    function fetchPrice(variantCode, priceElement, priceTextElement, defaultPrice) {
      const formattedPrice = defaultPrice ? priceFormatting(defaultPrice) : 'Not available';
      priceElement.textContent = formattedPrice;
      priceTextElement.textContent = priceText;
    }

    function renderCards(carsToRender) {
      carCardsContainer.innerHTML = '';

      carsToRender.forEach((car) => {
        const card = document.createElement('div');
        card.classList.add('card');

        if (componentVariation === 'arena-variant') {
          const cardLogoImage = document.createElement('div');
          cardLogoImage.classList.add('card-logo-image');

          const logoImg = document.createElement('img');
          // eslint-disable-next-line
          logoImg.src = car.carLogoImage._publishUrl;
          logoImg.alt = car.logoImageAltText;
          cardLogoImage.appendChild(logoImg);
          card.appendChild(cardLogoImage);
        }

        const cardImage = document.createElement('div');
        cardImage.classList.add('card-image');

        const img = document.createElement('img');
        // eslint-disable-next-line
        img.src = car.carImage._publishUrl;
        img.alt = car.altText;
        cardImage.appendChild(img);

        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');

        const heading = document.createElement('h3');
        heading.classList.add('card-title');
        heading.textContent = car.carName;
        cardContent.appendChild(heading);

        const description = document.createElement('p');
        description.classList.add('card-description');
        description.textContent = car.fuelOptions.join(' / ');

        cardContent.appendChild(description);
        const priceTextElement = document.createElement('p');
        priceTextElement.classList.add('card-price-text');
        cardContent.appendChild(priceTextElement);
        const priceElement = document.createElement('p');
        priceElement.classList.add('card-price');
        cardContent.appendChild(priceElement);

        fetchPrice(car.modelId, priceElement, priceTextElement, car.exShowroomPrice);

        card.appendChild(cardImage);
        card.appendChild(cardContent);

        carCardsContainer.appendChild(card);
      });
    }

    function filterCards() {
      const filteredCars = cars.filter((car) => {
        if (selectedFilter === 'All') {
          return true;
        }
        return filterTypes.some((type) => (
          (Array.isArray(car[type]) && car[type].map((opt) => opt).includes(selectedFilter))
                            || (typeof car[type] === 'string' && car[type] === selectedFilter)
        ));
      });
      renderCards(filteredCars);
    }

    function createUnifiedFilter(filterOptions) {
      filterOptions.forEach((option, index) => {
        const filter = document.createElement('span');
        filter.classList.add('filter');
        filter.textContent = option;
        if (index === 0) {
          filter.classList.add('selected');
          selectedFilter = option;
        }
        filter.addEventListener('click', () => {
          selectedFilter = option;
          updateFilterStyles();
          filterCards();
        });
        carFiltersContainer.appendChild(filter);
      });
    }

    createUnifiedFilter(unifiedFilterOptions);
    updateFilterStyles();
    filterCards();

    return newContainer;
  }

  let graphQlEndpoint;
  if (componentVariation === 'arena-variant') {
    graphQlEndpoint = `${publishDomain}/graphql/execute.json/msil-platform/ArenaCarList`;
  } else {
    graphQlEndpoint = `${publishDomain}/graphql/execute.json/msil-platform/NexaCarList`;
  }
  let newHTMLContainer = document.createElement('div');

  function appendNewHTMLContainer() {
    if (newHTMLContainer) {
      block.appendChild(newHTMLContainer);
    }
  }

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  fetch(graphQlEndpoint, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      newHTMLContainer = carModelInfo(result);
      appendNewHTMLContainer();
    })
    .catch();

  block.innerHTML = '';
  block.appendChild(newHTMLContainer);
}

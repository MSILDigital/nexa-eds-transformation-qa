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

  const {
    publishDomain, apiKey, allFilterText, cfPrefix,
  } = await fetchPlaceholders();
  let authorization;
  try {
    const res = await fetch(`${publishDomain}/content/nexa/services/token`);
    if (res.ok) {
      authorization = await res.text();
    }
  } catch (e) {
    authorization = '';
  }
  let forCode = '08';
  const title = titleEl?.textContent?.trim();
  const subtitle = subtitleEl?.textContent?.trim();
  const priceText = priceTextEl?.textContent?.trim();
  const componentVariation = selectVariantEl?.textContent?.trim();
  const filterList = filterSelectEl?.textContent?.trim();

  function priceFormatting(price) {
    if (componentVariation === 'arena-variant') {
      return utility.formatToLakhs(price);
    }
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    return formatter.format(price)?.replaceAll(',', ' ');
  }

  function getLocalStorage(key) {
    return localStorage.getItem(key);
  }

  function fetchPrice(modelCode, priceElement, priceTextElement, defaultPrice) {
    const storedPrices = getLocalStorage('modelPrice')
      ? JSON.parse(getLocalStorage('modelPrice')) : {};
    if (storedPrices[modelCode]?.price[forCode]) {
      const expiryTimestamp = storedPrices[modelCode].timestamp;
      const currentTimestamp = new Date().getTime();
      if (currentTimestamp > expiryTimestamp) {
        localStorage.removeItem('modelPrice');
        fetchPrice(modelCode, priceElement, priceTextElement, defaultPrice);
      }
      const storedPrice = priceFormatting(storedPrices[modelCode].price[forCode]);
      priceTextElement.textContent = priceText;
      priceElement.textContent = `${storedPrice}`;
    } else {
      let channel = 'EXC';
      if (componentVariation === 'arena-variant') {
        channel = 'NRM';
      }

      const apiUrl = 'https://api.preprod.developersatmarutisuzuki.in/pricing/v2/common/pricing/ex-showroom-detail';

      const params = {

        forCode,
        channel,
      };

      const headers = {
        'x-api-key': apiKey,
        Authorization: authorization,
      };

      const url = new URL(apiUrl);
      Object.keys(params)
        .forEach((key) => url.searchParams.append(key, params[key]));

      fetch(url, {
        method: 'GET',
        headers,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          if (data.error === false && data.data) {
            const storedModelPrices = {};
            const timestamp = new Date().getTime() + (1 * 24 * 60 * 60 * 1000); // 1 day from now

            data?.data?.models.forEach((item) => {
              const { modelCd } = item;

              storedModelPrices[modelCd] = {
                price: {
                  [forCode]: item.lowestExShowroomPrice,
                },
                timestamp,
              };
            });
            Object.entries(storedModelPrices).forEach(([key, value]) => {
              if (storedPrices[key]) {
                // If existing data is present, merge prices and update timestamp
                storedPrices[key] = {
                  ...storedPrices[key],
                  price: {
                    ...storedPrices[key].price,
                    ...value.price,
                  },
                  timestamp: value.timestamp,
                };
              } else {
                // If key doesn't exist in existing data, add it
                storedPrices[key] = value;
              }
            });
            // Convert to JSON and store in localStorage
            localStorage.setItem('modelPrice', JSON.stringify(storedPrices));
            priceTextElement.textContent = priceText;
            priceElement.textContent = `${priceFormatting(storedPrices[modelCode].price[forCode])}`;
          } else {
            const formattedPrice = defaultPrice ? priceFormatting(defaultPrice) : 'Not available';
            priceElement.textContent = formattedPrice;
            priceTextElement.textContent = priceText;
          }
        })
        .catch((error) => {
          const formattedPrice = defaultPrice ? priceFormatting(defaultPrice) : 'Not available';
          priceElement.textContent = formattedPrice;
          priceTextElement.textContent = priceText;
          throw new Error('Network response was not ok', error);
        });
    }
  }

  let cars = [];
  function carModelInfo(result) {
    cars = result.data.carModelList.items;

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

    let selectedFilter = allFilterText;
    const filters = {};
    const filterTypes = filterList.split(',');

    filterTypes.forEach((type) => {
      filters[type] = new Set();
    });

    const addOptionsToFilter = (filter, options) => {
      if (typeof options === 'string') {
        filter.add(options);
      } else if (Array.isArray(options)) {
        options.forEach((opt) => {
          if (typeof opt === 'string') {
            filter.add(opt);
          }
        });
      }
    };

    const initFilters = (car, type) => {
      const carType = car?.[type];
      if (!carType) {
        return;
      }
      if (Array.isArray(carType)) {
        carType.forEach((option) => {
          addOptionsToFilter(filters[type], option);
        });
      } else if (typeof carType === 'string') {
        addOptionsToFilter(filters[type], carType);
      }
    };

    cars.forEach((car) => {
      filterTypes.forEach((type) => {
        initFilters(car, type);
      });
    });

    Object.keys(filters).forEach((filterType) => {
      filters[filterType] = [...filters[filterType]];
    });

    let unifiedFilterOptions;

    if (componentVariation === 'arena-variant') {
      unifiedFilterOptions = [...new Set(filterTypes.flatMap((type) => filters[type]))];
    } else {
      unifiedFilterOptions = [allFilterText,
        ...new Set(filterTypes.flatMap((type) => filters[type]))];
    }

    function updateFilterStyles() {
      carFiltersContainer.querySelectorAll('.filter').forEach((filter) => {
        filter.classList.toggle('selected', filter.textContent === selectedFilter);
      });
    }

    function renderCards(carsToRender) {
      carCardsContainer.innerHTML = '';

      carsToRender.forEach((car, index) => {
        const card = document.createElement('a');
        card.classList.add('card');
        // eslint-disable-next-line no-underscore-dangle
        const carDetailPath = car.carDetailsPagePath?._path || '#';
        card.href = carDetailPath.replace(cfPrefix, '');

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
        img.loading = 'lazy';
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
        priceElement.dataset.targetIndex = index;
        cardContent.appendChild(priceElement);

        fetchPrice(car.modelId, priceElement, priceTextElement, car.exShowroomPrice);

        card.appendChild(cardImage);
        card.appendChild(cardContent);

        carCardsContainer.appendChild(card);
      });
    }

    function matchesFilterType(car, type) {
      if (Array.isArray(car[type])) {
        return car[type].includes(selectedFilter);
      }
      if (typeof car[type] === 'string') {
        return car[type] === selectedFilter;
      }
      return false;
    }

    function carMatchesFilter(car) {
      if (selectedFilter === allFilterText) {
        return true;
      }
      return filterTypes.some((type) => matchesFilterType(car, type));
    }

    function filterCards() {
      const filteredCars = cars.filter(carMatchesFilter);
      renderCards(filteredCars);
    }

    unifiedFilterOptions.forEach((option, index) => {
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
      block.innerHTML = '';
      block.appendChild(newHTMLContainer);
    }
  }

  const requestOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  function fetchCars() {
    fetch(graphQlEndpoint, requestOptions)
      .then((response) => response.json())
      .then((result) => {
        newHTMLContainer = carModelInfo(result);
        appendNewHTMLContainer();
      })
      .catch();
  }

  fetchCars();

  document.addEventListener('updateLocation', (event) => {
    forCode = event?.detail?.message;
    block.querySelectorAll('.card-content').forEach((el) => {
      const priceElement = el.querySelector('.card-price');
      if (priceElement) {
        const priceTextElement = el.querySelector('.card-price-text');
        const index = parseInt(priceElement.dataset.targetIndex, 10);
        const { modelId, exShowroomPrice } = cars[index];
        fetchPrice(modelId, priceElement, priceTextElement, exShowroomPrice);
      }
    });
  });

  block.innerHTML = '';
  block.appendChild(newHTMLContainer);
}

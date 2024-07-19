import { fetchPlaceholders } from '../../scripts/aem.js';
import utility from '../../utility/utility.js';

export default async function decorate(block) {
  const [titleEl, fylTextEl, dylTextEl, searchTextEl, citiesEl] = block.children;
  const title = titleEl?.textContent?.trim();
  const fylText = fylTextEl?.textContent?.trim();
  const dylText = dylTextEl?.textContent?.trim();
  const searchText = searchTextEl?.textContent?.trim();
  const citiesList = citiesEl?.textContent?.trim();
  const cities = citiesList.split(',');
  block.innerHTML = utility.sanitizeHtml(`
          <button class="location-btn" data-forcode="08">
              Delhi
          </button>
          <div class="geo-location">
              <p class="geo-location__text">${title}</p>
              <div class="detect-location">
                <p class="find-location__text">${fylText}</p>
                <p class="separator">or</p>
                <div class="detect-location__box">
                 <div class="detect-location__cta">
                  <p class="detect-location__text">
                      ${dylText}
                  </p>
                 </div>
                 <div class="top__cities"></div>
                </div>
                <div class="search-location">
                 <div class="search-box">
                  <input type="text" placeholder=${searchText} class="search" />
                 </div>
                 <div class="suggested-places"></div>
                </div>
              </div>
          </div>
      `);
  const { publishDomain, apiKey } = await fetchPlaceholders();
  const url = `${publishDomain}/content/nexa/services/token`;
  let authorization = null;
  try {
    const auth = await fetch(url);
    authorization = await auth.text();
  } catch (e) {
    authorization = '';
  }
  let citiesObject = {};

  function toTitleCase(word) {
    if (typeof word !== 'string' || word.length === 0) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  function sentenceToTitleCase(sentence) {
    if (!sentence.includes(' ')) {
      return toTitleCase(sentence);
    }
    return sentence.split(' ').map(toTitleCase).join(' ');
  }
  function processData(data) {
    citiesObject = data?.reduce((acc, item) => {
      item.cityDesc = sentenceToTitleCase(item.cityDesc);
      acc[item.cityDesc] = {
        cityDesc: item.cityDesc,
        cityCode: item.cityCode,
        latitude: item.latitude,
        longitude: item.longitude,
        forCode: item.forCode,
      };
      return acc;
    }, {});
    return citiesObject;
  }

  // Populate All Cities for Suggested Places
  function populateAllCities() {
    const suggestedPlaces = block.querySelector('.suggested-places');
    suggestedPlaces.innerHTML = ''; // Clear existing suggestions

    Object.keys(citiesObject).forEach((cityName) => {
      const p = document.createElement('p');
      p.textContent = cityName;
      p.className = 'suggested__city';
      p.setAttribute('data-forcode', citiesObject[cityName].forCode);
      suggestedPlaces.appendChild(p);
    });
  }

  // Filtered Cities based on Search Input
  function filterCities(input) {
    const suggestedPlaces = block.querySelector('.suggested-places');
    suggestedPlaces.innerHTML = ''; // Clear existing suggestions

    const filteredCities = Object.keys(citiesObject).filter((cityName) => new RegExp(`^${input}`, 'i').test(cityName));

    filteredCities.forEach((cityName) => {
      const p = document.createElement('p');
      p.textContent = cityName;
      p.className = 'suggested__city';
      p.setAttribute('data-forcode', citiesObject[cityName].forCode);
      suggestedPlaces.appendChild(p);
    });
  }

  // Function to calculate distance between two points using Haversine formula
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos((lat1 * Math.PI) / 180)
        * Math.cos((lat2 * Math.PI) / 180)
        * Math.sin(dLon / 2)
        * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Function to update Location Button with the selected city
  function updateLocationButton(cityName, forCode) {
    const locationButton = block.querySelector('.location-btn');
    locationButton.textContent = cityName;
    locationButton.setAttribute('data-forcode', forCode);
    block.querySelector('.geo-location').style.display = 'none';
  }
  // Function to auto-select the nearest city based on user's location
  function autoSelectNearestCity(latitude, longitude) {
    let nearestCity = null;
    let forCode = null;
    let minDistance = Infinity;

    // Iterating over all cities and logging latitude and longitude
    Object.keys(citiesObject).forEach((cityName) => {
      const cityLatitude = citiesObject[cityName].latitude;
      const cityLongitude = citiesObject[cityName].longitude;
      const distance = calculateDistance(
        latitude,
        longitude,
        cityLatitude,
        cityLongitude,
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = cityName;
        forCode = citiesObject[cityName].forCode;
      }
    });
    // Update the nearest city in the dropdown
    updateLocationButton(nearestCity, forCode);
  }
  function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    autoSelectNearestCity(lat, lon);
  }
  function requestLocationPermission() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        showPosition(position);
      });
    }
  }

  const defaultHeaders = {
    'x-api-key': apiKey,
    Authorization: authorization,
  };

  const urlWithParams = 'https://api.preprod.developersatmarutisuzuki.in/dms/v1/api/common/msil/dms/dealer-only-cities?channel=EXC';
  let result;
  try {
    const response = await fetch(urlWithParams, {
      method: 'GET',
      headers: defaultHeaders,
    });
    result = await response.json();
    const filteredData = result?.data?.filter((obj) => obj.cityDesc !== null);
    citiesObject = processData(filteredData);
    const locationButton = block.querySelector('.location-btn');
    const geoLocationDiv = block.querySelector('.geo-location');
    const findLocation = block.querySelector('.find-location__text');
    const separator = block.querySelector('.separator');
    const geoLocationText = block.querySelector('.geo-location__text');
    const detectLocationCTA = block.querySelector('.detect-location__cta');
    const detectLocation = block.querySelector('.detect-location');
    const detectLocationBox = block.querySelector('.detect-location__box');
    const topCities = block.querySelector('.top__cities');
    const searchLocation = block.querySelector('.search-location');

    cities.forEach((cityCode) => {
      const obj = Object.keys(citiesObject).find(
        (key) => citiesObject[key].forCode === cityCode,
      );
      const p = document.createElement('p');
      p.className = 'selected__top__city';
      p.textContent = obj;
      p.setAttribute('data-forcode', cityCode);
      topCities.appendChild(p);
    });

    populateAllCities(); // Populate all cities initially

    const searchInput = block.querySelector('.search');
    searchInput.addEventListener('input', (e) => {
      const inputValue = e.target.value.trim();
      if (inputValue === '') {
        populateAllCities();
      } else {
        filterCities(inputValue);
      }
    });

    locationButton.addEventListener('click', () => {
      if (
        geoLocationDiv.style.display === 'none'
        || geoLocationDiv.style.display === ''
      ) {
        geoLocationDiv.style.display = 'block';
      } else {
        geoLocationDiv.style.display = 'none';
      }
    });
    detectLocationCTA.addEventListener('click', () => {
      geoLocationDiv.style.display = 'none';
      requestLocationPermission();
    });
    findLocation.addEventListener('click', () => {
      findLocation.style.display = 'none';
      separator.style.display = 'none';
      geoLocationText.style.display = 'none';
      topCities.style.display = 'flex';
      detectLocation.style.padding = 0;
      detectLocationBox.classList.add('inactive');
      searchLocation.style.display = 'flex';
    });

    // Add click event to suggested cities
    const suggestedPlaces = block.querySelector('.suggested-places');
    suggestedPlaces.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggested__city')) {
        const selectedCity = e.target.textContent;
        const selectedForCode = e.target.getAttribute('data-forcode');
        updateLocationButton(selectedCity, selectedForCode);
        searchInput.value = '';
        populateAllCities();
      }
    });

    // Add click event to top cities
    topCities.addEventListener('click', (e) => {
      if (e.target.classList.contains('selected__top__city')) {
        const selectedCity = e.target.textContent;
        const selectedForCode = e.target.getAttribute('data-forcode');
        updateLocationButton(selectedCity, selectedForCode);
      }
    });
  } catch (e) {
    throw new Error('Network response was not ok', e);
  }
}

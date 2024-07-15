import { fetchPlaceholders } from '../../scripts/aem.js';
import utility from '../../utility/utility.js';

export default async function decorate(block) {
  const [titleEl, fylTextEl, dylTextEl] = block.children;
  const title = titleEl?.textContent?.trim();
  const fylText = fylTextEl?.textContent?.trim();
  const dylText = dylTextEl?.textContent?.trim();

  block.innerHTML = utility.sanitizeHtml(`
          <button class="location-btn">
              Delhi
          </button>
          <div class="geo-location">
              <p class="geo-location__text">${title}</p>
              <div class="detect-location">
                  <p class="find-location__text">${fylText}</p>
                  <p class="separator">or</p>
                  <div class="detect-location__cta">
                  <p class="detect-location__text">
                      ${dylText}
                  </p>
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
    authorization = ''
  }
  let citiesObject;
  function processData(data) {
    const citiesObject = data?.reduce((acc, item) => {
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
  // Function to auto-select the nearest city based on user's location
  function autoSelectNearestCity(latitude, longitude) {
    let nearestCity = null;
    let forCode = null;
    let cityCode = null;
    let minDistance = Infinity;

    // Iterating over all cities and logging latitude and longitude
    Object.keys(citiesObject).forEach((cityName) => {
      const cityLatitude = citiesObject[cityName].latitude;
      const cityLongitude = citiesObject[cityName].longitude;
      const distance = calculateDistance(latitude, longitude, cityLatitude, cityLongitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = cityName;
        forCode = citiesObject[cityName].forCode;
        cityCode = citiesObject[cityName].cityCode;
      }
    });
    // Update the nearest city in the dropdown
    const location = block.querySelector('.location-btn');
    location.innerHTML = nearestCity;
    location.setAttribute('data-forcode', forCode);
    location.setAttribute('data-citycode', cityCode);
  }
  function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    autoSelectNearestCity(lat, lon);
  }
  function requestLocationPermission() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          showPosition(position);
        },
      );
    }
  }

  const defaultHeaders = {
    'x-api-key': apiKey,
    Authorization: authorization,
  };

  const urlWithParams = 'https://api.preprod.developersatmarutisuzuki.in/dms/v1/api/common/msil/dms/dealer-only-cities?channel=EXC';
  let result = null;
  try{
    const response = await fetch(urlWithParams, { method: 'GET', headers: defaultHeaders });
    result = await response.json();
    const filteredData = result?.data?.filter((obj) => obj.cityDesc !== null);
    citiesObject = processData(filteredData);
    const locationButton = block.querySelector('.location-btn');
    const geoLocationDiv = block.querySelector('.geo-location');
    const detectLocationCTA = block.querySelector('.detect-location__cta');
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
  }
  catch(e){
    throw new Error('Network response was not ok', e);
  }
}

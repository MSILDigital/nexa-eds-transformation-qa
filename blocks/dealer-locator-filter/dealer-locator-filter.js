import utility from '../../utility/utility.js';
import {
  fetchPlaceholders,
} from '../../scripts/aem.js';

export default async function decorate(block) {
  const [pincodeTextEl, pincodeValueEl, cityTextEl, visitingTextEl, dsValueEl, scValueEl,
    showcasingTextEl, radiusTextEl, radiusValueEl, distanceTextEl,
  ] = block.children;
  const pincodeText = pincodeTextEl?.textContent?.trim();
  const pincodeValue = pincodeValueEl?.textContent?.trim();
  const cityText = cityTextEl?.textContent?.trim();
  const visitingText = visitingTextEl?.textContent?.trim();
  const dsValue = dsValueEl?.textContent?.trim();
  const scValue = scValueEl?.textContent?.trim();
  const showcasingText = showcasingTextEl?.textContent?.trim();
  const radiusText = radiusTextEl?.textContent?.trim();
  const radiusValueList = radiusValueEl?.textContent?.trim();
  const radiusValue = radiusValueList.split(',');
  const distanceText = distanceTextEl?.textContent?.trim();
  let authorization = null;
  const forCode = '48';
  const {
    publishDomain,
    apiKey,
    allCarText,
    mapmyindiaKey,
    mapmyindiaUrl,
  } = await fetchPlaceholders();
  const tokenUrl = `${publishDomain}/content/nexa/services/token`;
  try {
    const auth = await fetch(tokenUrl);
    authorization = await auth.text();
  } catch (e) {
    authorization = '';
  }
  const defaultHeaders = {
    'x-api-key': apiKey,
    Authorization: authorization,
  };

  function updateRadiusValue() {
    const radiusValueDiv = block.querySelector('#radius');
    radiusValue.forEach((element) => {
      const radiusValueOption = document.createElement('option');
      radiusValueOption.value = element.trim();
      radiusValueOption.textContent = `${element.trim()} ${distanceText}`;
      radiusValueDiv.appendChild(radiusValueOption);
    });
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  async function updateShowcasingCarValue() {
    const channel = 'EXC';
    const apiUrl = 'https://api.preprod.developersatmarutisuzuki.in/pricing/v2/common/pricing/ex-showroom-detail';

    const params = {
      forCode,
      channel,
    };

    const url = new URL(apiUrl);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    let data;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders,
      });
      data = await response.json();
    } catch {
      data = {};
    }
    const showcasingCarValueDiv = block.querySelector('#showcasing');
    // update all cars placeholder initially
    const initialCarValueOption = document.createElement('option');
    initialCarValueOption.value = allCarText.trim();
    initialCarValueOption.textContent = allCarText.trim();
    showcasingCarValueDiv.appendChild(initialCarValueOption);
    if (data?.error === false && data?.data) {
      data.data.models.forEach((item) => {
        const {
          modelDesc,
        } = item;
        const showcasingCarValueOption = document.createElement('option');
        showcasingCarValueOption.value = modelDesc.trim();
        showcasingCarValueOption.textContent = capitalizeFirstLetter(modelDesc.trim());
        showcasingCarValueDiv.appendChild(showcasingCarValueOption);
      });
    }
  }

  async function autoSelectNearestCity(latitude, longitude) {
    let nearestCity = null;
    let pincode = null;
    // MapmyIndia API key
    const mapMyIndiaApiUrl = `${mapmyindiaUrl + mapmyindiaKey}/rev_geocode`;
    const params = {
      lat: latitude,
      lng: longitude,
    };

    const url = new URL(mapMyIndiaApiUrl);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
      });
      const data = await response.json();
      nearestCity = data?.results[0]?.city;
      pincode = data?.results[0]?.pincode;

      const cityDiv = block.querySelector('#city');
      const pincodeInput = block.querySelector('#pincode');
      let cityExists = false;
      const cityOptions = cityDiv.querySelectorAll('option');
      cityOptions.forEach((option) => {
        if (option.value.toUpperCase().trim() === nearestCity.toUpperCase().trim()) {
          cityExists = true;
          option.selected = true;
        }
      });

      if (!cityExists) {
        const cityDescOption = document.createElement('option');
        cityDescOption.value = nearestCity.trim();
        cityDescOption.textContent = nearestCity.trim();
        cityDescOption.setAttribute('selected', true);
        cityDiv.prepend(cityDescOption);
      }
      pincodeInput.value = pincode;
    } catch (error) {
      throw new Error('Error fetching city from MapMyIndia API:', error);
    }
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

  async function updateCities() {
    const urlWithParams = 'https://api.preprod.developersatmarutisuzuki.in/dms/v1/api/common/msil/dms/dealer-only-cities?channel=EXC';
    let result;
    try {
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: defaultHeaders,
      });
      result = await response.json();
      const detectLocationIcon = block.querySelector('#locator-icon');
      detectLocationIcon.addEventListener('click', () => {
        requestLocationPermission();
      });
    } catch (e) {
      result = '';
      throw new Error('Network response was not ok', e);
    }
    const cityValueDiv = block.querySelector('#city');
    if (result?.error === false && result?.data) {
      result.data.forEach((item) => {
        const {
          cityDesc,
          latitude,
          longitude,
        } = item;
        const cityDescOption = document.createElement('option');
        cityDescOption.value = cityDesc.trim();
        cityDescOption.textContent = cityDesc.trim();
        cityDescOption.setAttribute('data-lat', latitude);
        cityDescOption.setAttribute('data-long', longitude);
        cityValueDiv.appendChild(cityDescOption);
      });
    }
  }

  block.innerHTML = utility.sanitizeHtml(`
        <section class="dealer-locator">
            <div class="dealer-locator-container">
                <div class="filter-container">
                    <div class="filter-group">
                        <label for="pincode">${pincodeText}</label>
                        <input type="text" id="pincode" name="pincode" value="${pincodeValue}">
                        <span id="locator-icon" class="filter-icon"></span>
                        <span id="close-icon" class="filter-icon"></span>
                    </div>
                    <div class="filter-group">
                        <label for="city">${cityText}</label>
                        <select id="city" name="city">
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="visiting">${visitingText}</label>
                        <select id="visiting" name="visiting">
                            ${dsValue ? `<option value="ds">${dsValue}</option>` : ''}
                            ${scValue ? `<option value="sc">${scValue}</option>` : ''}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="showcasing">${showcasingText}</label>
                        <select id="showcasing" name="showcasing">
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="radius">${radiusText}</label>
                        <select id="radius" name="radius">
                        </select>
                    </div>
                    <button class="search-button">Search</button>
                    <button class="search-button-icon"></button>
                </div>
            </div>
        </section>`);

  updateCities();
  updateShowcasingCarValue();
  updateRadiusValue();
}

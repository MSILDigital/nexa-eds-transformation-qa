// Location Change Event
export const createLocationChangeEvent = (message) => new CustomEvent('updateLocation', {
  detail: { message },
});

export const dispatchLocationChangeEvent = (message) => {
  const event = createLocationChangeEvent(message);
  document.dispatchEvent(event);
};

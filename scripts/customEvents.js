// Location Change Event
export const createLocationChangeEvent = (message) => {
    return new CustomEvent('updateLocation', {
        detail: { message }
    });
};

export const dispatchLocationChangeEvent = (message) => {
    const event = createLocationChangeEvent(message);
    document.dispatchEvent(event);
};
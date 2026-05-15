window.App = window.App || {};
window.App.Services = window.App.Services || {};

App.Services.Geo = (() => {
  async function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('Геолокація не підтримується')); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        err => reject(new Error('Не вдалося отримати геолокацію: ' + err.message)),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  async function reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uk`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'uk' } });
      if (!resp.ok) throw new Error('Nominatim error');
      const data = await resp.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function getAndGeocode() {
    const pos = await getCurrentPosition();
    const address = await reverseGeocode(pos.lat, pos.lng);
    return { ...pos, address };
  }

  function mapsLink(lat, lng) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  return { getCurrentPosition, reverseGeocode, getAndGeocode, mapsLink };
})();

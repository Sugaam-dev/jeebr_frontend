// Google Maps Platform Loader and Provider Manager with Automatic Fallback Detection

let googleMapsPromise = null;
let googleMapsStatus = 'UNINITIALIZED'; // 'UNINITIALIZED' | 'LOADING' | 'READY' | 'FAILED'
let failureReason = null;

export const MapProviderStatus = {
  UNINITIALIZED: 'UNINITIALIZED',
  LOADING: 'LOADING',
  READY: 'READY',
  FAILED: 'FAILED'
};

/**
 * Loads the Google Maps JavaScript API script dynamically.
 * If API key is missing or invalid, or if loading fails (e.g. offline, quota, CSP),
 * it transitions to FAILED state and resolves to null, allowing components to
 * seamlessly render the fallback SVG map without crashing.
 */
export function loadGoogleMaps() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  // If already loaded on window
  if (window.google && window.google.maps) {
    googleMapsStatus = MapProviderStatus.READY;
    return Promise.resolve(window.google.maps);
  }

  // Return existing in-flight promise if currently loading
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
    googleMapsStatus = MapProviderStatus.FAILED;
    failureReason = 'API key not configured';
    return Promise.resolve(null);
  }

  googleMapsStatus = MapProviderStatus.LOADING;

  googleMapsPromise = new Promise((resolve) => {
    // Global callback for script load
    const callbackName = `__initSentinelGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      if (window.google && window.google.maps) {
        googleMapsStatus = MapProviderStatus.READY;
        resolve(window.google.maps);
      } else {
        googleMapsStatus = MapProviderStatus.FAILED;
        failureReason = 'Google Maps object missing after script execution';
        resolve(null);
      }
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&callback=${callbackName}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      delete window[callbackName];
      googleMapsStatus = MapProviderStatus.FAILED;
      failureReason = 'Script failed to load (network error, invalid key, or CSP)';
      console.warn('[MapService] Google Maps JavaScript API failed to load. SentinelOS is activating resilient SVG fallback map.');
      resolve(null);
    };

    // Timeout safety: if Google Maps doesn't initialize within 6 seconds, fail to fallback
    const timeoutTimer = setTimeout(() => {
      if (googleMapsStatus === MapProviderStatus.LOADING) {
        googleMapsStatus = MapProviderStatus.FAILED;
        failureReason = 'Connection timeout';
        console.warn('[MapService] Google Maps initialization timed out. Defaulting to SVG fallback.');
        resolve(null);
      }
    }, 6000);

    const originalResolve = resolve;
    resolve = (val) => {
      clearTimeout(timeoutTimer);
      originalResolve(val);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function getMapProviderStatus() {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return MapProviderStatus.READY;
  }
  return googleMapsStatus;
}

export function getMapFailureReason() {
  return failureReason;
}

// Location Provider Abstraction: Real Browser Geolocation vs. Controlled Development Simulator

/**
 * Standardized Geolocation Error representation for Sentinel OS
 */
export class LocationError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.name = 'LocationError';
    this.code = code; // 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED' | 'LOW_ACCURACY'
    this.originalError = originalError;
  }

  static fromGeolocationPositionError(err) {
    if (!err) return new LocationError('POSITION_UNAVAILABLE', 'Unknown geolocation error.');
    switch (err.code) {
      case 1:
        return new LocationError(
          'PERMISSION_DENIED',
          'Location access was denied. Please allow location permissions in your browser to enable live transit tracking.',
          err
        );
      case 2:
        return new LocationError(
          'POSITION_UNAVAILABLE',
          'Device GPS signal is unavailable. Please check your device location / GPS settings.',
          err
        );
      case 3:
        return new LocationError(
          'TIMEOUT',
          'GPS location request timed out. Retrying with device sensors...',
          err
        );
      default:
        return new LocationError('POSITION_UNAVAILABLE', err.message || 'Unable to retrieve location.', err);
    }
  }
}

/**
 * Calculates Great-Circle distance in meters using Haversine formula
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const R = 6371000; // Radius of Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class LocationProvider {
  getCurrentPosition() {
    throw new Error('Method not implemented.');
  }

  watchPosition(onSuccess, onError) {
    throw new Error('Method not implemented.');
  }

  clearWatch(watchId) {
    throw new Error('Method not implemented.');
  }
}

/**
 * Production Browser / Device Location Provider.
 * Uses W3C Geolocation API (`navigator.geolocation`) on engineer smartphones, tablets, or laptops.
 * Includes configurable rate-limiting, distance filtering, and accuracy verification.
 */
export class BrowserLocationProvider extends LocationProvider {
  constructor(options = {}) {
    super();
    this.options = {
      enableHighAccuracy: true,
      timeout: options.timeout || 15000,
      maximumAge: options.maximumAge || 5000,
      ...options
    };
    // Frequency and distance controls (Section 10 & 11)
    this.minIntervalMs = options.minIntervalMs || 5000; // 5s minimum between pings
    this.minDistanceMeters = options.minDistanceMeters || 8.0; // 8m minimum movement threshold
    this.maxAcceptableAccuracyMeters = options.maxAcceptableAccuracyMeters || 150.0; // Filter inaccurate readings

    this.lastAcceptedPosition = null;
    this.lastAcceptedTime = 0;
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  async checkPermissionStatus() {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state; // 'granted' | 'prompt' | 'denied'
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new LocationError('UNSUPPORTED', 'Browser geolocation is not supported on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy || 10),
            heading: pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Number(pos.coords.heading.toFixed(1)) : 0.0,
            speed: pos.coords.speed !== null && !isNaN(pos.coords.speed) ? Number((pos.coords.speed * 3.6).toFixed(1)) : 0.0, // km/h
            speedMps: pos.coords.speed !== null && !isNaN(pos.coords.speed) ? Number(pos.coords.speed.toFixed(2)) : 0.0,
            timestamp: new Date(pos.timestamp).toISOString(),
            isMock: false
          });
        },
        (err) => reject(LocationError.fromGeolocationPositionError(err)),
        this.options
      );
    });
  }

  watchPosition(onSuccess, onError) {
    if (!this.isSupported()) {
      if (onError) onError(new LocationError('UNSUPPORTED', 'Geolocation not supported on this device.'));
      return null;
    }

    this.lastAcceptedPosition = null;
    this.lastAcceptedTime = 0;

    return navigator.geolocation.watchPosition(
      (pos) => {
        const coords = pos.coords;
        const now = Date.now();
        const accuracy = coords.accuracy || 10;

        // 1. Accuracy filtering: discard if degraded beyond tolerance
        if (accuracy > this.maxAcceptableAccuracyMeters) {
          if (onError) {
            onError(
              new LocationError(
                'LOW_ACCURACY',
                `GPS accuracy is too low (±${Math.round(accuracy)}m). Waiting for satellite lock...`
              )
            );
          }
          return;
        }

        // 2. Distance and time interval filtering (Section 11)
        if (this.lastAcceptedPosition) {
          const timeElapsed = now - this.lastAcceptedTime;
          const distMoved = calculateDistanceMeters(
            this.lastAcceptedPosition.latitude,
            this.lastAcceptedPosition.longitude,
            coords.latitude,
            coords.longitude
          );

          // If too frequent AND hasn't moved significantly, skip local ping to prevent flooding backend
          if (timeElapsed < this.minIntervalMs && distMoved < this.minDistanceMeters) {
            return;
          }
        }

        const normalized = {
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
          accuracy: Math.round(accuracy),
          heading: coords.heading !== null && !isNaN(coords.heading) ? Number(coords.heading.toFixed(1)) : 0.0,
          speed: coords.speed !== null && !isNaN(coords.speed) ? Number((coords.speed * 3.6).toFixed(1)) : 0.0, // km/h
          speedMps: coords.speed !== null && !isNaN(coords.speed) ? Number(coords.speed.toFixed(2)) : 0.0,
          timestamp: new Date(pos.timestamp).toISOString(),
          isMock: false
        };

        this.lastAcceptedPosition = normalized;
        this.lastAcceptedTime = now;

        if (onSuccess) onSuccess(normalized);
      },
      (err) => {
        if (onError) onError(LocationError.fromGeolocationPositionError(err));
      },
      this.options
    );
  }

  clearWatch(watchId) {
    if (watchId !== null && typeof watchId !== 'undefined' && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}

/**
 * Controlled Development GPS Simulator Provider.
 * Strictly intended for local development, demo environments, or automated end-to-end tests.
 * NEVER used in production execution unless explicitly toggled in Dev Mode.
 */
export class SimulatorLocationProvider extends LocationProvider {
  constructor(startLat = 19.055, startLng = 72.835, stepRatio = 0.12) {
    super();
    this.currentLat = startLat;
    this.currentLng = startLng;
    this.stepRatio = stepRatio;
  }

  stepTowards(targetLat, targetLng) {
    this.currentLat += (targetLat - this.currentLat) * this.stepRatio;
    this.currentLng += (targetLng - this.currentLng) * this.stepRatio;
    return {
      latitude: Number(this.currentLat.toFixed(6)),
      longitude: Number(this.currentLng.toFixed(6)),
      accuracy: 5.0,
      heading: 45.0,
      speed: 28.0, // km/h
      speedMps: 7.7,
      timestamp: new Date().toISOString(),
      isMock: true
    };
  }
}

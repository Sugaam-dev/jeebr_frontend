import { api } from './api';

// Route cache configuration
const ROUTE_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL
const ROUTE_MIN_MOVE_METERS = 150; // Minimum 150m displacement before recalculating

function haversineMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class FrontendRoutingService {
  constructor() {
    // Map jobId -> { timestamp, route, lastOrigin: { lat, lng } }
    this.cache = new Map();
    this.inFlight = new Map();
  }

  /**
   * Fetches or retrieves cached road route for an assignment.
   * Throttles requests: will only recalculate if route is > 60s old OR engineer moved > 150m.
   */
  async getJobRoute(jobId, currentEngineerLat, currentEngineerLng, force = false) {
    if (!jobId) return null;

    const now = Date.now();
    const cachedEntry = this.cache.get(jobId);

    if (!force && cachedEntry) {
      const isFresh = (now - cachedEntry.timestamp) < ROUTE_CACHE_TTL_MS;
      if (isFresh && currentEngineerLat && currentEngineerLng && cachedEntry.lastOrigin) {
        const movedMeters = haversineMeters(
          currentEngineerLat,
          currentEngineerLng,
          cachedEntry.lastOrigin.lat,
          cachedEntry.lastOrigin.lng
        );
        if (movedMeters < ROUTE_MIN_MOVE_METERS) {
          return { ...cachedEntry.route, cached: true };
        }
      }
    }

    // Deduplicate in-flight requests
    if (this.inFlight.has(jobId)) {
      return this.inFlight.get(jobId);
    }

    const promise = (async () => {
      try {
        const routeData = await api.getFieldJobRoute(jobId);
        if (routeData) {
          this.cache.set(jobId, {
            timestamp: Date.now(),
            route: routeData,
            lastOrigin: currentEngineerLat && currentEngineerLng ? { lat: currentEngineerLat, lng: currentEngineerLng } : null
          });
        }
        return routeData;
      } catch (err) {
        console.warn(`[RoutingService] Backend route fetch failed for job #${jobId}:`, err.message);
        // If we have stale cache, return it rather than failing
        if (cachedEntry) {
          return { ...cachedEntry.route, stale: true };
        }
        return null;
      } finally {
        this.inFlight.delete(jobId);
      }
    })();

    this.inFlight.set(jobId, promise);
    return promise;
  }

  clearCache(jobId = null) {
    if (jobId) {
      this.cache.delete(jobId);
    } else {
      this.cache.clear();
    }
  }
}

export const routingService = new FrontendRoutingService();

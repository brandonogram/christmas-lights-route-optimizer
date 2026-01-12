import { Customer, Location, OptimizedRoute } from './types';

/**
 * Route colors for visualization
 */
const ROUTE_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

/**
 * Calculate the distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * K-means clustering algorithm to group customers into N clusters
 */
function kMeansClustering(customers: Customer[], k: number, maxIterations = 100): Customer[][] {
  if (customers.length <= k) {
    // If fewer customers than clusters, put each in their own cluster
    return customers.map((c) => [c]);
  }

  // Filter customers with valid coordinates
  const validCustomers = customers.filter((c) => c.lat !== null && c.lng !== null);

  if (validCustomers.length === 0) {
    return [];
  }

  // Initialize centroids using k-means++ method
  const centroids: { lat: number; lng: number }[] = [];

  // First centroid is random
  const firstIndex = Math.floor(Math.random() * validCustomers.length);
  centroids.push({
    lat: validCustomers[firstIndex].lat!,
    lng: validCustomers[firstIndex].lng!,
  });

  // Select remaining centroids with probability proportional to distance
  while (centroids.length < k) {
    const distances = validCustomers.map((customer) => {
      const minDist = Math.min(
        ...centroids.map((c) => haversineDistance(customer.lat!, customer.lng!, c.lat, c.lng))
      );
      return minDist * minDist;
    });

    const totalDist = distances.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalDist;

    for (let i = 0; i < validCustomers.length; i++) {
      random -= distances[i];
      if (random <= 0) {
        centroids.push({
          lat: validCustomers[i].lat!,
          lng: validCustomers[i].lng!,
        });
        break;
      }
    }
  }

  let clusters: Customer[][] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign customers to nearest centroid
    clusters = Array.from({ length: k }, () => []);

    for (const customer of validCustomers) {
      let minDist = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist = haversineDistance(customer.lat!, customer.lng!, centroids[i].lat, centroids[i].lng);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push(customer);
    }

    // Update centroids
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;

      const newLat = clusters[i].reduce((sum, c) => sum + c.lat!, 0) / clusters[i].length;
      const newLng = clusters[i].reduce((sum, c) => sum + c.lng!, 0) / clusters[i].length;

      if (Math.abs(centroids[i].lat - newLat) > 0.0001 || Math.abs(centroids[i].lng - newLng) > 0.0001) {
        converged = false;
      }

      centroids[i] = { lat: newLat, lng: newLng };
    }

    if (converged) break;
  }

  // Remove empty clusters
  return clusters.filter((c) => c.length > 0);
}

/**
 * Nearest-neighbor algorithm to order stops efficiently
 */
function nearestNeighborOrder(
  customers: Customer[],
  startLocation: Location
): Customer[] {
  if (customers.length === 0) return [];
  if (customers.length === 1) return customers;

  const ordered: Customer[] = [];
  const remaining = [...customers];

  let currentLat = startLocation.lat;
  let currentLng = startLocation.lng;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const customer = remaining[i];
      if (customer.lat === null || customer.lng === null) continue;

      const dist = haversineDistance(currentLat, currentLng, customer.lat, customer.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    const nearest = remaining.splice(nearestIndex, 1)[0];
    ordered.push(nearest);

    if (nearest.lat !== null && nearest.lng !== null) {
      currentLat = nearest.lat;
      currentLng = nearest.lng;
    }
  }

  return ordered;
}

/**
 * Main route optimization function
 */
export function optimizeRoutes(
  customers: Customer[],
  numberOfRoutes: number,
  startLocation: Location,
  endLocation: Location
): OptimizedRoute[] {
  // Filter customers with valid coordinates
  const validCustomers = customers.filter((c) => c.lat !== null && c.lng !== null);

  if (validCustomers.length === 0) {
    return [];
  }

  // Cluster customers into groups
  const clusters = kMeansClustering(validCustomers, numberOfRoutes);

  // For each cluster, order the stops using nearest-neighbor from start location
  const routes: OptimizedRoute[] = clusters.map((cluster, index) => {
    const orderedStops = nearestNeighborOrder(cluster, startLocation);

    return {
      id: index + 1,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      stops: orderedStops,
      startLocation,
      endLocation,
    };
  });

  return routes;
}

/**
 * Calculate total distance for a route
 */
export function calculateRouteDistance(route: OptimizedRoute): number {
  let totalDistance = 0;

  // Distance from start to first stop
  if (route.stops.length > 0 && route.stops[0].lat && route.stops[0].lng) {
    totalDistance += haversineDistance(
      route.startLocation.lat,
      route.startLocation.lng,
      route.stops[0].lat,
      route.stops[0].lng
    );
  }

  // Distance between stops
  for (let i = 0; i < route.stops.length - 1; i++) {
    const current = route.stops[i];
    const next = route.stops[i + 1];

    if (current.lat && current.lng && next.lat && next.lng) {
      totalDistance += haversineDistance(current.lat, current.lng, next.lat, next.lng);
    }
  }

  // Distance from last stop to end
  if (route.stops.length > 0) {
    const lastStop = route.stops[route.stops.length - 1];
    if (lastStop.lat && lastStop.lng) {
      totalDistance += haversineDistance(
        lastStop.lat,
        lastStop.lng,
        route.endLocation.lat,
        route.endLocation.lng
      );
    }
  }

  return totalDistance;
}

/**
 * Generate Google Maps directions URL for a route
 */
export function generateGoogleMapsUrl(route: OptimizedRoute): string {
  const baseUrl = 'https://www.google.com/maps/dir/';

  // Start with start location
  const waypoints = [
    `${route.startLocation.lat},${route.startLocation.lng}`,
  ];

  // Add all stops (Google Maps allows up to 10 waypoints)
  const maxWaypoints = Math.min(route.stops.length, 10);
  for (let i = 0; i < maxWaypoints; i++) {
    const stop = route.stops[i];
    if (stop.lat && stop.lng) {
      waypoints.push(`${stop.lat},${stop.lng}`);
    }
  }

  // Add end location
  waypoints.push(`${route.endLocation.lat},${route.endLocation.lng}`);

  return baseUrl + waypoints.join('/');
}

/**
 * Generate Apple Maps URL for a route
 */
export function generateAppleMapsUrl(route: OptimizedRoute): string {
  // Apple Maps URL format is more limited
  // We'll create a directions URL with destination
  const destinations: string[] = [];

  // Add all stops
  for (const stop of route.stops) {
    if (stop.lat && stop.lng) {
      destinations.push(`${stop.lat},${stop.lng}`);
    }
  }

  // Add end location
  destinations.push(`${route.endLocation.lat},${route.endLocation.lng}`);

  // Build URL with saddr (source) and daddr (destination)
  const saddr = `${route.startLocation.lat},${route.startLocation.lng}`;
  const daddr = destinations.join('+to:');

  return `maps://?saddr=${saddr}&daddr=${daddr}`;
}

/**
 * Check if running on Apple device
 */
export function isAppleDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
}

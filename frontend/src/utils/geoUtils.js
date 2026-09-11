/**
 * Agricultural Logistics & Distance Utilities for AgriSaathi Unified Platform
 */

export const KNOWN_HUBS = {
  NASHIK_APMC: { name: 'Nashik APMC (Panchavati)', lat: 20.0063, lng: 73.7903 },
  LASALGAON_APMC: { name: 'Lasalgaon Onion Yard', lat: 20.1472, lng: 74.2268 },
  PIMPALGAON_APMC: { name: 'Pimpalgaon APMC Baswant', lat: 20.1706, lng: 73.9856 },
  PUNE_GULTEKDI: { name: 'Pune APMC (Gultekdi)', lat: 18.4967, lng: 73.8647 },
  VASHI_MUMBAI: { name: 'Vashi APMC (Navi Mumbai)', lat: 19.0760, lng: 73.0076 },
  DINDORI_STORAGE: { name: 'Nashik Agro Cold Storage (Dindori)', lat: 20.2010, lng: 73.8390 }
};

/**
 * Calculates Great-Circle distance using Haversine formula
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number|null} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lat1 === null || lon1 === undefined || lon1 === null ||
      lat2 === undefined || lat2 === null || lon2 === undefined || lon2 === null) {
    return null;
  }

  const p1Lat = parseFloat(lat1);
  const p1Lon = parseFloat(lon1);
  const p2Lat = parseFloat(lat2);
  const p2Lon = parseFloat(lon2);

  if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (p2Lat - p1Lat) * (Math.PI / 180);
  const dLon = (p2Lon - p1Lon) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1Lat * (Math.PI / 180)) *
    Math.cos(p2Lat * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(1));
};

/**
 * Estimates rural transport transit time based on distance
 * Average agri-cargo tempo speed ~ 35 km/h on state/district roads
 * @param {number} distanceKm Distance in km
 * @param {number} avgSpeedKmh Average truck speed
 * @returns {string} Formatted duration (e.g. "35 mins", "1 hr 20 mins")
 */
export const estimateTransitTime = (distanceKm, avgSpeedKmh = 35) => {
  if (!distanceKm || distanceKm <= 0) return '—';
  const hours = distanceKm / avgSpeedKmh;
  const totalMinutes = Math.round(hours * 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  }
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} mins` : `${hrs} hr`;
};

/**
 * Estimates freight logistics cost for agricultural transport
 * @param {number} distanceKm Distance in km
 * @param {number} quantityKg Quantity to move
 * @param {number} ratePerKmPerTonne Transport rate ₹/km/tonne
 * @returns {{ totalCost: number, costPerQuintal: number, costPerKg: number }}
 */
export const estimateFreightCost = (distanceKm, quantityKg = 1000, ratePerKmPerTonne = 14) => {
  if (!distanceKm || distanceKm <= 0) {
    return { totalCost: 0, costPerQuintal: 0, costPerKg: 0 };
  }

  const tonnes = Math.max(0.1, quantityKg / 1000);
  const baseCharge = 350; // Minimum driver base pickup charge
  const rawCost = baseCharge + (distanceKm * ratePerKmPerTonne * tonnes);
  const totalCost = Math.round(rawCost);

  const costPerKg = parseFloat((totalCost / quantityKg).toFixed(2));
  const costPerQuintal = Math.round(costPerKg * 100);

  return { totalCost, costPerQuintal, costPerKg };
};

/**
 * Formats coordinates for UI display
 */
export const formatCoordinates = (lat, lng) => {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return '—';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
};

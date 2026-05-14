export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatCo2Grams(grams) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${Math.round(grams)} g`;
}

// Per ride: bookedSeats × km × 120g CO₂/km displaced
export function co2Saved(ride) {
  if (!ride.pickupLat || !ride.dropoffLat || !ride.bookedSeats) return null;
  const km = haversineKm(ride.pickupLat, ride.pickupLng, ride.dropoffLat, ride.dropoffLng);
  return formatCo2Grams(ride.bookedSeats * km * 120);
}

// Aggregate CO₂ across completed driver rides
export function driverCo2Saved(rides) {
  const grams = rides
    .filter(r => r.status === 'COMPLETED' && r.pickupLat && r.dropoffLat && r.bookedSeats)
    .reduce((sum, r) => {
      const km = haversineKm(r.pickupLat, r.pickupLng, r.dropoffLat, r.dropoffLng);
      return sum + r.bookedSeats * km * 120;
    }, 0);
  return formatCo2Grams(grams);
}

// Aggregate CO₂ across completed passenger bookings
export function passengerCo2Saved(trips) {
  const grams = trips
    .filter(t => t.status === 'COMPLETED' && t.pickupLat && t.dropoffLat)
    .reduce((sum, t) => {
      const km = haversineKm(t.pickupLat, t.pickupLng, t.dropoffLat, t.dropoffLng);
      return sum + km * 120;
    }, 0);
  return formatCo2Grams(grams);
}

export function totalEarnings(ride) {
  if (ride.status !== 'COMPLETED' || !ride.bookedSeats) return 0;
  return (ride.fare ?? 0) * ride.bookedSeats;
}

// Extract short area from "Kothrud, Pune, Maharashtra" → "Kothrud" (max 22 chars)
export function areaLabel(fullLabel) {
  if (!fullLabel) return '—';
  const part = fullLabel.split(',')[0].trim();
  return part.length > 22 ? part.slice(0, 21) + '…' : part;
}

// Virtual state derived from ride status + departureTime
export function virtualStatus(ride) {
  const status = ride.status;
  if (status === 'COMPLETED' || status === 'CANCELLED') return status;
  if (status === 'STARTED') return 'STARTED';
  const dep = ride.departureTime ? new Date(ride.departureTime).getTime() : null;
  if (!dep) return status;
  const now = Date.now();
  const diffMin = (dep - now) / 60000;
  if (diffMin < -30) return 'OVERDUE';
  if (diffMin < 0) return 'DELAYED';
  if (diffMin <= 30) return 'IMMINENT';
  return status; // CREATED or ACTIVE, departure far away
}

export interface GeocodeResult {
  address: string;
  locality: string;
}

/**
 * Reverse geocode latitude and longitude to a human-readable address
 * using OpenStreetMap's free Nominatim API.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CivicPulseAI/1.0 (contact: admin@civicpulse.org)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.address) return null;

    const addr = data.address;
    
    // Parse name components
    const road = addr.road || addr.pedestrian || addr.suburb || '';
    const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || '';
    const city = addr.city || addr.town || addr.village || '';
    const state = addr.state || '';
    
    // Determine a concise locality name (e.g. "Rajendra Nagar" or "Main Road")
    const locality = neighbourhood || road || city || state || 'Detected Area';

    // Format display address neatly
    // Nominatim's display_name can be very long (e.g. including postal codes, country, etc.)
    // We'll clean it up to show something readable
    const displayParts = [
      addr.house_number || addr.amenity,
      road,
      neighbourhood,
      city,
      addr.postcode
    ].filter(Boolean);

    const address = displayParts.length > 0 ? displayParts.join(', ') : data.display_name;

    return {
      address: address || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      locality: locality,
    };
  } catch (err) {
    console.error('[ReverseGeocode] Error:', err);
    return null;
  }
}

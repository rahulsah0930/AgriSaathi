import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG Pin Icon for Leaflet to avoid missing asset paths
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: grab;">
        <div style="position: absolute; width: 28px; height: 28px; background: rgba(34, 197, 94, 0.35); border-radius: 50%; box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);"></div>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
          <circle cx="12" cy="9" r="3.2" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
    popupAnchor: [0, -36]
  });
};

const MAHARASHTRA_DISTRICTS = [
  'Nashik', 'Pune', 'Ahmednagar', 'Aurangabad (Chhatrapati Sambhajinagar)',
  'Jalgaon', 'Dhule', 'Solapur', 'Satara', 'Kolhapur', 'Sangli',
  'Amravati', 'Nagpur', 'Latur', 'Nanded', 'Beed', 'Osmanabad (Dharashiv)'
];

const PRESET_HUBS = [
  { name: 'Dindori Farm Gate (Nashik)', lat: 20.1983, lng: 73.8344, village: 'Dindori', taluka: 'Dindori', district: 'Nashik', pincode: '422202', address: 'Gat No. 142, Dindori Farm Road' },
  { name: 'Lasalgaon APMC Yard', lat: 20.1472, lng: 74.2268, village: 'Lasalgaon', taluka: 'Niphad', district: 'Nashik', pincode: '422306', address: 'Near Main Onion Market Yard, Lasalgaon' },
  { name: 'Pimpalgaon Baswant', lat: 20.1706, lng: 73.9856, village: 'Pimpalgaon', taluka: 'Niphad', district: 'Nashik', pincode: '422209', address: 'Agro Processing Zone, Pimpalgaon' },
  { name: 'Narayangaon Hub (Pune)', lat: 19.1235, lng: 73.9782, village: 'Narayangaon', taluka: 'Junnar', district: 'Pune', pincode: '410504', address: 'Tomato Mandi Bypass, Narayangaon' }
];

export const LocationPicker = ({
  value = {},
  onChange,
  required = false,
  readOnly = false,
  title = "Farm Gate / Pickup Location"
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [latitude, setLatitude] = useState(value.latitude || 20.1983);
  const [longitude, setLongitude] = useState(value.longitude || 73.8344);
  const [address, setAddress] = useState(value.address || value.location || '');
  const [village, setVillage] = useState(value.village || '');
  const [taluka, setTaluka] = useState(value.taluka || '');
  const [district, setDistrict] = useState(value.district || 'Nashik');
  const [pincode, setPincode] = useState(value.pincode || '422202');
  const [state, setState] = useState(value.state || 'Maharashtra');

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [detectedSummary, setDetectedSummary] = useState(null);

  // Sync internal state if value changes externally
  useEffect(() => {
    if (value.latitude && value.latitude !== latitude) setLatitude(value.latitude);
    if (value.longitude && value.longitude !== longitude) setLongitude(value.longitude);
    if (value.address !== undefined && value.address !== address) setAddress(value.address);
    if (value.village !== undefined && value.village !== village) setVillage(value.village);
    if (value.taluka !== undefined && value.taluka !== taluka) setTaluka(value.taluka);
    if (value.district !== undefined && value.district !== district) setDistrict(value.district);
    if (value.pincode !== undefined && value.pincode !== pincode) setPincode(value.pincode);
  }, [value.latitude, value.longitude, value.address, value.district]);

  // Notify parent of updates
  const notifyChange = useCallback((updatedFields) => {
    if (onChange) {
      onChange({
        latitude: updatedFields.latitude !== undefined ? updatedFields.latitude : latitude,
        longitude: updatedFields.longitude !== undefined ? updatedFields.longitude : longitude,
        address: updatedFields.address !== undefined ? updatedFields.address : address,
        village: updatedFields.village !== undefined ? updatedFields.village : village,
        taluka: updatedFields.taluka !== undefined ? updatedFields.taluka : taluka,
        district: updatedFields.district !== undefined ? updatedFields.district : district,
        pincode: updatedFields.pincode !== undefined ? updatedFields.pincode : pincode,
        state: updatedFields.state !== undefined ? updatedFields.state : state,
        location: updatedFields.address || address || `${updatedFields.village || village || 'Farm Gate'}, ${updatedFields.district || district || 'Nashik'}`
      });
    }
  }, [onChange, latitude, longitude, address, village, taluka, district, pincode, state]);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedVillage = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || addr.town || '';
          const detectedTaluka = addr.county || addr.subdistrict || addr.tehsil || '';
          const detectedDistrict = addr.state_district || addr.city || district || 'Nashik';
          const detectedPincode = addr.postcode || pincode || '';
          const detectedDisplay = data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : '';

          setDetectedSummary(detectedDisplay || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);

          // Update fields if currently empty or detected
          const updates = { latitude: lat, longitude: lng };
          if (detectedVillage && !village) {
            setVillage(detectedVillage);
            updates.village = detectedVillage;
          }
          if (detectedTaluka && !taluka) {
            setTaluka(detectedTaluka);
            updates.taluka = detectedTaluka;
          }
          if (detectedPincode && (!pincode || pincode.length !== 6)) {
            setPincode(detectedPincode);
            updates.pincode = detectedPincode;
          }
          if (!address && detectedDisplay) {
            setAddress(detectedDisplay);
            updates.address = detectedDisplay;
          }
          notifyChange(updates);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode lookup skipped or timed out:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = latitude || 20.1983;
      const initialLng = longitude || 73.8344;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: !readOnly
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        icon: createCustomPinIcon(),
        draggable: !readOnly
      }).addTo(map);

      if (!readOnly) {
        // Drag marker to adjust location
        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          const newLat = parseFloat(pos.lat.toFixed(6));
          const newLng = parseFloat(pos.lng.toFixed(6));
          setLatitude(newLat);
          setLongitude(newLng);
          notifyChange({ latitude: newLat, longitude: newLng });
          reverseGeocode(newLat, newLng);
        });

        // Click on map to place marker
        map.on('click', (e) => {
          const newLat = parseFloat(e.latlng.lat.toFixed(6));
          const newLng = parseFloat(e.latlng.lng.toFixed(6));
          marker.setLatLng([newLat, newLng]);
          setLatitude(newLat);
          setLongitude(newLng);
          notifyChange({ latitude: newLat, longitude: newLng });
          reverseGeocode(newLat, newLng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Ensure proper sizing in reactive containers
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position when latitude or longitude changes
  const updateMapMarker = (lat, lng, zoomLevel = 15) => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], zoomLevel, { animate: true });
    }
  };

  // Browser GPS Geolocation Handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser. Please select your farm on the map below.");
      return;
    }

    setIsDetectingGps(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const rawLat = position.coords.latitude;
        const rawLng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);

        const newLat = parseFloat(rawLat.toFixed(6));
        const newLng = parseFloat(rawLng.toFixed(6));

        setLatitude(newLat);
        setLongitude(newLng);
        setGpsAccuracy(acc);
        setIsDetectingGps(false);

        updateMapMarker(newLat, newLng, 16);
        notifyChange({ latitude: newLat, longitude: newLng });
        reverseGeocode(newLat, newLng);
      },
      (error) => {
        setIsDetectingGps(false);
        let msg = "Could not retrieve GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access was denied. Please allow location permissions or click directly on the interactive map.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS position is unavailable. You can click on the map to pinpoint your farm.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Please try again or select your location on the map.";
        }
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Preset location selection
  const handleSelectPreset = (hub) => {
    setLatitude(hub.lat);
    setLongitude(hub.lng);
    setVillage(hub.village);
    setTaluka(hub.taluka);
    setDistrict(hub.district);
    setPincode(hub.pincode);
    setAddress(hub.address);
    setGpsAccuracy(null);
    setGeoError(null);

    updateMapMarker(hub.lat, hub.lng, 15);
    notifyChange({
      latitude: hub.lat,
      longitude: hub.lng,
      village: hub.village,
      taluka: hub.taluka,
      district: hub.district,
      pincode: hub.pincode,
      address: hub.address,
      state: 'Maharashtra'
    });
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
              <p className="text-xs text-gray-500">Accurate GPS farm gate coordinates for logistics and buyer pickup</p>
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isDetectingGps}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-medium shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isDetectingGps ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Acquiring GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use Current GPS Location</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* GPS Accuracy / Error feedback */}
      {geoError && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{geoError}</p>
            <p className="mt-0.5 text-amber-700">You can click anywhere on the map or select a nearby agricultural hub below.</p>
          </div>
        </div>
      )}

      {gpsAccuracy !== null && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span><strong>GPS Coordinates Locked:</strong> {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-[11px]">
            ±{gpsAccuracy}m Accuracy
          </span>
        </div>
      )}

      {/* Quick Agricultural Presets for easy testing */}
      {!readOnly && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Compass className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">Quick Agri-Hub Presets:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_HUBS.map((hub) => (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                className="px-2.5 py-1 text-xs bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-gray-200 rounded-md text-gray-700 transition"
              >
                {hub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leaflet Interactive Map Container */}
      <div className="mt-4 relative rounded-xl overflow-hidden border border-gray-200 shadow-inner">
        <div
          ref={mapContainerRef}
          style={{ height: '320px', width: '100%', zIndex: 1 }}
          className="bg-gray-100"
        />

        {/* Floating Coordinates Tag */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-lg shadow-md px-3 py-1.5 text-xs flex items-center gap-2 text-gray-800">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono font-medium">{latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</span>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
            className="text-emerald-600 hover:text-emerald-800 ml-1 p-0.5 hover:bg-emerald-50 rounded"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Map Drag / Click Hint */}
        {!readOnly && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/85 text-white backdrop-blur-sm rounded-md px-2.5 py-1 text-[11px] shadow">
            💡 Click on the map or drag the green marker to adjust pinpoint
          </div>
        )}

        {isReverseGeocoding && (
          <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 text-gray-700 backdrop-blur-sm rounded-md px-2 py-1 text-[11px] shadow flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
            <span>Resolving locality...</span>
          </div>
        )}
      </div>

      {/* Structured Address Form Fields */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {/* Address / Landmark */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Farm Gate Address / Gat No. / Landmark {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={address}
            readOnly={readOnly}
            onChange={(e) => {
              setAddress(e.target.value);
              notifyChange({ address: e.target.value });
            }}
            placeholder="e.g. Gat No. 142, Near APMC Sub-Yard, Dindori Road"
            className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${readOnly ? 'bg-gray-50 text-gray-700' : 'bg-white'}`}
          />
        </div>

        {/* Village / Area */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Village / Locality {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={village}
            readOnly={readOnly}
            onChange={(e) => {
              setVillage(e.target.value);
              notifyChange({ village: e.target.value });
            }}
            placeholder="e.g. Dindori"
            className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${readOnly ? 'bg-gray-50 text-gray-700' : 'bg-white'}`}
          />
        </div>

        {/* Taluka */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Taluka / Tehsil
          </label>
          <input
            type="text"
            value={taluka}
            readOnly={readOnly}
            onChange={(e) => {
              setTaluka(e.target.value);
              notifyChange({ taluka: e.target.value });
            }}
            placeholder="e.g. Dindori / Niphad"
            className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${readOnly ? 'bg-gray-50 text-gray-700' : 'bg-white'}`}
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            District {required && <span className="text-red-500">*</span>}
          </label>
          {readOnly ? (
            <input
              type="text"
              value={district}
              readOnly
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
            />
          ) : (
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                notifyChange({ district: e.target.value });
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {MAHARASHTRA_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          )}
        </div>

        {/* PIN Code */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            PIN Code {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            readOnly={readOnly}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(val);
              notifyChange({ pincode: val });
            }}
            placeholder="e.g. 422202"
            className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono ${readOnly ? 'bg-gray-50 text-gray-700' : 'bg-white'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;

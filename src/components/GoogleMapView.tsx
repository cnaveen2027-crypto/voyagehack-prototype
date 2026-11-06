import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMapComponent,
  AdvancedMarker,
  InfoWindow,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap
} from '@vis.gl/react-google-maps';
import { useTrip } from '../context/TripContext';
import { TravelAPI } from '../services/api';
import {
  MapPin,
  Hotel,
  Compass,
  Calendar,
  ExternalLink,
  Search,
  Sparkles,
  Layers,
  Utensils,
  Camera,
  Navigation,
  Loader2,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Globe,
  Move
} from 'lucide-react';

interface MarkerData {
  id: string;
  title: string;
  description: string;
  category: 'Destination' | 'Activity' | 'Stay' | 'Attraction' | 'Dining';
  position: { lat: number; lng: number };
  badge?: string;
  dayNumber?: number;
}

// Inner Controller that smoothly pans the Google Map camera whenever the user selects or searches a location
const GoogleMapCameraController: React.FC<{
  targetCenter: { lat: number; lng: number };
  zoomLevel: number;
}> = ({ targetCenter, zoomLevel }) => {
  const map = useMap();
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!map || !targetCenter) return;

    const prev = prevCenterRef.current;
    if (!prev || Math.abs(prev.lat - targetCenter.lat) > 0.0001 || Math.abs(prev.lng - targetCenter.lng) > 0.0001) {
      // Smooth animated pan to new coordinates like Google Maps
      map.panTo(targetCenter);
      map.setZoom(zoomLevel);
      prevCenterRef.current = targetCenter;
    }
  }, [map, targetCenter, zoomLevel]);

  return null;
};

// Fallback Interactive Tile Map with full real-time Touch & Mouse Swipe / Drag Physics
const InteractiveFallbackMap: React.FC<{
  center: { lat: number; lng: number };
  onCenterChange: (newCenter: { lat: number; lng: number }) => void;
  markers: MarkerData[];
  selectedMarker: MarkerData | null;
  onSelectMarker: (marker: MarkerData | null) => void;
  locationName: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}> = ({
  center,
  onCenterChange,
  markers,
  selectedMarker,
  onSelectMarker,
  locationName,
  zoomLevel,
  onZoomIn,
  onZoomOut,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, lat: center.lat, lng: center.lng });
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Convert lat/lng to tile coordinate calculations
  const latRad = (center.lat * Math.PI) / 180;
  const n = Math.pow(2, zoomLevel);
  const xTile = Math.floor(((center.lng + 180) / 360) * n);
  const yTile = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);

  // Swipe / Drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setIsGrabbing(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lat: center.lat,
      lng: center.lng,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || 600;

    // Degrees per pixel based on current zoom level
    const degreesPerPixelLng = 360 / (256 * Math.pow(2, zoomLevel));
    const degreesPerPixelLat = 180 / (256 * Math.pow(2, zoomLevel));

    let newLng = dragStartRef.current.lng - dx * degreesPerPixelLng;
    let newLat = dragStartRef.current.lat + dy * degreesPerPixelLat;

    // Wrap longitude and clamp latitude
    while (newLng > 180) newLng -= 360;
    while (newLng < -180) newLng += 360;
    newLat = Math.max(-85, Math.min(85, newLat));

    onCenterChange({ lat: newLat, lng: newLng });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // Safe catch
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onZoomIn();
    } else {
      onZoomOut();
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className={`w-full h-full relative bg-slate-950 overflow-hidden flex flex-col select-none touch-none ${
        isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 5x5 Extended Interactive Tile Grid for seamless swiping */}
      <div className="flex-1 w-full relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 filter brightness-95 contrast-125 opacity-90 pointer-events-none scale-125">
          {[-2, -1, 0, 1, 2].map((dy) =>
            [-2, -1, 0, 1, 2].map((dx) => {
              const tileX = (xTile + dx + n) % n;
              const tileY = Math.max(0, Math.min(n - 1, yTile + dy));
              const tileUrl = `https://tile.openstreetmap.org/${zoomLevel}/${tileX}/${tileY}.png`;
              return (
                <div key={`${dx}_${dy}`} className="w-full h-full overflow-hidden bg-slate-900 border border-slate-800/30">
                  <img
                    src={tileUrl}
                    alt=""
                    className="w-full h-full object-cover filter invert hue-rotate-180 contrast-90"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Markers Projected Around Center */}
        <div className="absolute inset-0 pointer-events-none">
          {markers.map((marker) => {
            const isSelected = selectedMarker?.id === marker.id;
            const deltaLng = marker.position.lng - center.lng;
            const deltaLat = marker.position.lat - center.lat;
            const scale = Math.pow(2, zoomLevel - 10) * 120;
            const leftPct = 50 + deltaLng * scale;
            const topPct = 50 - deltaLat * scale;

            if (leftPct < -10 || leftPct > 110 || topPct < -10 || topPct > 110) return null;

            return (
              <div
                key={marker.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMarker(marker);
                }}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-20 group transition-transform duration-200 hover:scale-125"
              >
                <div
                  className={`px-2.5 py-1 rounded-full shadow-2xl border text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected ? 'ring-4 ring-blue-500 scale-110' : ''
                  } ${
                    marker.category === 'Destination'
                      ? 'bg-blue-600 text-white border-blue-400'
                      : marker.category === 'Stay'
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : marker.category === 'Attraction'
                      ? 'bg-purple-600 text-white border-purple-400'
                      : marker.category === 'Dining'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-cyan-600 text-white border-cyan-400'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{marker.badge || marker.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Target Indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400/80 rounded-full pointer-events-none animate-ping" />

        {/* Floating Swipe Help Hint */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-xl text-xs text-slate-200 pointer-events-none">
          <Move className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Swipe or drag anywhere to pan map • {locationName}</span>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-1.5 rounded-xl shadow-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onZoomIn();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onZoomOut();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      {/* Selected Marker Detail Card Drawer */}
      {selectedMarker && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-30 shadow-2xl">
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {selectedMarker.badge || selectedMarker.category}
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">{selectedMarker.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{selectedMarker.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-400">
              {selectedMarker.position.lat.toFixed(4)}, {selectedMarker.position.lng.toFixed(4)}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedMarker.position.lat},${selectedMarker.position.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>View in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onSelectMarker(null)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Inner Google Maps loader that uses useApiLoadingStatus() and native gestures
const GoogleMapInner: React.FC<{
  mapCenter: { lat: number; lng: number };
  onCenterChange: (newCenter: { lat: number; lng: number }) => void;
  zoomLevel: number;
  mapTypeId: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  allMarkers: MarkerData[];
  selectedMarker: MarkerData | null;
  onSelectMarker: (marker: MarkerData | null) => void;
  getMarkerBadgeStyle: (cat: string) => string;
  currentLocationName: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
}> = ({
  mapCenter,
  onCenterChange,
  zoomLevel,
  mapTypeId,
  allMarkers,
  selectedMarker,
  onSelectMarker,
  getMarkerBadgeStyle,
  currentLocationName,
  onZoomIn,
  onZoomOut,
}) => {
  const status = useApiLoadingStatus();

  // If Google Maps JavaScript API fails to load or auth fails in the iframe environment
  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <InteractiveFallbackMap
        center={mapCenter}
        onCenterChange={onCenterChange}
        markers={allMarkers}
        selectedMarker={selectedMarker}
        onSelectMarker={onSelectMarker}
        locationName={currentLocationName}
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
    );
  }

  if (status === APILoadingStatus.LOADING) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium">Loading Google Maps live view for {currentLocationName}...</p>
      </div>
    );
  }

  return (
    <GoogleMapComponent
      style={{ width: '100%', height: '100%' }}
      defaultCenter={mapCenter}
      defaultZoom={zoomLevel}
      mapTypeId={mapTypeId}
      gestureHandling="greedy"
      disableDefaultUI={false}
      onCameraChanged={(e) => {
        if (e.detail.center) {
          onCenterChange({ lat: e.detail.center.lat, lng: e.detail.center.lng });
        }
      }}
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
    >
      {/* Pan Controller to fly smoothly to new destinations */}
      <GoogleMapCameraController targetCenter={mapCenter} zoomLevel={zoomLevel} />

      {allMarkers.map((marker) => {
        const isSelected = selectedMarker?.id === marker.id;

        return (
          <AdvancedMarker
            key={marker.id}
            position={marker.position}
            onClick={() => onSelectMarker(marker)}
          >
            <div
              className={`cursor-pointer transform transition-all duration-200 hover:scale-115 flex items-center justify-center ${
                isSelected ? 'scale-125 z-50' : 'z-10'
              }`}
            >
              <div
                className={`px-2.5 py-1 rounded-full shadow-xl border text-xs font-bold flex items-center gap-1.5 ${getMarkerBadgeStyle(
                  marker.category
                )}`}
              >
                {marker.category === 'Destination' && <MapPin className="w-3.5 h-3.5" />}
                {marker.category === 'Stay' && <Hotel className="w-3.5 h-3.5" />}
                {marker.category === 'Attraction' && <Camera className="w-3.5 h-3.5" />}
                {marker.category === 'Dining' && <Utensils className="w-3.5 h-3.5" />}
                {marker.category === 'Activity' && <Calendar className="w-3.5 h-3.5" />}
                <span>{marker.badge || marker.title}</span>
              </div>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Selected Info Window */}
      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => onSelectMarker(null)}
        >
          <div className="p-2 max-w-xs text-slate-900">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              {selectedMarker.badge || selectedMarker.category}
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-0.5">{selectedMarker.title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedMarker.description}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {selectedMarker.position.lat.toFixed(4)}, {selectedMarker.position.lng.toFixed(4)}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedMarker.position.lat},${selectedMarker.position.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMapComponent>
  );
};

export const GoogleMapView: React.FC = () => {
  const { activeTrip, updateActiveTrip } = useTrip();

  // Provisioned Google Maps API Key
  const [apiKey, setApiKey] = useState<string>('AIzaSyB3rYwg-YlIGlOk4YjZyyki-kFoX68K0Kk');
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  // Search input for any destination worldwide
  const [searchInput, setSearchInput] = useState<string>(activeTrip.destination || '');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [currentLocationName, setCurrentLocationName] = useState<string>(
    activeTrip.destination || 'Enter Any Destination Worldwide'
  );

  // Dynamic Center & Zoom
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 20.0,
    lng: 0.0,
  }); // Neutral global center by default
  const [zoomLevel, setZoomLevel] = useState<number>(3);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Dynamic POIs around the geocoded location
  const [dynamicPois, setDynamicPois] = useState<MarkerData[]>([]);

  // Load API key from server config or env on mount
  useEffect(() => {
    const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (envKey && envKey !== 'MY_GOOGLE_MAPS_API_KEY') {
      setApiKey(envKey);
    } else {
      TravelAPI.getMapsConfig().then((cfg) => {
        if (cfg.apiKey) {
          setApiKey(cfg.apiKey);
        }
      });
    }
  }, []);

  // Generate dynamic POIs around any center coordinates based on location
  const generatePoisForLocation = (center: { lat: number; lng: number }, name: string) => {
    const pois: MarkerData[] = [];

    // Main Center Anchor
    pois.push({
      id: `dest_main_${Date.now()}`,
      title: name || 'City Center',
      description: `Primary destination hub and orientation district in ${name}.`,
      category: 'Destination',
      position: center,
      badge: 'City Center',
    });

    // Attraction 1 (North-East)
    pois.push({
      id: `attract_1_${Date.now()}`,
      title: `${name} Historic Landmark & Square`,
      description: `Famous heritage architecture, walking promenades, and cultural landmarks.`,
      category: 'Attraction',
      position: { lat: center.lat + 0.008, lng: center.lng + 0.007 },
      badge: 'Top Landmark',
    });

    // Attraction 2 (South-West)
    pois.push({
      id: `attract_2_${Date.now()}`,
      title: `${name} Scenic Viewpoint & Gardens`,
      description: `Panoramic vistas, botanical pathways, and prime photography spots.`,
      category: 'Attraction',
      position: { lat: center.lat - 0.007, lng: center.lng - 0.006 },
      badge: 'Scenic View',
    });

    // Stay / Hotel
    pois.push({
      id: `stay_rec_${Date.now()}`,
      title: `${name} Grand Boutique Stay`,
      description: `Luxury boutique accommodations with rooftop lounge and artisan breakfast.`,
      category: 'Stay',
      position: { lat: center.lat + 0.004, lng: center.lng - 0.005 },
      badge: 'Recommended Stay',
    });

    // Dining Spot
    pois.push({
      id: `dining_rec_${Date.now()}`,
      title: `Bistro & Gourmet Food Market`,
      description: `Authentic regional delicacies, street food stalls, and local culinary specialties.`,
      category: 'Dining',
      position: { lat: center.lat - 0.004, lng: center.lng + 0.006 },
      badge: 'Culinary Hotspot',
    });

    return pois;
  };

  // Perform Geocode for any location worldwide
  const geocodeLocation = async (placeName: string) => {
    if (!placeName.trim()) return;
    setIsGeocoding(true);

    try {
      const res = await TravelAPI.geocode(placeName);
      if (res && res.location) {
        setMapCenter(res.location);
        setZoomLevel(13);
        setCurrentLocationName(res.formattedAddress || placeName);

        // Generate tailored POIs
        const newPois = generatePoisForLocation(res.location, placeName);
        setDynamicPois(newPois);
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    } finally {
      setIsGeocoding(false);
    }
  };

  // When activeTrip destination changes or on initial load
  useEffect(() => {
    if (activeTrip.destination && activeTrip.destination.trim()) {
      setSearchInput(activeTrip.destination);
      geocodeLocation(activeTrip.destination);
    }
  }, [activeTrip.destination]);

  // Combine dynamic POIs with any generated Itinerary stops
  const allMarkers: MarkerData[] = [...dynamicPois];

  if (activeTrip.itinerary?.days) {
    activeTrip.itinerary.days.forEach((day) => {
      if (day.morning?.coordinates) {
        allMarkers.push({
          id: `day_${day.dayNumber}_morning`,
          title: day.morning.title,
          description: `${day.morning.locationName} (${day.morning.duration}) • Cost: ${activeTrip.currency} ${day.morning.estimatedCost}`,
          category: 'Activity',
          position: day.morning.coordinates,
          badge: `Day ${day.dayNumber} Morning`,
          dayNumber: day.dayNumber,
        });
      }
      if (day.afternoon?.coordinates) {
        allMarkers.push({
          id: `day_${day.dayNumber}_afternoon`,
          title: day.afternoon.title,
          description: `${day.afternoon.locationName} • Dining: ${day.afternoon.culinaryRecommendation?.dish || 'Regional Special'}`,
          category: 'Activity',
          position: day.afternoon.coordinates,
          badge: `Day ${day.dayNumber} Afternoon`,
          dayNumber: day.dayNumber,
        });
      }
      if (day.evening?.coordinates) {
        allMarkers.push({
          id: `day_${day.dayNumber}_evening`,
          title: day.evening.title,
          description: `${day.evening.locationName} (${day.evening.duration}) • Cost: ${activeTrip.currency} ${day.evening.estimatedCost}`,
          category: 'Activity',
          position: day.evening.coordinates,
          badge: `Day ${day.dayNumber} Evening`,
          dayNumber: day.dayNumber,
        });
      }
    });
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      geocodeLocation(searchInput.trim());
      updateActiveTrip({
        destination: searchInput.trim(),
        title: `Voyage to ${searchInput.trim().split(',')[0]}`,
      });
    }
  };

  const handleSetAsActiveDestination = () => {
    updateActiveTrip({
      destination: currentLocationName,
      title: `Voyage to ${currentLocationName.split(',')[0]}`,
    });
  };

  const getMarkerBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'Destination':
        return 'bg-blue-600 text-white border-blue-400';
      case 'Stay':
        return 'bg-amber-500 text-slate-950 border-amber-300';
      case 'Attraction':
        return 'bg-purple-600 text-white border-purple-400';
      case 'Dining':
        return 'bg-emerald-600 text-white border-emerald-400';
      default:
        return 'bg-cyan-600 text-white border-cyan-400';
    }
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] min-h-[550px] relative flex flex-col bg-slate-950">
      {/* Top Search & Destination Navigator Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 z-10 shadow-md">
        {/* Dynamic Search Box for ANY location worldwide */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Type ANY city, island, or region worldwide (e.g. Honolulu, Rome, Bali, Kyoto)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isGeocoding}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            <span>Go</span>
          </button>
        </form>

        {/* Current Active Location Tag & Set as Trip Destination Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white max-w-[200px] truncate">{currentLocationName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
              {allMarkers.length} POIs
            </span>
          </div>

          <button
            type="button"
            onClick={handleSetAsActiveDestination}
            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Set as Trip Destination</span>
          </button>

          {/* Map Type Mode */}
          <select
            value={mapTypeId}
            onChange={(e: any) => setMapTypeId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="roadmap">Map View</option>
            <option value="satellite">Satellite</option>
            <option value="hybrid">Hybrid</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="flex-1 w-full h-full relative">
        <APIProvider apiKey={apiKey}>
          <GoogleMapInner
            mapCenter={mapCenter}
            onCenterChange={setMapCenter}
            zoomLevel={zoomLevel}
            mapTypeId={mapTypeId}
            allMarkers={allMarkers}
            selectedMarker={selectedMarker}
            onSelectMarker={setSelectedMarker}
            getMarkerBadgeStyle={getMarkerBadgeStyle}
            currentLocationName={currentLocationName}
            onZoomIn={() => setZoomLevel((z) => Math.min(18, z + 1))}
            onZoomOut={() => setZoomLevel((z) => Math.max(2, z - 1))}
          />
        </APIProvider>
      </div>
    </div>
  );
};

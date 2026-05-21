'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Map, Marker } from 'mapbox-gl';
import { 
  Menu, X, MapPin, Navigation, Loader2, Save, CheckCircle2
} from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
  address: string;
  deliveryRadiusKm: number;
  pricePerKm: number;
}

const DEFAULT_COORDS: Coordinates = {
  lat: -0.6817,
  lng: 34.7717,
  address: 'Kisii, Kenya',
  deliveryRadiusKm: 5,
  pricePerKm: 0
};

export default function RestaurantLocationPage() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Checking your current location...');
  
  const [coords, setCoords] = useState<Coordinates>(DEFAULT_COORDS);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const coordsRef = useRef<Coordinates>(DEFAULT_COORDS);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!MAPBOX_TOKEN) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`);
      const data = await res.json();
      return data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (err) {
      console.error('Failed to resolve current address:', err);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, [MAPBOX_TOKEN]);

  const getCurrentCoordinates = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const address = await reverseGeocode(lat, lng);

    return { lat, lng, address };
  }, [reverseGeocode]);

  const fetchSavedLocation = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurant-location');
      if (!res.ok) return null;

      const data = await res.json();
      if (data && data.lat && data.lng) {
        return {
          ...DEFAULT_COORDS,
          ...data,
          deliveryRadiusKm: Number(data.deliveryRadiusKm ?? DEFAULT_COORDS.deliveryRadiusKm),
          pricePerKm: Number(data.pricePerKm ?? DEFAULT_COORDS.pricePerKm),
        } as Coordinates;
      }
    } catch (err) {
      console.error('Failed to load saved location:', err);
    }

    return null;
  }, []);

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    setLocationMessage('Detecting your current location...');

    try {
      const currentCoords = await getCurrentCoordinates();
      setCoords((prev) => ({ ...prev, ...currentCoords }));
      setLocationMessage('Using your browser detected current location.');
    } catch (err) {
      console.error('Failed to detect current location:', err);
      alert('Could not detect your current location. Please allow location permission in your browser.');
      setLocationMessage('Could not detect current location.');
    } finally {
      setLocating(false);
    }
  }, [getCurrentCoordinates]);

  // 1. Prefer live browser location. Saved/default location is only a fallback.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialLocation() {
      setLoading(true);

      try {
        const currentCoords = await getCurrentCoordinates();
        if (cancelled) return;

        setCoords((prev) => ({ ...prev, ...currentCoords }));
        setLocationMessage('Using your browser detected current location.');
      } catch (err) {
        console.error('Current location unavailable:', err);
        const savedLocation = await fetchSavedLocation();
        if (cancelled) return;

        if (savedLocation) {
          setCoords(savedLocation);
          setLocationMessage('Using saved restaurant location. Allow browser location to use your current position.');
        } else {
          setCoords(DEFAULT_COORDS);
          setLocationMessage('Using default Kisii location. Allow browser location to use your current position.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialLocation();

    return () => {
      cancelled = true;
    };
  }, [fetchSavedLocation, getCurrentCoordinates]);

  useEffect(() => {
    coordsRef.current = coords;

    if (!mapRef.current || !markerRef.current) return;

    mapRef.current.setCenter([coords.lng, coords.lat]);
    markerRef.current.setLngLat([coords.lng, coords.lat]);
  }, [coords]);

  // 2. Load Mapbox GL JS engine
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!document.getElementById('mapbox-core-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-core-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    import('mapbox-gl').then((mapboxglModule) => {
      const mapboxgl = mapboxglModule.default;
      const initialCoords = coordsRef.current;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [initialCoords.lng, initialCoords.lat],
        zoom: 14, // Zoomed in a bit closer
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const marker = new mapboxgl.Marker({
        draggable: true,
        color: '#ea580c'
      })
      .setLngLat([initialCoords.lng, initialCoords.lat])
      .addTo(map);

      const updateCoordinatesPosition = async (lat: number, lng: number) => {
        marker.setLngLat([lng, lat]);

        try {
          const readableAddress = await reverseGeocode(lat, lng);
          
          setCoords((prev) => ({ ...prev, lat, lng, address: readableAddress }));
        } catch {
          setCoords((prev) => ({ ...prev, lat, lng }));
        }
      };

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        updateCoordinatesPosition(lngLat.lat, lngLat.lng);
      });

      map.on('click', (event) => {
        updateCoordinatesPosition(event.lngLat.lat, event.lngLat.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    }).catch((err) => {
      console.error('Failed to load Mapbox:', err);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [MAPBOX_TOKEN, loading, reverseGeocode]); // Wait until initial location checks finish

  // Handle saving pinned location metrics
  const handleSaveLocation = async () => {
    setSaving(true);
    try {
      await fetch('/api/restaurant-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      alert('Failed to save location data metrics.');
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { href: '/staff/location', label: 'Restaurant Location', icon: MapPin },
  ];

  const StaffNav = ({ onNavigate, variant = 'sidebar' }: { onNavigate?: () => void; variant?: 'sidebar' | 'mobile' }) => (
    <nav className={variant === 'mobile' ? 'flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden' : 'flex-1 px-4 space-y-1'}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center rounded-xl transition-all font-semibold ${variant === 'mobile' ? 'shrink-0 gap-2 px-3 py-2 text-xs' : 'space-x-3 px-4 py-3'} ${active ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Icon size={variant === 'mobile' ? 16 : 20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 text-center">
          <h1 className="text-xl font-bold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">African Cuisine</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Staff Panel</p>
        </div>
        <StaffNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <h1 className="text-base font-black bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">African Cuisine</h1>
            <p className="text-[9px] text-slate-500 font-bold tracking-[0.18em] uppercase">Staff Panel</p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
            <Menu size={22} />
          </button>
        </header>
        <StaffNav variant="mobile" />

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button type="button" className="absolute inset-0 bg-slate-900/45" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex h-full w-[min(19rem,85vw)] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between p-5">
                <div>
                  <h1 className="text-lg font-bold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">African Cuisine</h1>
                  <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Staff Panel</p>
                </div>
                <button type="button" onClick={() => setSidebarOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <StaffNav onNavigate={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">Restaurant Hub Location</h2>
                <p className="text-slate-500 mt-1">Set the precise base location coordinates used to calculate dynamic delivery radius fees.</p>
                <p className="mt-2 text-xs font-semibold text-orange-600">{locationMessage}</p>
              </div>
              {success && (
                <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                  <CheckCircle2 size={18} /><span className="font-medium text-sm">Coordinates Saved!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-4">
                {loading ? (
                  <div className="w-full h-125 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400" style={{ minHeight: '450px' }}>
                    <Loader2 className="animate-spin text-orange-500 mr-2" size={24} />
                    <span className="text-sm font-bold uppercase tracking-wider">Locating Hub...</span>
                  </div>
                ) : (
                  <div 
                    ref={mapContainerRef} 
                    className="w-full h-125 rounded-2xl overflow-hidden bg-slate-100 shadow-inner"
                    style={{ minHeight: '450px' }}
                  />
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Navigation size={14} className="text-orange-600" /> Active Pin Anchor
                  </h3>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latitude</span>
                      <code className="text-xs font-mono font-bold text-slate-700">{coords.lat.toFixed(6)}</code>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Longitude</span>
                      <code className="text-xs font-mono font-bold text-slate-700">{coords.lng.toFixed(6)}</code>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved Address</span>
                      <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed">{coords.address}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    * Drag the orange pin or click the map to accurately align with the physical storefront point.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Delivery Radius (km)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={coords.deliveryRadiusKm}
                        onChange={(event) => setCoords((prev) => ({
                          ...prev,
                          deliveryRadiusKm: Math.max(0, Number(event.target.value) || 0),
                        }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Price Per Km</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={coords.pricePerKm}
                        onChange={(event) => setCoords((prev) => ({
                          ...prev,
                          pricePerKm: Math.max(0, Number(event.target.value) || 0),
                        }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-500"
                      />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Delivery Pricing</span>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      KSh {coords.pricePerKm.toLocaleString()} per km within {coords.deliveryRadiusKm.toLocaleString()} km
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                    {locating ? 'Detecting Location...' : 'Use My Current Location'}
                  </button>

                  <button
                    onClick={handleSaveLocation}
                    disabled={saving || !MAPBOX_TOKEN}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Syncing Coordinates...' : 'Save Hub Location'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

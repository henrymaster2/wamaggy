'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Navigation, ShoppingCart, Loader2, Plus, Minus, Check, X } from 'lucide-react';
import Link from 'next/link';

// 1. Unified Types matching the backend database models
interface FoodItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  status: string;
}

interface CartItem extends FoodItem {
  quantity: number;
}

interface LocationData {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface RestaurantLocation {
  address: string;
  lat: number;
  lng: number;
  deliveryRadiusKm: number;
  pricePerKm: number;
}

const getDistanceKm = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) => {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function OrderFoods() {
  // Food fetching states
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodSearch, setFoodSearch] = useState('');

  // Cart & UI states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [location, setLocation] = useState<LocationData>({ address: '', lat: null, lng: null });
  const [restaurantLocation, setRestaurantLocation] = useState<RestaurantLocation | null>(null);
  
  // Mapbox Autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // 2. Fetch Available Foods from API (Matches BookMeals approach)
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch('/api/food');
        if (!res.ok) throw new Error('Failed to fetch foods');

        const data = await res.json();
        setFoods(data.filter((food: FoodItem) => food.status === 'Available'));
      } catch (err) {
        console.error('Error fetching menu items:', err);
      } finally {
        setLoadingFoods(false);
      }
    };

    fetchFoods();
  }, []);

  useEffect(() => {
    const fetchRestaurantLocation = async () => {
      try {
        const res = await fetch('/api/restaurant-location');
        if (!res.ok) return;

        const data = await res.json();
        if (data?.lat && data?.lng) {
          setRestaurantLocation({
            address: data.address,
            lat: Number(data.lat),
            lng: Number(data.lng),
            deliveryRadiusKm: Number(data.deliveryRadiusKm || 0),
            pricePerKm: Number(data.pricePerKm || 0),
          });
        }
      } catch (err) {
        console.error('Failed to fetch restaurant location:', err);
      }
    };

    fetchRestaurantLocation();
  }, []);

  // 3. Client Side Menu Search Filtering
  const filteredFoods = useMemo(() => {
    const search = foodSearch.trim().toLowerCase();
    if (!search) return foods;

    return foods.filter((food) =>
      `${food.name} ${food.category || ''}`.toLowerCase().includes(search)
    );
  }, [foods, foodSearch]);

  // 4. Mapbox Autocomplete Fetching
  useEffect(() => {
    if (searchQuery.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchQuery)}&language=en&proximity=36.8219,-1.2921&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error('Failed to fetch address suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, MAPBOX_TOKEN]);

  // 5. Handle Selecting an Autocomplete Address
  const handleSelectSuggestion = async (mapboxId: string, fullAddress: string) => {
    setSuggestions([]);
    setSearchQuery('');
    setLoadingLocation(true);

    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.features && data.features[0]) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setLocation({ address: fullAddress, lat, lng });
      }
    } catch (err) {
      console.error('Failed to retrieve location coordinates:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  // 6. Native Browser Geolocation Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`;
          const res = await fetch(url);
          const data = await res.json();
          const placeName = data.features?.[0]?.place_name || 'Detected Current Location';
          
          setLocation({ address: placeName, lat: latitude, lng: longitude });
        } catch (err) {
          setLocation({ address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        alert('Could not auto-detect location. Please type your address manually.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 7. Cart Core Mechanics
  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing?.quantity === 1) {
        return prev.filter((i) => i.id !== id);
      }
      return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const getQuantity = (id: number) => cart.find((i) => i.id === id)?.quantity || 0;
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const selectedItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const deliveryDistanceKm = restaurantLocation && location.lat && location.lng
    ? getDistanceKm(restaurantLocation, { lat: location.lat, lng: location.lng })
    : 0;
  const deliveryFee = restaurantLocation && deliveryDistanceKm
    ? Math.round(deliveryDistanceKm * restaurantLocation.pricePerKm)
    : 0;
  const isOutsideDeliveryRadius = Boolean(
    restaurantLocation?.deliveryRadiusKm &&
    deliveryDistanceKm > restaurantLocation.deliveryRadiusKm
  );
  const orderTotal = subtotal + deliveryFee;

  const submitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    if (!location.lat || !location.lng) {
      alert('Please select or detect a delivery address first.');
      return;
    }

    if (isOutsideDeliveryRadius) {
      alert('This destination is outside the current delivery radius.');
      return;
    }

    setIsSubmitting(true);

    const expandedItems = cart.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
      }))
    );

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: `Delivery - ${location.address}`,
          items: expandedItems,
          total: orderTotal,
          paymentType: 'CASH',
          paymentStatus: 'PENDING',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not submit this order.');
      }

      setCart([]);
      setIsCartOpen(false);
      alert('Order sent to the kitchen. Please confirm payment on delivery.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not submit this order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans pb-40 selection:bg-orange-500">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> Home
        </Link>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-3 bg-white text-black pl-4 pr-1.5 py-1.5 rounded-2xl active:scale-95 transition-all"
        >
          <span className="text-[12px] font-black italic">KSh {orderTotal.toLocaleString()}</span>
          <span className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
            <ShoppingCart size={18} />
          </span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] flex items-center justify-center font-black">
              {selectedItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Geolocation & Destination Interface block */}
      <section className="mb-8 bg-white/5 border border-white/10 p-5 rounded-3xl">
        <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-4 flex items-center gap-2">
          <MapPin size={14} /> Delivery Destination
        </h2>

        {restaurantLocation && (
          <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Restaurant Location</p>
            <p className="mt-1 text-xs text-white/70 leading-relaxed">{restaurantLocation.address}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest text-orange-400">
              <span>{restaurantLocation.deliveryRadiusKm.toLocaleString()} km radius</span>
              <span>KSh {restaurantLocation.pricePerKm.toLocaleString()} / km</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <button 
            onClick={handleDetectLocation}
            disabled={loadingLocation}
            className="flex items-center justify-center gap-2 px-5 py-4 bg-white text-black text-xs font-black rounded-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {loadingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
            Use My Location
          </button>
          
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Or type alternative custom address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl p-4 text-xs tracking-wide text-white placeholder:text-white/25"
            />
            {isSearching && <Loader2 size={14} className="animate-spin absolute right-4 top-4 text-white/40" />}
          </div>
        </div>

        {/* Floating Autocomplete Suggestions Panel */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-900 border border-white/10 rounded-xl mb-3 overflow-hidden max-h-60 overflow-y-auto"
            >
              {suggestions.map((s: any) => (
                <button
                  key={s.mapbox_id}
                  onClick={() => handleSelectSuggestion(s.mapbox_id, s.full_address)}
                  className="w-full text-left p-3.5 text-xs border-b border-white/5 hover:bg-white/5 block transition-colors tracking-wide"
                >
                  <span className="font-bold block text-white">{s.name}</span>
                  <span className="text-white/40 text-[10px] block mt-0.5">{s.place_formatted}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Location Banner Status */}
        {location.address && (
          <div className="mt-2 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
            <Check size={14} className="text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase text-white/80 tracking-wide">Delivery Target:</p>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{location.address}</p>
              {location.lat && (
                <span className="text-[9px] tracking-wider text-orange-500/60 font-mono block mt-1.5">
                  LOC: {location.lat.toFixed(5)}, {location.lng?.toFixed(5)}
                </span>
              )}
              {deliveryDistanceKm > 0 && (
                <span className={`text-[9px] tracking-wider font-black uppercase block mt-1.5 ${isOutsideDeliveryRadius ? 'text-red-300' : 'text-emerald-300'}`}>
                  {deliveryDistanceKm.toFixed(1)} km away · Delivery KSh {deliveryFee.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Menu Filter and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Order Foods</h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Fetched meals appear below the restaurant location</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="search"
            placeholder="Search menu items..."
            value={foodSearch}
            onChange={(e) => setFoodSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-orange-500 outline-none rounded-xl p-3.5 pl-11 text-xs tracking-wide text-white placeholder:text-white/25"
          />
        </div>
      </div>

      {/* Core Dynamic Menu Loop */}
      {loadingFoods ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <p className="text-xs font-black uppercase tracking-widest">Loading Dishes...</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl text-white/30 text-xs font-bold uppercase tracking-wider">
          No matching meals available at the moment
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-20">
          {filteredFoods.map((item) => {
            const count = getQuantity(item.id);
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-4 bg-white/5 border border-white/10 p-4 rounded-3xl items-center"
              >
                <div className="w-20 h-20 bg-white/10 rounded-2xl overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-orange-500/20 to-transparent" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-black italic uppercase text-sm truncate">{item.name}</h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">
                    {item.category || 'Main Dish'} • Available
                  </p>
                  <p className="text-orange-500 font-black text-lg mt-1">KSh {item.price.toLocaleString()}</p>
                </div>

                {/* Counter Controllers */}
                <div className="flex items-center bg-black border border-white/10 rounded-2xl p-1 gap-1">
                  {count > 0 && (
                    <>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-3 text-white/60 hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-4 text-center font-black text-xs">{count}</span>
                    </>
                  )}
                  <button 
                    onClick={() => addToCart(item)}
                    className={`p-3 rounded-xl font-black transition-all ${count > 0 ? 'text-orange-500' : 'bg-white text-black'}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '115%', opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: '115%', opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 24, stiffness: 210 }}
              className="fixed right-3 top-3 bottom-3 z-[60] w-[min(92vw,420px)] rounded-[28px] border border-white/20 bg-white/10 p-5 shadow-2xl shadow-black/45 ring-1 ring-white/10 backdrop-blur-2xl flex flex-col"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-400">Checkout</p>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Confirm Order</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs font-black uppercase tracking-widest text-white/30">
                    Your cart is empty
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-lg shadow-black/10">
                      <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-xl object-cover bg-white/10" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[11px] font-black uppercase tracking-tight text-white">{item.name}</h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Qty {item.quantity}</p>
                        <p className="mt-1 text-xs font-black text-orange-400">KSh {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center rounded-2xl border border-white/10 bg-black/40 p-1">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-white/60 hover:text-white"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="p-2 text-orange-400 hover:text-orange-300"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Delivery Destination</p>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-white/70">
                    {location.address || 'Select or detect your delivery destination before submitting.'}
                  </p>
                  {deliveryDistanceKm > 0 && (
                    <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${isOutsideDeliveryRadius ? 'text-red-300' : 'text-emerald-300'}`}>
                      {deliveryDistanceKm.toFixed(1)} km from restaurant
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
                <div className="flex justify-between text-xs font-bold text-white/50">
                  <span>Items</span>
                  <span>KSh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white/50">
                  <span>Delivery</span>
                  <span>KSh {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Total</span>
                  <span className="text-3xl font-black italic tracking-tighter text-white">KSh {orderTotal.toLocaleString()}</span>
                </div>
                {isOutsideDeliveryRadius && (
                  <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-[10px] font-bold uppercase tracking-widest text-red-200">
                    This destination is outside the restaurant delivery radius.
                  </p>
                )}
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={cart.length === 0 || isSubmitting || !location.lat || isOutsideDeliveryRadius}
                  className="w-full rounded-2xl bg-white py-5 text-[11px] font-black uppercase tracking-widest text-black shadow-xl shadow-black/20 transition-all active:scale-95 disabled:opacity-30"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Order'}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Summary Module */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 p-6 z-40 backdrop-blur-md"
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Subtotal Amount</p>
                <p className="text-2xl font-black text-orange-500">KSh {subtotal.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex-1 bg-white text-black py-4 rounded-2xl font-black italic uppercase tracking-wider text-sm hover:bg-orange-500 hover:text-white transition-all text-center"
              >
                Review Order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

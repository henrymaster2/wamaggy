'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Navigation, ShoppingCart, Loader2, Plus, Minus, Check } from 'lucide-react';
import Link from 'next/link';

// 1. Unified Types matching the backend database models
interface FoodItem {
  id: number;
  name: string;
  price: number;
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

export default function OrderFoods() {
  // Food fetching states
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodSearch, setFoodSearch] = useState('');

  // Cart & UI states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [location, setLocation] = useState<LocationData>({ address: '', lat: null, lng: null });
  
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

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans pb-40 selection:bg-orange-500">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="relative p-3 bg-white/5 rounded-xl">
          <ShoppingCart size={18} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[9px] flex items-center justify-center font-black">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </div>
      </div>

      {/* Geolocation & Destination Interface block */}
      <section className="mb-8 bg-white/5 border border-white/10 p-5 rounded-3xl">
        <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-4 flex items-center gap-2">
          <MapPin size={14} /> Delivery Destination
        </h2>

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
            </div>
          </div>
        )}
      </section>

      {/* Menu Filter and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Full Menu</h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Select meals to place your order</p>
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
                   <div className="w-full h-full bg-linear-to-br from-orange-500/20 to-transparent" />
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
                onClick={() => {
                  if (!location.lat) {
                    alert('Please select or detect a delivery address first!');
                    return;
                  }
                  alert(`Order Processing simulated!\nItems Total: KSh ${subtotal.toLocaleString()}\nDestination Coordinates: [${location.lat}, ${location.lng}]`);
                }}
                className="flex-1 bg-white text-black py-4 rounded-2xl font-black italic uppercase tracking-wider text-sm hover:bg-orange-500 hover:text-white transition-all text-center"
              >
                Proceed to Checkout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Search, Users, Utensils } from 'lucide-react';
import Link from 'next/link';

type SavedCustomer = {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
};

type FoodItem = {
  id: number;
  name: string;
  price: number;
  category?: string;
  status: string;
};

const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function BookMeals() {
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('wamaggy_customer');
    if (savedUser) setSavedCustomer(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch('/api/food');
        if (!res.ok) throw new Error('Failed to fetch foods');

        const data = await res.json();
        setFoods(data.filter((food: FoodItem) => food.status === 'Available'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFoods(false);
      }
    };

    fetchFoods();
  }, []);

  const filteredFoods = useMemo(() => {
    const search = foodSearch.trim().toLowerCase();

    if (!search) return foods;

    return foods.filter((food) =>
      `${food.name} ${food.category || ''}`.toLowerCase().includes(search)
    );
  }, [foods, foodSearch]);

  const selectedFood = foods.find((food) => String(food.id) === selectedFoodId);

  const openPicker = (input: HTMLInputElement | null) => {
    input?.focus();
    input?.showPicker?.();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedFood) {
      alert('Please choose a meal from the available foods.');
      return;
    }

    setSubmitting(true);
    setSuccess(false);

    const formData = new FormData(form);
    const notes = String(formData.get('preferences') || '').trim();
    const mealLine = `Selected meal: ${selectedFood.name} - KSh ${selectedFood.price.toLocaleString()}`;

    const payload = {
      date: formData.get('date'),
      time: formData.get('time'),
      guests: formData.get('guests'),
      preferences: notes ? `${mealLine}\nNotes: ${notes}` : mealLine,
      customerName: savedCustomer?.name,
      customerPhone: savedCustomer?.phone,
      customerEmail: savedCustomer?.email,
      userId: savedCustomer?.id,
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Booking failed');
      }

      form.reset();
      setFoodSearch('');
      setSelectedFoodId('');
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Could not confirm booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans selection:bg-orange-500">
      <Link href="/" className="inline-flex items-center gap-2 text-orange-500 mb-8 font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Book a Meal</h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-10">Reserve your dining experience</p>

        {success && (
          <div className="max-w-md mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300 text-xs font-bold">
            Your meal booking has been sent. We will prepare for your selected arrival time.
          </div>
        )}

        <form className="space-y-6 max-w-md" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Choose Meal</label>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={17} />
                <input
                  type="search"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Search available foods..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 p-4 pl-12 text-white outline-none transition-all placeholder:text-white/25 focus:border-orange-500"
                />
              </div>

              <select
                name="selectedFood"
                required
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                disabled={loadingFoods || filteredFoods.length === 0}
                className="w-full rounded-xl border border-white/10 bg-black p-4 text-white outline-none transition-all focus:border-orange-500 disabled:opacity-40"
              >
                <option value="">
                  {loadingFoods ? 'Loading available foods...' : filteredFoods.length === 0 ? 'No matching foods available' : 'Select a meal'}
                </option>
                {filteredFoods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} - KSh {food.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Select Date</label>
            <div className="relative" onClick={() => openPicker(dateInputRef.current)}>
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <input
                ref={dateInputRef}
                name="date"
                type="date"
                min={getTodayInputValue()}
                required
                className="w-full cursor-pointer bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Arrival Time</label>
            <div className="relative" onClick={() => openPicker(timeInputRef.current)}>
              <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <input
                ref={timeInputRef}
                name="time"
                type="time"
                required
                className="w-full cursor-pointer bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500 transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Number of Guests</label>
            <div className="relative">
              <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <input name="guests" type="number" min="1" required placeholder="How many people?" className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Meal Preferences</label>
            <textarea name="preferences" placeholder="Food preferences, allergies, or anything we should prepare..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-orange-500 transition-all h-32" />
          </div>

          <button disabled={submitting} className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50">
            {submitting ? 'Sending Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}

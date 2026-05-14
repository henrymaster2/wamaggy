'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Users, Utensils } from 'lucide-react';
import Link from 'next/link';

export default function BookMeals() {
  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans selection:bg-orange-500">
      <Link href="/" className="inline-flex items-center gap-2 text-orange-500 mb-8 font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Book a Meal</h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-10">Reserve your dining experience</p>

        <form className="space-y-6 max-w-md" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <input type="date" className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Number of Guests</label>
            <div className="relative">
              <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
              <input type="number" placeholder="How many people?" className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl text-white outline-none focus:border-orange-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-[0.2em]">Special Requests</label>
            <textarea placeholder="Allergies or preferences..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-orange-500 transition-all h-32" />
          </div>

          <button className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-transform">
            Confirm Booking
          </button>
        </form>
      </motion.div>
    </main>
  );
}
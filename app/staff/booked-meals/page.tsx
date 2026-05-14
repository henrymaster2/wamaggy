'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, RefreshCcw, Users, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

type MealBooking = {
  id: number;
  date: string;
  time: string;
  guests: number;
  preferences?: string | null;
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  createdAt: string;
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);

  return new Intl.DateTimeFormat('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export default function BookedMealsPage() {
  const [bookings, setBookings] = useState<MealBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      alert('Could not load booked meals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft size={20} className="text-slate-500" />
            </Link>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Booked Meals</h1>
              <p className="text-slate-500 font-medium">Upcoming meal reservations and preparation notes.</p>
            </div>
          </div>

          <button
            onClick={fetchBookings}
            className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 font-black italic uppercase">
            <RefreshCcw className="animate-spin mr-3" size={22} /> Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils size={30} />
            </div>
            <h2 className="font-black uppercase italic text-2xl tracking-tighter mb-2">No booked meals yet</h2>
            <p className="text-slate-500 text-sm">Customer bookings will appear here after they confirm a date and arrival time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking, index) => (
              <motion.article
                key={booking.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-orange-300 font-black uppercase tracking-[0.25em] mb-2">Booking #{booking.id}</p>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                      {booking.customerName || 'Guest Customer'}
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest">
                    {booking.status}
                  </span>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-2xl bg-orange-50 p-4">
                      <CalendarDays size={18} className="text-orange-600 mb-3" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Date</p>
                      <p className="text-sm font-black text-slate-900 leading-tight">{formatDate(booking.date)}</p>
                    </div>
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <Clock size={18} className="text-blue-600 mb-3" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Time</p>
                      <p className="text-sm font-black text-slate-900 leading-tight">{formatTime(booking.time)}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <Users size={18} className="text-emerald-600 mb-3" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Guests</p>
                      <p className="text-sm font-black text-slate-900 leading-tight">{booking.guests}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mb-5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Preferences</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {booking.preferences || 'No preferences added.'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-slate-500">
                    {booking.customerPhone && <p><span className="font-black text-slate-700">Phone:</span> {booking.customerPhone}</p>}
                    {booking.customerEmail && <p><span className="font-black text-slate-700">Email:</span> {booking.customerEmail}</p>}
                    <p><span className="font-black text-slate-700">Booked:</span> {new Date(booking.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

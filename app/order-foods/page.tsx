'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function OrderFoods() {
  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> Home
        </Link>
        <button className="p-3 bg-white/5 rounded-xl"><Search size={18} /></button>
      </div>

      <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-8">Full Menu</h1>

      <div className="grid grid-cols-1 gap-4 mb-20">
        {[1, 2, 3, 4].map((item) => (
          <motion.div 
            key={item}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex gap-4 bg-white/5 border border-white/10 p-4 rounded-[24px] items-center"
          >
            <div className="w-20 h-20 bg-white/10 rounded-2xl overflow-hidden">
               <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-transparent" />
            </div>
            <div className="flex-1">
              <h3 className="font-black italic uppercase text-sm">Sample Food Item</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Category • Available</p>
              <p className="text-orange-500 font-black text-lg">KSh 450</p>
            </div>
            <button className="p-4 bg-white text-black rounded-2xl font-black">+</button>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
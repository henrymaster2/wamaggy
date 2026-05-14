'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Smartphone,
  MoveHorizontal,
  ShoppingCart,
  CheckCircle,
  Menu,
  Calendar,
  Pizza,
  BookOpen,
  UserRound,
  MessageCircle,
  Phone,
} from 'lucide-react';
import Link from 'next/link';

const whatsappNumber = '254759027692';
const whatsappHref = `https://wa.me/${whatsappNumber}`;

const customerSteps = [
  {
    icon: <UserRound size={22} className="text-orange-400" />,
    title: 'Start with your details',
    desc: 'When you open the system for the first time, enter your name, email, and phone number. The app remembers you on that device for faster ordering next time.',
  },
  {
    icon: <MoveHorizontal size={22} className="text-sky-400" />,
    title: 'Browse by swiping',
    desc: 'Use the category buttons for Food, Drinks, Fruits, Others, or All. Swipe left and right on the main food view to move between available items.',
  },
  {
    icon: <Pizza size={22} className="text-emerald-400" />,
    title: 'Check item details',
    desc: 'Tap View Details to read the description, see the price, and confirm the item status. Only items marked Available can be added to your bucket.',
  },
  {
    icon: <ShoppingCart size={22} className="text-purple-400" />,
    title: 'Add to your bucket',
    desc: 'Tap Add to Bucket. The total at the top right updates immediately, and you can open the bucket to review or remove items before sending the order.',
  },
  {
    icon: <CheckCircle size={22} className="text-lime-400" />,
    title: 'Confirm the order',
    desc: 'Open Your Order, review the total, then tap Confirm Order. The order is sent to the kitchen with your table number or Takeaway label.',
  },
];

const navigationItems = [
  {
    icon: <Menu size={20} />,
    title: 'Floating menu',
    desc: 'Opens the left-side menu where you can go to Book Meals, Order Foods, or this User Manual.',
  },
  {
    icon: <Calendar size={20} />,
    title: 'Book Meals',
    desc: 'Lets a customer reserve a dining experience by choosing a date, number of guests, and special requests.',
  },
  {
    icon: <BookOpen size={20} />,
    title: 'Help button',
    desc: 'The orange help icon on the home screen opens this guide whenever a customer needs instructions.',
  },
  {
    icon: <Smartphone size={20} />,
    title: 'Install as app',
    desc: 'On mobile, use your browser Share or Menu option and choose Add to Home Screen for a PWA-style app experience.',
  },
];

function ManualCard({
  icon,
  title,
  desc,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex gap-4 items-start rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10"
    >
      <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-black italic uppercase text-sm mb-1">{title}</h3>
        <p className="text-white/55 text-xs leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function UserManual() {
  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans selection:bg-orange-500">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-500 mb-8 font-black uppercase text-[10px] tracking-widest">
          <ArrowLeft size={16} /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.35em] mb-3">User Manual</p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">African Cuisine Guide</h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-2xl">
            This guide explains how to browse the digital menu, add meals to your bucket, and send your order to the kitchen.
          </p>
        </motion.div>

        <section className="mb-12">
          <h2 className="text-white/90 text-xl font-black uppercase italic tracking-tighter mb-5">Customer Ordering</h2>
          <div className="space-y-4">
            {customerSteps.map((step, index) => (
              <ManualCard key={step.title} {...step} index={index} />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-white/90 text-xl font-black uppercase italic tracking-tighter mb-5">Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {navigationItems.map((item, index) => (
              <ManualCard key={item.title} {...item} index={index} />
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-[32px] border border-orange-500/20 bg-orange-500/10 p-6">
          <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Important Notes</p>
          <div className="space-y-3 text-white/65 text-xs leading-relaxed">
            <p>Items marked Pending or Not Available are visible for awareness, but customers cannot add them to the bucket.</p>
            <p>The bucket total is calculated from selected items. Removing an item updates the total before confirmation.</p>
            <p>Orders are saved as PENDING first. Kitchen staff then mark them READY and later SERVED from the live orders page.</p>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-center shadow-2xl shadow-black/20">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
            <MessageCircle size={28} />
          </div>
          <p className="text-white/35 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Contact Support</p>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-3">Need help?</h2>
          <p className="text-white/55 text-xs leading-relaxed mb-5">
            For ordering help, menu issues, or QR code support, contact us on WhatsApp.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-6 py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase text-[11px] tracking-widest active:scale-95 transition-transform"
          >
            <Phone size={18} /> WhatsApp 0759027692
          </a>
        </section>
      </div>
    </main>
  );
}

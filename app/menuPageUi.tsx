import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Calendar, HelpCircle, Mail, Phone, Pizza, Utensils, X } from 'lucide-react';
import type { FoodWithTheme } from './hooks/useFoodThemes';

export const navLinks = [
  { name: 'Book Meals', icon: <Calendar size={18} />, link: '/book-meals' },
  { name: 'Order Foods', icon: <Pizza size={18} />, link: '/order-foods' },
  { name: 'User Manual', icon: <BookOpen size={18} />, link: '/user-manual' },
];

export const loginFields = [
  { name: 'name', placeholder: 'Full Name' },
  { name: 'email', type: 'email', placeholder: 'Email Address' },
  { name: 'phone', type: 'tel', placeholder: 'Phone Number' },
];

export const classNames = {
  overlay: 'fixed inset-0 bg-black/35 backdrop-blur-sm',
  closeButton: 'h-10 w-10 rounded-full border border-white/15 bg-white/10 text-white/70 flex items-center justify-center transition-all hover:bg-white hover:text-black active:scale-90',
  drawerTitleLabel: 'text-[9px] font-black uppercase tracking-[0.35em] text-orange-400/90 mb-2',
  drawerHeading: 'text-3xl font-black text-white uppercase italic tracking-tighter leading-none',
  pill: 'px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase',
  navLink: 'flex items-center gap-4 p-4 rounded-2xl bg-white/10 text-white/80 border border-white/10 shadow-lg shadow-black/10 hover:bg-white hover:text-black transition-all group',
  navIcon: 'h-10 w-10 rounded-xl bg-orange-500/15 text-orange-400 group-hover:bg-black group-hover:text-white flex items-center justify-center transition-colors',
  glassCard: 'bg-white/5 border border-white/10',
  orangePrice: 'text-orange-500 font-black italic',
  formInput: 'w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-orange-500',
};

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className={classNames.closeButton}>
      <X size={20} />
    </button>
  );
}

export function DrawerTitle({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className={classNames.drawerTitleLabel}>{label}</p>
      <h2 className={classNames.drawerHeading}>{title}</h2>
    </div>
  );
}

export const isFoodAvailable = (food?: FoodWithTheme) => food?.status === 'Available';

const getStatusClass = (status: string) => {
  if (status === 'Available') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (status === 'Pending') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
};

export function AvailabilityBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusClass(status)}`}>
      {status || 'Not Available'}
    </span>
  );
}

export function PageFooter() {
  return (
    <footer className="mt-12 text-center space-y-4 border-t border-white/5 pt-10 px-6">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Powered by HENRY MASTER</p>
      <div className="flex flex-col items-center gap-2 pb-10">
        <a href="tel:0748172255" className="flex items-center gap-2 text-white/50 hover:text-orange-500 transition-colors">
          <Phone size={12} /> <span className="text-[11px] font-bold">0748172255</span>
        </a>
        <a href="mailto:masterhenry681@gmail.com" className="flex items-center gap-2 text-white/50 hover:text-orange-500 transition-colors">
          <Mail size={12} /> <span className="text-[11px] font-bold">masterhenry681@gmail.com</span>
        </a>
      </div>
    </footer>
  );
}

export function FloatingHelpLink() {
  return (
    <Link href="/user-manual" className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-orange-600/40 active:scale-90 transition-transform">
      <HelpCircle size={28} />
    </Link>
  );
}

export function LoginModal({
  show,
  onSubmit,
}: {
  show: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black backdrop-blur-3xl flex items-center justify-center p-6 text-center">
          <div className="w-full max-w-sm">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Utensils className="text-white" size={28} /></div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8">African Cuisine</h2>
            <form onSubmit={onSubmit} className="space-y-4 text-left">
              {loginFields.map((field) => (
                <input
                  key={field.name}
                  name={field.name}
                  type={field.type}
                  required
                  placeholder={field.placeholder}
                  className={classNames.formInput}
                />
              ))}
              <button type="submit" className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg mt-4">Start Dining</button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

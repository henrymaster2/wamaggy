'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { useFoodThemes, type FoodWithTheme } from './hooks/useFoodThemes';
import { ShoppingBag, X, Utensils, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react';

type Category = 'Food' | 'Drinks' | 'Fruits' | 'Others' | 'All';
type Customer = { id: number; name: string; phone: string; email: string };
type OrderSummary = { id: number; total: number; status: string };

function SliderContent() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || 'Takeaway';
  
  const [activeCategory, setActiveCategory] = useState<Category>('Food');
  const { foods, loading } = useFoodThemes();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cart, setCart] = useState<FoodWithTheme[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pastOrders, setPastOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('wamaggy_customer');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      fetchUserHistory(parsedUser.id);
    } else {
      setShowLoginModal(true);
    }
  }, []);

  const fetchUserHistory = async (userId: number) => {
    try {
      const res = await fetch(`/api/orders?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPastOrders(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = { name: formData.get('name'), phone: formData.get('phone'), email: formData.get('email') };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('wamaggy_customer', JSON.stringify(data.user));
        setShowLoginModal(false);
        fetchUserHistory(data.user.id);
      }
    } catch { alert("Error connecting to server."); } 
    finally { setIsSubmitting(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('wamaggy_customer');
    setCurrentUser(null);
    setShowLoginModal(true);
    setIsCartOpen(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeLabel = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return `Good ${timeLabel}, ${currentUser?.name.split(' ')[0] || "Guest"}`;
  };

  const addToBucket = (food: FoodWithTheme) => {
    setCart([...cart, food]);
    setIsExpanded(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const confirmOrder = async () => {
    if (cart.length === 0 || !currentUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber, 
          userId: currentUser.id,
          items: cart,
          total: cartTotal 
        }),
      });

      if (response.ok) {
        setCart([]);
        setIsCartOpen(false);
        fetchUserHistory(currentUser.id);
        alert("Order sent to the kitchen!");
      }
    } catch { alert("Order failed."); } 
    finally { setIsSubmitting(false); }
  };

  const filteredFoods = foods.filter((item: FoodWithTheme) => 
    activeCategory === 'All' ? true : item.category?.toLowerCase() === activeCategory.toLowerCase()
  );

  useEffect(() => {
    setCurrentIndex(0);
    setIsExpanded(false);
  }, [activeCategory]);

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <span className="text-white font-black animate-pulse italic tracking-tighter">AFRICAN CUISINE...</span>
    </div>
  );

  const currentFood = filteredFoods[currentIndex] as FoodWithTheme;

  const paginate = (newDirection: number) => {
    if (filteredFoods.length <= 1) return;
    setIsExpanded(false);
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + filteredFoods.length) % filteredFoods.length);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 80) paginate(-1);
    else if (info.offset.x < -80) paginate(1);
  };

  const variants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 500 : -500, opacity: 0, scale: 0.9 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: (direction: number) => ({ x: direction < 0 ? 500 : -500, opacity: 0, scale: 0.9, transition: { duration: 0.3 } }),
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black font-sans selection:bg-orange-500">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-90 z-0" />

      {/* HEADER */}
      <header className="relative z-50 flex flex-col p-6 md:p-10 gap-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic leading-none">African Cuisine</h1>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-orange-500 uppercase">{getGreeting()}</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white/40 uppercase tracking-widest">T-{tableNumber}</span>
            </div>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 bg-white text-black pl-4 pr-1.5 py-1.5 rounded-2xl active:scale-95 transition-all">
            <div className="text-right leading-none"><span className="text-[12px] font-black italic">KSh {cartTotal}</span></div>
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center"><ShoppingBag size={18} /></div>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {['Food', 'Drinks', 'Fruits', 'Others', 'All'].map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat as Category)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* MENU SLIDER */}
      <div className="relative h-[60vh] w-full flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          {currentFood && (
            <motion.div key={currentFood.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute flex flex-col items-center w-full px-6">
              
              {/* Image with Cinematic Morph */}
              <motion.img 
                animate={{ 
                  scale: isExpanded ? 0.6 : 1, 
                  y: isExpanded ? -60 : 0,
                  borderRadius: isExpanded ? "40px" : "500px" 
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                src={currentFood.imageUrl} 
                className="w-64 h-64 md:w-[400px] md:h-[400px] object-cover shadow-2xl border-4 border-white/5 z-10" 
              />

              {!isExpanded ? (
                <div className="text-center mt-8 relative z-20">
                  <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-6 drop-shadow-lg">{currentFood.name}</h2>
                  <button onClick={() => setIsExpanded(true)} className="px-10 py-3.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-full font-black uppercase text-[10px] tracking-[0.3em] transition-all">View Details</button>
                </div>
              ) : (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] -mt-16 z-30">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-black text-white uppercase italic">{currentFood.name}</h3>
                    <div className="text-2xl font-black italic text-white">KSh {currentFood.price}</div>
                  </div>
                  <p className="text-white/50 text-xs mb-8 leading-relaxed">{currentFood.description}</p>
                  <div className="flex gap-3">
                    <button onClick={() => addToBucket(currentFood)} className="flex-[2] py-4 bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 shadow-lg">Add to bucket</button>
                    <button onClick={() => setIsExpanded(false)} className="flex-1 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest">Back</button>
                  </div>
                </motion.div>
              )}
              
              {/* Transparent Drag Layer - Only active when NOT expanded */}
              {!isExpanded && (
                <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BUCKET / CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25 }} className="fixed inset-y-0 right-0 w-full md:w-[400px] z-[100] bg-black/95 backdrop-blur-2xl border-l border-white/10 p-8 flex flex-col">
             <div className="flex justify-between items-center mb-8">
               <div>
                 <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Your Order</h2>
                 <button onClick={handleLogout} className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1 mt-1 tracking-widest"><LogOut size={10}/> Logout</button>
               </div>
               <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white/5 rounded-full text-white"><X size={20} /></button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                <section>
                  <h3 className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">Current Selection</h3>
                  <div className="space-y-3">
                    {cart.map((item, i) => (
                      <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <img src={item.imageUrl} className="h-12 w-12 rounded-xl object-cover" alt={item.name} />
                        <div className="flex-1">
                          <h4 className="text-white font-black uppercase text-[10px] tracking-tight">{item.name}</h4>
                          <p className="text-orange-500 font-black text-[11px] italic">KSh {item.price}</p>
                        </div>
                        <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </section>
                
                {pastOrders.length > 0 && (
                  <section>
                    <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Past Orders</h3>
                    <div className="space-y-3 opacity-60">
                      {pastOrders.map((order) => (
                        <div key={order.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                          <div className="text-white font-black italic text-sm">KSh {order.total}</div>
                          <span className="text-[8px] font-black uppercase px-2 py-1 bg-white/10 text-white rounded-md">{order.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
             </div>

             <div className="pt-8 border-t border-white/10">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total</span>
                  <span className="text-3xl font-black text-white italic tracking-tighter">KSh {cartTotal}</span>
                </div>
                <button 
                  disabled={cart.length === 0 || isSubmitting} 
                  onClick={confirmOrder} 
                  className="w-full py-5 bg-white text-black font-black uppercase rounded-2xl active:scale-95 shadow-xl transition-all disabled:opacity-20"
                >
                  {isSubmitting ? "Processing..." : "Confirm Order"}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black backdrop-blur-3xl flex items-center justify-center p-6 text-center">
            <div className="w-full max-w-sm">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Utensils className="text-white" size={28} /></div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8">African Cuisine</h2>
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <input name="name" required placeholder="Full Name" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-orange-500" />
                <input name="email" type="email" required placeholder="Email Address" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-orange-500" />
                <input name="phone" type="tel" required placeholder="Phone Number" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-orange-500" />
                <button type="submit" className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg mt-4">Start Dining</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGINATION DOTS */}
      {!isExpanded && (
        <div className="absolute bottom-10 left-0 w-full flex justify-center gap-3">
          {filteredFoods.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-10 bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'w-2 bg-white/10'}`} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function App() {
  return <Suspense fallback={<div className="h-screen bg-black" />}><SliderContent /></Suspense>;
}
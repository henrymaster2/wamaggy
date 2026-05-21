'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { useFoodThemes, type FoodWithTheme } from './hooks/useFoodThemes';
import {
  AvailabilityBadge,
  CloseButton,
  DrawerTitle,
  FloatingHelpLink,
  LoginModal,
  PageFooter,
  classNames,
  isFoodAvailable,
  navLinks,
} from './menuPageUi';
import { ShoppingBag, X, LogOut, Menu } from 'lucide-react';

type Category = 'Food' | 'Drinks' | 'Fruits' | 'Others' | 'All';
type Customer = { id: number; name: string; phone: string; email: string };
type OrderSummary = { id: number; total: number; status: string };
type PaymentType = 'CASH' | 'MPESA';
const menuCategories: Category[] = ['Food', 'Drinks', 'Fruits', 'Others', 'All'];

function SliderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || 'Takeaway';
  const targetFoodId = searchParams.get('foodId');
  
  const [activeCategory, setActiveCategory] = useState<Category>('Food');
  const { foods, loading } = useFoodThemes();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');

  const [cart, setCart] = useState<FoodWithTheme[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [, setPastOrders] = useState<OrderSummary[]>([]);
  const staffPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressMenuClick = useRef(false);

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
    } catch (err) { 
      console.error(err); 
    }
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
    } catch { 
      alert("Error connecting to server."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wamaggy_customer');
    setCurrentUser(null);
    setShowLoginModal(true);
    setIsCartOpen(false);
    setIsSidebarOpen(false);
  };

  const clearStaffPressTimer = () => {
    if (staffPressTimer.current) {
      clearTimeout(staffPressTimer.current);
      staffPressTimer.current = null;
    }
  };

  const handleMenuPressStart = () => {
    clearStaffPressTimer();
    staffPressTimer.current = setTimeout(() => {
      suppressMenuClick.current = true;
      router.push('/staff');
    }, 5000);
  };

  const handleMenuPressEnd = () => {
    clearStaffPressTimer();
  };

  const handleMenuClick = () => {
    if (suppressMenuClick.current) {
      suppressMenuClick.current = false;
      return;
    }
    setIsSidebarOpen(true);
  };

  useEffect(() => {
    return () => clearStaffPressTimer();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeLabel = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return `Good ${timeLabel}, ${currentUser?.name.split(' ')[0] || "Guest"}`;
  };

  const addToBucket = (food: FoodWithTheme) => {
    if (!isFoodAvailable(food)) return;
    setCart([...cart, food]);
    setIsExpanded(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const openPaymentChoice = () => {
    if (cart.length === 0 || !currentUser) return;
    setMpesaPhone(currentUser.phone || '');
    setShowPaymentModal(true);
  };

  const confirmOrder = async (paymentType: PaymentType) => {
    if (cart.length === 0 || !currentUser) return;
    if (paymentType === 'MPESA' && !navigator.onLine) {
      alert('M-Pesa payment needs internet. Please reconnect or choose cash.');
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      tableNumber,
      userId: currentUser.id,
      items: cart,
      total: cartTotal,
      paymentType,
      paymentStatus: 'PENDING',
      mpesaPhone: paymentType === 'MPESA' ? mpesaPhone : null,
      createdAt: new Date().toISOString(),
      synced: false
    };

    // 1. OFFLINE SUBMISSION LOGIC
    if (!navigator.onLine) {
      try {
        const { saveOrderOffline } = await import('@/lib/db');
        await saveOrderOffline({ ...orderPayload, paymentType: 'CASH', mpesaPhone: null });
        
        setCart([]);
        setIsCartOpen(false);
        setShowPaymentModal(false);
        alert("⚠️ Saved Offline: Your order is queued locally and will send to the kitchen automatically when your internet restores!");
      } catch (err) {
        console.error("Local database error:", err);
        alert("Could not commit order to offline local storage.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. LIVE NETWORK SUBMISSION LOGIC
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        const order = await response.json();

        if (paymentType === 'MPESA') {
          const stkResponse = await fetch('/api/mpesa/stk-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id, phone: mpesaPhone }),
          });
          const stkData = await stkResponse.json();

          if (!stkResponse.ok) {
            alert(stkData.error || 'Order was sent, but M-Pesa STK push failed.');
          } else {
            alert(stkData.customerMessage || 'Order sent. Check your phone for the M-Pesa prompt.');
          }
        } else {
          alert("Order sent to the kitchen! Please pay by cash.");
        }

        setCart([]);
        setIsCartOpen(false);
        setShowPaymentModal(false);
        fetchUserHistory(currentUser.id);
      } else {
        alert("The server was reachable but could not process the order.");
      }
    } catch { 
      alert("Network payload transaction failed."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredFoods = foods.filter((item: FoodWithTheme) => 
    activeCategory === 'All' ? true : item.category?.toLowerCase() === activeCategory.toLowerCase()
  );

  useEffect(() => {
    if (targetFoodId) return;
    setCurrentIndex(0);
    setIsExpanded(false);
  }, [activeCategory, targetFoodId]);

  useEffect(() => {
    if (!targetFoodId || foods.length === 0) return;

    const targetFood = foods.find((food) => String(food.id) === targetFoodId);
    if (!targetFood) return;

    const targetCategory = menuCategories.includes(targetFood.category as Category)
      ? (targetFood.category as Category)
      : 'All';
    const targetList = foods.filter((food: FoodWithTheme) =>
      targetCategory === 'All' ? true : food.category?.toLowerCase() === targetCategory.toLowerCase()
    );
    const targetIndex = targetList.findIndex((food) => food.id === targetFood.id);

    setActiveCategory(targetCategory);
    setCurrentIndex(Math.max(targetIndex, 0));
    setIsExpanded(true);
  }, [foods, targetFoodId]);

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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 50) paginate(-1);
    else if (info.offset.x < -50) paginate(1);
  };

  const variants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 500 : -500, opacity: 0, scale: 0.9 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: (direction: number) => ({ x: direction < 0 ? 500 : -500, opacity: 0, scale: 0.9, transition: { duration: 0.3 } }),
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black font-sans selection:bg-orange-500">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-90 z-0" />

      {/* SIDEBAR NAVIGATION */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className={`${classNames.overlay} z-[110]`}
            />
            <motion.div 
              initial={{ x: '-115%', opacity: 0, scale: 0.96 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: '-115%', opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 210 }}
              className="fixed left-3 top-3 bottom-3 w-[min(82vw,310px)] bg-white/10 z-[120] border border-white/20 p-5 flex flex-col rounded-[28px] shadow-2xl shadow-black/45 backdrop-blur-2xl ring-1 ring-white/10"
            >
              <div className="flex justify-between items-start mb-8">
                <DrawerTitle label="African Cuisine" title="Menu" />
                <CloseButton onClick={() => setIsSidebarOpen(false)} />
              </div>
              
              <nav className="flex-1 space-y-3">
                {navLinks.map((item) => (
                  <Link key={item.name} href={item.link} className={classNames.navLink}>
                    <span className={classNames.navIcon}>{item.icon}</span>
                    <span className="font-black uppercase text-[11px] tracking-widest">{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-5 border-t border-white/10">
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-300 font-black uppercase text-[10px] tracking-widest p-4 rounded-2xl hover:bg-red-500/15 transition-colors">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="relative z-50 flex flex-col p-6 md:p-10 gap-6">
        <button 
          onPointerDown={handleMenuPressStart}
          onPointerUp={handleMenuPressEnd}
          onPointerLeave={handleMenuPressEnd}
          onPointerCancel={handleMenuPressEnd}
          onClick={handleMenuClick}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleMenuClick();
          }}
          aria-label="Open menu"
          className="fixed left-3 top-3 z-[95] h-12 w-12 rounded-full border border-white/25 bg-white/10 text-white shadow-2xl shadow-black/25 backdrop-blur-md ring-1 ring-white/15 active:scale-90 transition-transform hover:bg-white/25"
        >
          <span className="flex h-full w-full items-center justify-center">
            <Menu size={20} />
          </span>
        </button>

        <div className="flex justify-between items-start">
          <div className="space-y-2 pl-8 md:pl-0">
            <motion.h1
              initial={{ x: -90, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.08 }}
              className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase italic leading-none"
            >
              African Cuisine
            </motion.h1>
            <div className="flex gap-2">
              <span className={`${classNames.pill} text-orange-500`}>{getGreeting()}</span>
              <span className={`${classNames.pill} text-white/40 tracking-widest`}>T-{tableNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 bg-white text-black pl-4 pr-1.5 py-1.5 rounded-2xl active:scale-95 transition-all">
              <div className="text-right leading-none"><span className="text-[12px] font-black italic">KSh {cartTotal}</span></div>
              <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center"><ShoppingBag size={18} /></div>
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {menuCategories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <div className="relative h-[calc(100vh-200px)] w-full overflow-y-auto no-scrollbar pb-32">
        {activeCategory === 'All' ? (
          <div className="px-6">
            <div className="grid grid-cols-2 gap-4">
              {filteredFoods.map((food) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  key={food.id} 
                  className={`${classNames.glassCard} rounded-[30px] p-4 flex flex-col gap-3`}
                >
                  <img src={food.imageUrl} className="w-full aspect-square object-cover rounded-[20px]" alt={food.name} />
                  <div>
                    <div className="mb-2"><AvailabilityBadge status={food.status} /></div>
                    <h3 className="text-white font-black uppercase italic text-[10px] truncate">{food.name}</h3>
                    <p className={`${classNames.orangePrice} text-[12px]`}>KSh {food.price}</p>
                  </div>
                  <button 
                    onClick={() => addToBucket(food)} disabled={!isFoodAvailable(food)}
                    className="w-full py-2 bg-white/10 hover:bg-white hover:text-black text-white text-[8px] font-black uppercase rounded-xl transition-all disabled:opacity-30"
                  >
                    {isFoodAvailable(food) ? 'Add +' : 'Unavailable'}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <motion.div 
            drag="x" 
            dragConstraints={{ left: 0, right: 0 }} 
            onDragEnd={handleDragEnd}
            className="relative h-[calc(100vh-215px)] md:h-[65vh] w-full flex items-center justify-center touch-none"
          >
            <AnimatePresence mode="wait" custom={direction}>
              {currentFood && (
                <motion.div key={currentFood.id} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" className="absolute flex flex-col items-center w-full px-6 pointer-events-none translate-y-6 md:translate-y-0">
                  <motion.img 
                    animate={{ scale: isExpanded ? 0.8 : 1, y: isExpanded ? -60 : 0, borderRadius: isExpanded ? "40px" : "500px" }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    src={currentFood.imageUrl} 
                    className="w-64 h-64 md:w-[400px] md:h-[400px] object-cover shadow-2xl border-4 border-white/5 z-10" 
                    alt={currentFood.name}
                  />

                  {!isExpanded ? (
                    <div className="text-center mt-8 relative z-20 pointer-events-auto">
                      <div className="mb-4 flex justify-center"><AvailabilityBadge status={currentFood.status} /></div>
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-6 drop-shadow-lg">{currentFood.name}</h2>
                      <button onClick={() => setIsExpanded(true)} className="px-10 py-3.5 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-full font-black uppercase text-[10px] tracking-[0.3em] transition-all">View Details</button>
                    </div>
                  ) : (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`w-full max-w-md ${classNames.glassCard} backdrop-blur-3xl p-8 rounded-[40px] -mt-16 z-30 pointer-events-auto`}>
                      <div className="mb-4"><AvailabilityBadge status={currentFood.status} /></div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-white uppercase italic">{currentFood.name}</h3>
                        <div className="text-2xl font-black italic text-white">KSh {currentFood.price}</div>
                      </div>
                      <p className="text-white/50 text-xs mb-8 leading-relaxed">{currentFood.description}</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => addToBucket(currentFood)} disabled={!isFoodAvailable(currentFood)}
                          className="flex-[2] py-4 bg-orange-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 disabled:opacity-30"
                        >
                          {isFoodAvailable(currentFood) ? 'Add to bucket' : 'Unavailable'}
                        </button>
                        <button onClick={() => setIsExpanded(false)} className="flex-1 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest">Back</button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <PageFooter />
      </div>
      

      <FloatingHelpLink />

      {/* BUCKET / CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className={`${classNames.overlay} z-[95]`}
            />
            <motion.div initial={{ x: '115%', opacity: 0, scale: 0.96 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: '115%', opacity: 0, scale: 0.96 }} transition={{ type: "spring", damping: 24, stiffness: 210 }} className="fixed right-3 top-3 bottom-3 w-[min(92vw,400px)] z-[100] bg-white/10 backdrop-blur-2xl border border-white/20 p-5 md:p-6 flex flex-col rounded-[28px] shadow-2xl shadow-black/45 ring-1 ring-white/10">
             <div className="flex justify-between items-start mb-8">
               <DrawerTitle label="Bucket" title="Your Order" />
               <CloseButton onClick={() => setIsCartOpen(false)} />
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-white/10 rounded-2xl border border-white/10 shadow-lg shadow-black/10">
                    <img src={item.imageUrl} className="h-12 w-12 rounded-xl object-cover" alt={item.name} />
                    <div className="flex-1">
                      <h4 className="text-white font-black uppercase text-[10px] tracking-tight">{item.name}</h4>
                      <p className={`${classNames.orangePrice} text-[11px]`}>KSh {item.price}</p>
                    </div>
                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="h-8 w-8 rounded-full bg-white/5 text-white/40 hover:bg-red-500/15 hover:text-red-300 flex items-center justify-center transition-colors"><X size={14} /></button>
                  </div>
                ))}
             </div>
             <div className="pt-8 border-t border-white/10">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total</span>
                  <span className="text-3xl font-black text-white italic tracking-tighter">KSh {cartTotal}</span>
                </div>
                <button 
                  disabled={cart.length === 0 || isSubmitting} onClick={openPaymentChoice} 
                  className="w-full py-5 bg-white text-black font-black uppercase rounded-2xl active:scale-95 shadow-xl shadow-black/20 disabled:opacity-20"
                >
                  {isSubmitting ? "Processing..." : "Confirm Order"}
                </button>
             </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.96 }} className="w-full max-w-sm bg-white rounded-[28px] p-6 text-black shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600 mb-2">Payment</p>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Choose Method</h2>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:scale-90">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-5 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
                <span className="text-2xl font-black italic">KSh {cartTotal}</span>
              </div>

              <label className="block mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">M-Pesa Phone</span>
                <input
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500"
                />
              </label>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => confirmOrder('MPESA')}
                  disabled={isSubmitting || !mpesaPhone.trim()}
                  className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-40"
                >
                  {isSubmitting ? 'Processing...' : 'Pay with M-Pesa'}
                </button>
                <button
                  onClick={() => confirmOrder('CASH')}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-40"
                >
                  Pay Cash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal show={showLoginModal} onSubmit={handleLogin} />

      {/* PAGINATION DOTS */}
      {!isExpanded && activeCategory !== 'All' && (
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
  return (
    <Suspense fallback={<div className="h-screen bg-black" />}><SliderContent /></Suspense>
  );
}

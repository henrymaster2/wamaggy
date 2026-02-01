'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { useFoodThemes } from './hooks/useFoodThemes'; 
import { ShoppingBag, Search, X, Utensils, Plus } from 'lucide-react';

interface FoodWithTheme {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  status: string;
  imageUrl: string;
  variations?: any[];
  themeColor: string;
}

type Category = 'Food' | 'Drinks' | 'Fruits' | 'Others' | 'All';

function SliderContent() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || 'Takeaway';
  
  const [activeCategory, setActiveCategory] = useState<Category>('Food');
  const { foods, loading } = (useFoodThemes as any)(activeCategory); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cart, setCart] = useState<FoodWithTheme[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0); 

  useEffect(() => {
    const hasVisited = localStorage.getItem('wamaggy_tutorial_v4');
    if (!hasVisited) {
      setTutorialStep(1);
      const t1 = setTimeout(() => setTutorialStep(2), 4000);
      const t2 = setTimeout(() => setTutorialStep(3), 8000);
      const t3 = setTimeout(() => {
        setTutorialStep(0);
        localStorage.setItem('wamaggy_tutorial_v4', 'true');
      }, 12000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, []);

  const addToBucket = (food: FoodWithTheme) => {
    setCart([...cart, food]);
    setIsExpanded(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const filteredFoods = foods.filter((item: FoodWithTheme) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'All') return matchesSearch;
    return item.category?.toLowerCase() === activeCategory.toLowerCase() && matchesSearch;
  });

  useEffect(() => {
    setCurrentIndex(0);
    setIsExpanded(false);
  }, [activeCategory, searchTerm]);

  const confirmOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableNumber: tableNumber, 
          items: cart,
          total: cartTotal 
        }),
      });

      if (response.ok) {
        alert("Order Confirmed! Your food is being prepared.");
        setCart([]);
        setIsCartOpen(false);
      } else {
        throw new Error("Failed to send order");
      }
    } catch (error) {
      console.error('Order Error:', error);
      alert("Something went wrong. Please call a waiter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white font-black tracking-widest animate-pulse italic">
        WAMAGGY...
      </div>
    );

  const currentFood = filteredFoods[currentIndex] as FoodWithTheme;

  const paginate = (newDirection: number) => {
    if (filteredFoods.length <= 1) return;
    setIsExpanded(false);
    setDirection(newDirection);
    setCurrentIndex((prev: number) => (prev + newDirection + filteredFoods.length) % filteredFoods.length);
  };

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (info.offset.x > 100) paginate(-1);
    else if (info.offset.x < -100) paginate(1);
  };

  const variants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)',
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] },
    }),
  };

  return (
    <main
      className="relative h-screen w-full overflow-hidden transition-colors duration-1000 ease-in-out"
      style={{
        backgroundColor: activeCategory !== 'All' && currentFood ? `${currentFood.themeColor}10` : '#000',
      }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black via-black/40 to-black opacity-90 z-0" />

      {/* HEADER SECTION */}
      <header className="relative z-60 flex flex-col p-6 md:p-10 gap-6">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col">
            <div className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Wamaggy Restaurant
            </div>
            <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">
              Table {tableNumber}
            </span>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="relative flex items-center gap-2">
              <AnimatePresence>
                {isSearching && (
                  <motion.input 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 150, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-[10px] outline-none backdrop-blur-md"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                )}
              </AnimatePresence>
              <div className="relative">
                <button
                  onClick={() => setIsSearching(!isSearching)}
                  className={`flex items-center justify-center p-3 rounded-full border transition-all ${isSearching ? 'bg-white text-black' : 'border-white/20 text-white'}`}
                >
                  <Search size={16} />
                </button>
                <AnimatePresence>
                  {tutorialStep === 1 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-12 right-0 w-32 bg-orange-500 text-white p-2 text-[8px] font-black uppercase rounded-lg shadow-2xl z-70">
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-orange-500 rotate-45" />
                      Search for your favorites here!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-3 bg-white text-black px-4 py-2 rounded-full shadow-xl active:scale-95 transition"
              >
                <ShoppingBag size={16} />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[8px] font-black uppercase">Bucket ({cart.length})</span>
                  <span className="text-[12px] font-black italic">KSh {cartTotal}</span>
                </div>
              </button>
              <AnimatePresence>
                {tutorialStep === 3 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-12 right-0 w-32 bg-white text-black p-2 text-[8px] font-black uppercase rounded-lg shadow-2xl z-70">
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-white rotate-45" />
                    Review and confirm your order here!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {['Food', 'Drinks', 'Fruits', 'Others', 'All'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as Category)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-white text-black'
                  : 'text-white/40 border border-white/10'
              }`}
            >
              {cat === 'All' ? 'View All ☰' : cat}
            </button>
          ))}
          <AnimatePresence>
            {tutorialStep === 2 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute top-10 left-0 bg-blue-500 text-white p-2 text-[8px] font-black uppercase rounded-lg shadow-2xl z-70">
                Browse by category or see everything!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="relative h-[70vh] w-full overflow-y-auto no-scrollbar">
        {activeCategory === 'All' ? (
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
            {filteredFoods.map((item: FoodWithTheme) => ( // FIXED: Added type definition
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white flex flex-col group"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl mb-3">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.name} />
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                    <p className="text-[10px] font-black text-orange-400">KSh {item.price}</p>
                  </div>
                </div>
                <h3 className="font-black text-[10px] uppercase truncate mb-1">{item.name}</h3>
                <p className="text-[8px] text-white/40 uppercase tracking-tighter mb-3">{item.category}</p>
                <button
                  onClick={() => addToBucket(item)}
                  className="w-full py-2 rounded-lg text-black font-black uppercase text-[9px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                  style={{ backgroundColor: item.themeColor }}
                >
                  <Plus size={12} /> Add
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center overflow-hidden">
            {currentFood ? (
              <>
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing pointer-events-auto"
                />
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={`${activeCategory}-${currentIndex}`}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute w-full max-w-6xl px-6 flex flex-col items-center justify-center z-20 pointer-events-none"
                  >
                    <motion.div
                      animate={{
                        y: isExpanded ? -100 : 0,
                        scale: isExpanded ? 0.7 : 1,
                        rotate: isExpanded ? -5 : 0,
                      }}
                      className="relative shrink-0 mb-8 transition-all duration-700"
                    >
                      <div className="absolute -inset-10 rounded-full blur-3xl opacity-20" style={{ backgroundColor: currentFood.themeColor }} />
                      <img src={currentFood.imageUrl} className="relative w-64 h-64 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl border border-white/5" alt={currentFood.name} />
                    </motion.div>
                    
                    {!isExpanded && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white">
                        <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter drop-shadow-lg">{currentFood.name}</h1>
                        <button onClick={() => setIsExpanded(true)} className="pointer-events-auto mt-4 px-8 py-3 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Details ↗</button>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="pointer-events-auto w-full max-w-xl p-8 rounded-[40px] border border-white/10 bg-black/80 backdrop-blur-3xl text-white shadow-2xl -mt-20 z-50">
                          <div className="flex justify-between items-end mb-6">
                            <div>
                              <h2 className="text-3xl font-black uppercase">{currentFood.name}</h2>
                              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{currentFood.status}</span>
                            </div>
                            <div className="text-4xl font-black italic" style={{ color: currentFood.themeColor }}>KSh {currentFood.price}</div>
                          </div>
                          <p className="text-gray-400 text-sm mb-8 leading-relaxed">{currentFood.description}</p>
                          <div className="flex gap-4">
                            <button onClick={() => addToBucket(currentFood)} className="flex-1 py-4 rounded-2xl font-black uppercase text-xs text-black active:scale-95" style={{ backgroundColor: currentFood.themeColor }}>Add To Bucket</button>
                            <button onClick={() => setIsExpanded(false)} className="px-6 py-4 rounded-2xl border border-white/10 font-bold text-xs uppercase hover:bg-white/10">Close</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </>
            ) : <div className="text-white/20 font-black uppercase italic tracking-widest">No Items</div>}
          </div>
        )}
      </div>

      {/* BUCKET MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Your Bucket</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-white p-2 border border-white/20 rounded-full"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                    <Utensils size={48} className="mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest">Bucket is empty</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <motion.div layout key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-white font-black uppercase text-sm">{item.name}</p>
                        <p className="text-white/40 text-[10px] font-bold">KSh {item.price}</p>
                      </div>
                    </div>
                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-red-500 text-[10px] font-black uppercase px-2 py-1">Remove</button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-6 px-2">
                <span className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                <span className="text-3xl font-black text-white italic">KSh {cartTotal}</span>
              </div>
              <button 
                disabled={cart.length === 0 || isSubmitting}
                onClick={confirmOrder}
                className="w-full py-5 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 disabled:opacity-30"
              >
                {isSubmitting ? "Processing..." : "Confirm Order"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER PAGINATION */}
      {activeCategory !== 'All' && (
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex justify-between items-end z-50">
          <button onClick={() => paginate(-1)} className="group flex flex-col items-start gap-2 text-white/50 hover:text-white transition">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Prev</span>
            <span className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-white transition-all"></span>
          </button>
          <div className="flex gap-2 mb-1">
            {filteredFoods.map((_: any, i: number) => (
              <div key={i} className="h-1 rounded-full transition-all duration-500"
                style={{ width: i === currentIndex ? '32px' : '6px', backgroundColor: i === currentIndex ? currentFood?.themeColor : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>
          <button onClick={() => paginate(1)} className="group flex flex-col items-end gap-2 text-white/50 hover:text-white transition">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Next</span>
            <span className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-white transition-all"></span>
          </button>
        </div>
      )}
    </main>
  );
}

export default function HiddenDetailsSlider() {
  return (
    <Suspense fallback={<div className="h-screen bg-black" />}>
      <SliderContent />
    </Suspense>
  );
}
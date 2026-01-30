'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { useFoodThemes } from './hooks/useFoodThemes'; 

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

type Category = 'Food' | 'Drinks' | 'Fruits' | 'Others';

function SliderContent() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table');
  
  const [activeCategory, setActiveCategory] = useState<Category>('Food');
  const { foods, loading } = (useFoodThemes as any)(activeCategory); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  /* 🔒 CATEGORY ISOLATION — NO CSS IMPACT */
  const normalizedCategory = activeCategory.toLowerCase();

  const filteredFoods = foods.filter(
    (item: FoodWithTheme) =>
      item.category &&
      item.category.toLowerCase().trim() === normalizedCategory
  );

  useEffect(() => {
    setCurrentIndex(0);
    setIsExpanded(false);
  }, [activeCategory]);

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
    setCurrentIndex(
      (prev: number) =>
        (prev + newDirection + filteredFoods.length) %
        filteredFoods.length
    );
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
        backgroundColor: currentFood
          ? `${currentFood.themeColor}10`
          : '#000',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black opacity-90 z-0" />

      <header className="relative z-50 flex flex-col p-6 md:p-10 gap-6">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <div className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Wamaggy Restaurant
            </div>
            {tableNumber && (
              <span className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">
                Serving {tableNumber}
              </span>
            )}
          </div>
          <a
            href="/full-menu"
            className="text-[10px] font-bold tracking-[0.2em] uppercase border-b border-white/30 pb-1 text-white hover:border-white transition"
          >
            Search Menu
          </a>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {['Food', 'Drinks', 'Fruits', 'Others'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as Category)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-white text-black'
                  : 'text-white/40 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="relative h-[65vh] w-full flex items-center justify-center">
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
                  className="relative shrink-0 mb-8 transition-all duration-700 ease-in-out"
                >
                  <div
                    className="absolute -inset-10 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: currentFood.themeColor }}
                  />
                  <img
                    src={currentFood.imageUrl}
                    alt={currentFood.name}
                    className="relative w-64 h-64 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl border border-white/5"
                  />
                </motion.div>

                {!isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-white"
                  >
                    <h1 className="text-4xl md:text-7xl font-black leading-none mb-4 tracking-tighter uppercase italic drop-shadow-lg">
                      {currentFood.name}
                    </h1>
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="pointer-events-auto mt-4 px-8 py-3 rounded-full border border-white/20 text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-all"
                    >
                      View Details & Price ↗
                    </button>
                  </motion.div>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="pointer-events-auto w-full max-w-xl p-8 rounded-[40px] border border-white/10 bg-black/60 backdrop-blur-3xl text-white shadow-2xl -mt-20 z-50"
                    >
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">
                            {currentFood.name}
                          </h2>
                          <span className="text-[10px] font-black tracking-widest opacity-50 uppercase">
                            {currentFood.status}
                          </span>
                        </div>
                        <div
                          className="text-4xl font-black italic"
                          style={{ color: currentFood.themeColor }}
                        >
                          {currentFood.price > 0
                            ? `KSh ${currentFood.price}`
                            : 'Select Size'}
                        </div>
                      </div>

                      {currentFood.variations &&
                        currentFood.variations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {currentFood.variations.map(
                              (v: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold"
                                >
                                  {v.type} - KSh {v.price}
                                </div>
                              )
                            )}
                          </div>
                        )}

                      <p className="text-gray-400 leading-relaxed mb-8 text-sm">
                        {currentFood.description}
                      </p>

                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            alert(`Ordering ${currentFood.name}`)
                          }
                          className="flex-1 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-black transition-transform active:scale-95 shadow-lg"
                          style={{
                            backgroundColor: currentFood.themeColor,
                          }}
                        >
                          Add To Order
                        </button>
                        <button
                          onClick={() => setIsExpanded(false)}
                          className="px-6 py-4 rounded-2xl border border-white/10 font-bold text-xs uppercase hover:bg-white/10"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <div className="text-white/20 font-black text-xl tracking-[0.3em] uppercase italic text-center">
            No items in {activeCategory}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex justify-between items-end z-50">
        <button
          onClick={() => paginate(-1)}
          className="group flex flex-col items-start gap-2 text-white/50 hover:text-white transition"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
            Prev
          </span>
          <span className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-white transition-all"></span>
        </button>

        <div className="flex gap-2 mb-1">
          {filteredFoods.map((_: any, i: number) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i === currentIndex ? '32px' : '6px',
                backgroundColor:
                  i === currentIndex
                    ? currentFood?.themeColor
                    : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          className="group flex flex-col items-end gap-2 text-white/50 hover:text-white transition"
        >
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
            Next
          </span>
          <span className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-white transition-all"></span>
        </button>
      </div>
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

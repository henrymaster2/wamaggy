'use client';

import React, { useEffect, useState } from 'react';
import { 
  PlusCircle, 
  Search,
  Trash2,
  ChevronDown,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

type FoodStatus = 'Available' | 'Pending' | 'Not Available';

interface FoodItem {
  id: number;
  name: string;
  price: number;
  description: string;
  status: FoodStatus;
  imageUrl?: string;
  category: string; // Added category
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch foods from API
  const fetchFoods = async () => {
    try {
      const res = await fetch('/api/food');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFoods(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // ✅ FIXED: Using PATCH instead of POST for updates
  const handleStatusChange = async (id: number, newStatus: FoodStatus) => {
    try {
      // Optimistic update
      setFoods(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));

      const res = await fetch(`/api/food`, {
        method: 'PATCH', // MUST BE PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Update failed');
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Refreshing...");
      fetchFoods(); // Revert on error
    }
  };

  // ✅ NEW: Added Delete Functionality
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`/api/food?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFoods(prev => prev.filter(item => item.id !== id));
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    }
  };

  const StatusBadge = ({ status }: { status: FoodStatus }) => {
    const styles = {
      'Available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
      'Not Available': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft size={20} className="text-slate-500" />
            </Link>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">Wamaggy Choma</h1>
              <p className="text-slate-500 font-medium">Menu Inventory Control</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search dishes or categories..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-none shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 font-bold animate-pulse">Loading Inventory...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFoods.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 transition-all hover:shadow-xl group">
                <div className="relative h-48">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={48} strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <StatusBadge status={item.status} />
                  </div>
                  {/* DELETE BUTTON */}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">{item.category}</span>
                  </div>
                  <h3 className="font-bold text-xl text-slate-800 line-clamp-1">{item.name}</h3>
                  <p className="text-slate-900 font-black text-lg">KSh {item.price.toLocaleString()}</p>

                  <div className="mt-6">
                    <div className="relative">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as FoodStatus)}
                        className={`w-full pl-4 pr-10 py-3 rounded-xl text-sm font-bold border-2 appearance-none outline-none cursor-pointer transition-all ${
                          item.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:border-emerald-300' :
                          item.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 focus:border-amber-300' :
                          'bg-rose-50 text-rose-700 border-rose-100 focus:border-rose-300'
                        }`}
                      >
                        <option value="Available">Available</option>
                        <option value="Pending">Pending</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link href="/staff" className="group border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-10 hover:border-orange-500 hover:bg-orange-50/50 transition-all min-h-[350px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-100 group-hover:text-orange-500 transition-all">
                <PlusCircle size={32} />
              </div>
              <span className="mt-4 font-bold text-slate-400 group-hover:text-orange-600">Add New Item</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
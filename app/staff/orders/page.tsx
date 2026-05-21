'use client';

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, ChefHat, Timer, AlertCircle, RefreshCcw, Banknote, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface Order {
  id: number;
  table: string;
  total: number;
  status: string;
  paymentType: string;
  paymentStatus: string;
  mpesaReceiptNumber?: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  color: string;
  icon: React.ReactNode;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch ALL Orders
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch orders');
      }

      if (!Array.isArray(data)) {
        throw new Error('Orders API returned an invalid response');
      }

      // We keep ALL data here so 'Orders Today' stays accurate
      setOrders(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      setOrders([]);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // 2. Update Status Function
  const updateStatus = async (orderId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'PENDING' ? 'READY' : 'SERVED';
    
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: nextStatus }),
      });

      if (res.ok) {
        fetchOrders(); // Refresh data to reflect changes
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const markPaymentPaid = async (orderId: number) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, paymentStatus: 'PAID' }),
      });

      if (res.ok) fetchOrders();
    } catch (error) {
      console.error("Payment update failed", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); 
    return () => clearInterval(interval);
  }, []);

  // Logical counts for the StatCards
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const totalOrdersToday = orders.length; // This will no longer decrease
  const servedIncome = orders
    .filter(o => o.status === 'SERVED')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const formattedServedIncome = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(servedIncome);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 font-black italic text-slate-400">
      <RefreshCcw className="animate-spin mr-2" size={24} /> LOADING KITCHEN...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Kitchen Command</h1>
          <p className="text-slate-500 font-medium">Real-time order management system</p>
          {error && (
            <p className="mt-2 text-sm font-bold text-red-600">
              {error}
            </p>
          )}
        </div>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw size={16} /> Refresh Feed
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <StatCard title="Pending (Kitchen)" value={pendingCount} color="text-orange-600" icon={<ChefHat size={20}/>} />
        <StatCard title="Ready to Serve" value={readyCount} color="text-blue-600" icon={<CheckCircle size={20}/>} />
        <StatCard title="Total Orders Today" value={totalOrdersToday} color="text-emerald-600" icon={<Timer size={20}/>} />
        <StatCard title="Served Income" value={formattedServedIncome} color="text-violet-600" icon={<Banknote size={20}/>} />
      </div>

      {/* Orders Grid - Visually filtering out SERVED orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {orders
            .filter(order => order.status !== 'SERVED') 
            .map((order) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={order.id} 
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Top Bar */}
              <div className={`p-4 flex justify-between items-center ${
                order.status === 'READY' ? 'bg-emerald-500' : 'bg-slate-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg text-white">
                    <span className="text-[10px] block font-bold uppercase leading-none opacity-70">Table</span>
                    <span className="text-xl font-black leading-none">{order.table || '??'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Order #{order.id}</h4>
                    <span className="text-[10px] text-white/60 font-medium italic">{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                    <Clock size={12} /> {order.status}
                  </div>
                  <PaymentBadge order={order} />
                </div>
              </div>

              {/* Items List */}
              <div className="p-6 flex-1">
                <div className="space-y-4 mb-6">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                      <div className="flex-1">
                        <p className="text-slate-800 font-bold text-sm uppercase leading-none mb-1">{item.name}</p>
                        <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">Qty: 1</p>
                      </div>
                      <CheckCircle size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-auto">
                  <div className="leading-none">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Bill</p>
                    <p className="text-lg font-black text-slate-900 italic">KSh {order.total}</p>
                  </div>
                  <div className="flex gap-2">
                    {order.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => markPaymentPaid(order.id)}
                        className="px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                      <AlertCircle size={20} />
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, order.status)}
                      className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                       order.status === 'READY' 
                       ? 'bg-emerald-600 text-white shadow-emerald-200' 
                       : 'bg-orange-500 text-white shadow-orange-200'
                    }`}>
                      {order.status === 'READY' ? 'Mark Served' : 'Mark as Ready'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {orders.filter(o => o.status !== 'SERVED').length === 0 && (
        <div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest">
          All caught up! No active orders.
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className={`text-4xl font-black ${color} italic`}>{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl bg-slate-50 ${color}`}>
        {icon}
      </div>
    </div>
  );
}

function PaymentBadge({ order }: { order: Order }) {
  const isMpesa = order.paymentType === 'MPESA';
  const paid = order.paymentStatus === 'PAID';
  const failed = order.paymentStatus === 'FAILED';
  const Icon = isMpesa ? Smartphone : Banknote;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
      paid ? 'bg-emerald-100 text-emerald-700' : failed ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
    }`}>
      <Icon size={12} />
      {isMpesa ? 'M-Pesa' : 'Cash'} · {order.paymentStatus || 'PENDING'}
    </div>
  );
}

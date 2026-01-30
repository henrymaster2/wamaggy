'use client';

import React from 'react';
import { Clock, CheckCircle, ChefHat, MapPin, Phone } from 'lucide-react';

export default function OrdersPage() {
  const orders = [
    { id: '1024', table: 'B4', items: ['2x Choma Platter', '4x Soda'], total: 3200, time: '5m ago', status: 'In Kitchen' },
    { id: '1025', table: 'A1', items: ['1x Wet Fry Tilapia'], total: 850, time: '12m ago', status: 'Ready' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Pending Orders</p>
          <h3 className="text-3xl font-bold text-orange-600">12</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Avg. Prep Time</p>
          <h3 className="text-3xl font-bold text-blue-600">18 min</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Completed Today</p>
          <h3 className="text-3xl font-bold text-emerald-600">48</h3>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Table Badge */}
            <div className={`p-6 md:w-32 flex flex-col items-center justify-center text-white ${
              order.status === 'Ready' ? 'bg-emerald-500' : 'bg-orange-500'
            }`}>
              <span className="text-xs font-bold uppercase opacity-80">Table</span>
              <span className="text-3xl font-black">{order.table}</span>
            </div>

            {/* Order Details */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-800 underline decoration-orange-200">Order #{order.id}</h4>
                  <div className="flex items-center text-slate-400 text-xs mt-1">
                    <Clock size={12} className="mr-1" /> {order.time}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  order.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {order.status}
                </span>
              </div>

              <ul className="space-y-2 mb-6">
                {order.items.map((item, i) => (
                  <li key={i} className="text-slate-600 font-medium flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-800">Total: KSh {order.total}</span>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-slate-600">
                    Cancel
                  </button>
                  <button className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    {order.status === 'Ready' ? 'Mark Served' : 'Mark Ready'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
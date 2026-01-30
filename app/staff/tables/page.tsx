'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { PlusCircle, CheckCircle2, Printer, Trash2 } from 'lucide-react';

interface Table {
  id: string;
  name: string;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [tableName, setTableName] = useState('');
  const [success, setSuccess] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  // Automatically detect the site URL (localhost or your deployed domain)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleAddTable = () => {
    if (!tableName.trim()) return;

    const newTable: Table = {
      id: Math.random().toString(36).substr(2, 9),
      name: tableName.trim(),
    };

    setTables([...tables, newTable]);
    setTableName('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const removeTable = (id: string) => {
    setTables(tables.filter(t => t.id !== id));
  };

  // Function to trigger a print of the QR codes
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header - Hidden during print */}
        <div className="print:hidden">
          <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tighter">QR Generator</h2>
          <p className="text-slate-500 mb-8">Generate unique scan-to-order codes for every table.</p>

          {success && (
            <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 mb-6 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={18} />
              <span className="font-bold text-sm text-emerald-800">Table linked successfully!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <input
              type="text"
              placeholder="e.g., Table 01 or Balcony A"
              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none bg-white text-slate-900 shadow-sm"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
            />
            <button
              onClick={handleAddTable}
              className="px-8 py-3 rounded-xl bg-orange-600 text-white font-black hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
            >
              <PlusCircle size={18} />
              Add Table
            </button>
            {tables.length > 0 && (
              <button
                onClick={handlePrint}
                className="px-8 py-3 rounded-xl bg-slate-900 text-white font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer size={18} />
                Print All
              </button>
            )}
          </div>
        </div>

        {/* QR Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 print:block">
          {tables.map((table) => {
            // Encode the name to handle spaces like "Table 1" -> "Table%201"
            const qrValue = `${baseUrl}/?table=${encodeURIComponent(table.name)}`;
            
            return (
              <div
                key={table.id}
                className="bg-white rounded-[24px] p-8 border border-slate-200 shadow-xl flex flex-col items-center relative group print:shadow-none print:border-dashed print:mb-10"
              >
                {/* Delete button - Hidden during print */}
                <button 
                  onClick={() => removeTable(table.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors print:hidden"
                >
                  <Trash2 size={16} />
                </button>

                <div className="bg-slate-50 w-full py-2 rounded-lg mb-6 text-center">
                   <h3 className="font-black text-xl text-slate-900 uppercase tracking-widest">{table.name}</h3>
                </div>
                
                <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100">
                  <QRCode
                    value={qrValue}
                    size={200}
                    level="H" // High error correction (better for stickers)
                    fgColor="#000000"
                  />
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scan to Order</p>
                  <p className="text-[10px] text-slate-300 break-all max-w-[200px]">{qrValue}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printing Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          .print\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
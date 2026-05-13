'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PlusCircle, 
  Utensils, 
  ClipboardList, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon,
  QrCode,
  X,
  Beer,
  Pizza,
  Apple,
  Layers
} from 'lucide-react';

type FoodStatus = 'Available' | 'Pending' | 'Not Available';
type Category = 'Food' | 'Drinks' | 'Fruits' | 'Others';

interface Variation {
  type: string;
  price: number;
}

const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const IMAGE_QUALITY = 0.82;

async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This image could not be read. Try a JPG, PNG, or WebP file.'));
      img.src = imageUrl;
    });

    const scale = Math.min(
      1,
      MAX_IMAGE_WIDTH / image.naturalWidth,
      MAX_IMAGE_HEIGHT / image.naturalHeight
    );
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY);
    });

    if (!blob) return file;

    const fileName = file.name.replace(/\.[^.]+$/, '') || 'menu-item';
    return new File([blob], `${fileName}.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function AddFoodPage() {
  const pathname = usePathname();
  
  // Form State
  const [category, setCategory] = useState<Category>('Food');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FoodStatus>('Available');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Variations for Drinks/Fruits
  const [variations, setVariations] = useState<Variation[]>([]);
  const [varType, setVarType] = useState('');
  const [varPrice, setVarPrice] = useState<number | ''>('');

  const handleAddVariation = () => {
    if (!varType || !varPrice) return;
    setVariations([...variations, { type: varType, price: Number(varPrice) }]);
    setVarType('');
    setVarPrice('');
  };

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = await prepareImageForUpload(e.target.files[0]);
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
      } catch (err: any) {
        alert(err.message || 'Could not prepare this image for upload.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Strict Validation
    if (!name || !description || !image) {
        alert("Please provide a Name, Description, and Image.");
        return;
    }

    // Determine final price: Use base price input unless variations are present for drinks/fruits
    const finalPrice = category === 'Food' 
      ? Number(price) 
      : (variations.length > 0 ? variations[0].price : Number(price));

    if (!finalPrice || finalPrice <= 0) {
        alert("Please set a valid price (Base Price or Variation Price).");
        return;
    }

    setSubmitting(true);

    try {
      // 2. Upload Image to Cloudinary via your API
      const formData = new FormData();
      formData.append('file', image);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
      const { imageUrl } = uploadData;

      // 3. Save Item to Database
      const payload = {
        name,
        category,
        price: finalPrice,
        description,
        status,
        imageUrl,
        variations: category !== 'Food' ? variations : [],
      };

      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save item to database');
      }

      setSuccess(true);
      
      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setStatus('Available');
      setImage(null);
      setImagePreview('');
      setVariations([]);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }: { status: FoodStatus }) => {
    const styles = {
      'Available': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
      'Not Available': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 text-center">
          <h1 className="text-xl font-bold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            African Cuisine
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Staff Panel</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <Link href="/staff" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${pathname === '/staff' ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <PlusCircle size={20} /><span className="font-semibold">Add New Item</span>
          </Link>
          <Link href="/staff/inventory" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-semibold">
            <Utensils size={20} /><span>Menu Inventory</span>
          </Link>
          <Link href="/staff/orders" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-semibold">
            <ClipboardList size={20} /><span>Live Orders</span>
          </Link>
          <Link href="/staff/tables" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-semibold">
            <QrCode size={20} /><span>Add Table</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">Add to Digital Menu</h2>
              <p className="text-slate-500 mt-1">Configure item details for customers to see.</p>
            </div>
            {success && (
              <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                <CheckCircle2 size={18} /><span className="font-medium text-sm">Item Published!</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit border border-slate-200">
            {[
              { id: 'Food', icon: Pizza },
              { id: 'Drinks', icon: Beer },
              { id: 'Fruits', icon: Apple },
              { id: 'Others', icon: Layers }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as Category)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${category === cat.id ? 'bg-white text-orange-600 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <cat.icon size={16} />
                {cat.id}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">{category} Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                      placeholder={`e.g. ${category === 'Drinks' ? 'Soda' : 'Mbuzi Choma'}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Base Price (KSh)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">KES</span>
                      <input
                        type="number"
                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {category !== 'Food' && (
                  <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase text-orange-800 tracking-widest">Sizes / Variations</label>
                        <span className="text-[10px] text-orange-400 font-bold uppercase italic">Recommended for drinks</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 500ml"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-medium"
                        value={varType}
                        onChange={(e) => setVarType(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-28 px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm font-medium"
                        value={varPrice}
                        onChange={(e) => setVarPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      <button 
                        type="button" 
                        onClick={handleAddVariation}
                        className="bg-orange-600 text-white px-3 rounded-xl hover:bg-orange-700 transition-colors"
                      >
                        <PlusCircle size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variations.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white border border-orange-200 px-3 py-1.5 rounded-full text-xs font-bold text-orange-700 shadow-sm">
                          {v.type}: {v.price}/-
                          <button type="button" onClick={() => removeVariation(i)} className="ml-1 text-orange-300 hover:text-red-500"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none font-medium"
                    placeholder="Short description for the customer..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Availability Status</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-700 cursor-pointer appearance-none"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FoodStatus)}
                    >
                      <option value="Available">Available Now</option>
                      <option value="Pending">Pending / Out of Stock</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">Item Image</label>
                    <label className="flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-400 cursor-pointer transition-all text-slate-500 bg-slate-50">
                      <Upload size={18} className="mr-2" />
                      <span className="text-xs font-bold uppercase tracking-tight">{image ? 'Image Ready' : 'Select Photo'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>

                <button
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? 'Syncing...' : `Add to ${category} Section`}
                </button>
              </form>
            </div>

            <div className="h-fit sticky top-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Customer Preview</h3>
              <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl">
                <div className="relative">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-64 object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-64 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={48} strokeWidth={1} />
                      <p className="text-[10px] mt-2 font-black uppercase tracking-widest">No Image</p>
                    </div>
                  )}
                  <div className="absolute top-5 right-5 scale-110"><StatusBadge status={status} /></div>
                </div>
                <div className="p-8">
                  <h4 className="font-black text-2xl text-slate-800 italic uppercase tracking-tighter leading-tight">{name || 'New Item'}</h4>
                  
                  {category !== 'Food' && variations.length > 0 ? (
                    <div className="mt-3">
                      <div className="text-xs font-black border-2 border-slate-100 rounded-lg px-3 py-2 bg-slate-50 text-orange-600">
                        {variations[0].type} — KSh {variations[0].price}
                      </div>
                    </div>
                  ) : (
                    <p className="text-orange-600 font-black text-2xl mt-1 tracking-tighter">KSh {price || '0.00'}</p>
                  )}

                  <p className="text-slate-500 text-sm mt-4 line-clamp-3 leading-relaxed font-medium">
                    {description || 'Product details will appear here for the customer.'}
                  </p>
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                      {category}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                      <PlusCircle size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

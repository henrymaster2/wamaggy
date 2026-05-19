'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCircle2, RefreshCcw, Send } from 'lucide-react';

type SendResult = {
  sent: number;
  failed: number;
  removed: number;
  subscriberCount: number;
};

export default function StaffNotificationsPage() {
  const [title, setTitle] = useState('African Cuisine');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const fetchStats = async () => {
    setLoadingStats(true);

    try {
      const res = await fetch('/api/notifications/broadcast');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load subscribers.');
      setSubscriberCount(data.subscriberCount || 0);
    } catch (error) {
      console.error(error);
      alert('Could not load notification subscribers.');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert('Please enter a title and message.');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, url }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send notification.');

      setResult(data);
      setSubscriberCount(Math.max(0, (data.subscriberCount || 0) - (data.removed || 0)));
      setMessage('');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Could not send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-4">
            <Link href="/staff" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft size={20} className="text-slate-500" />
            </Link>
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Notifications</h1>
              <p className="text-slate-500 font-medium">Send announcements to subscribed customer devices.</p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <RefreshCcw size={16} className={loadingStats ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Notification Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={70}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                placeholder="African Cuisine"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={180}
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                placeholder="Example: Fresh pilau is ready now. Visit us before it sells out."
              />
              <p className="mt-2 text-xs text-slate-400 font-bold">{message.length}/180 characters</p>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Opens When Tapped
              </label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                placeholder="/"
              />
            </div>

            <button
              type="submit"
              disabled={sending || subscriberCount === 0}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-orange-600 px-6 py-4 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>

          <aside className="space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center mb-5">
                <Bell size={28} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-2">Subscribers</p>
              <p className="text-5xl font-black italic tracking-tighter">{loadingStats ? '...' : subscriberCount}</p>
              <p className="text-sm text-white/50 mt-4 leading-relaxed">
                These are devices that allowed notifications from this app.
              </p>
            </div>

            {result && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-emerald-900">
                <div className="flex items-center gap-2 font-black uppercase text-sm mb-4">
                  <CheckCircle2 size={18} /> Broadcast Complete
                </div>
                <div className="space-y-2 text-sm font-bold">
                  <p>Sent: {result.sent}</p>
                  <p>Failed: {result.failed}</p>
                  <p>Expired removed: {result.removed}</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

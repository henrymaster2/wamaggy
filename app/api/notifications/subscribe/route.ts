import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const sub = await request.json();

    if (!sub?.endpoint || !sub?.keys?.auth || !sub?.keys?.p256dh) {
      return NextResponse.json(
        { error: 'Invalid push subscription.' },
        { status: 400 }
      );
    }
    
    // Save or update existing endpoint tokens seamlessly
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: {
        auth: sub.keys.auth,
        p256dh: sub.keys.p256dh
      },
      create: {
        endpoint: sub.endpoint,
        auth: sub.keys.auth,
        p256dh: sub.keys.p256dh,
        // userId: can be passed optionally if user is authenticated
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription failed:', error);
    return NextResponse.json({ error: 'Database tracking failed.' }, { status: 500 });
  }
}

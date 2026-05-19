import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const webpush = require('web-push');
const vapidEmail = process.env.VAPID_EMAIL || 'admin@africancuisine.com';
const vapidSubject = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`;

webpush.setVapidDetails(
  vapidSubject,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET() {
  try {
    const subscriberCount = await prisma.pushSubscription.count();
    return NextResponse.json({ subscriberCount });
  } catch (error) {
    console.error('Notification stats failed:', error);
    return NextResponse.json(
      { error: 'Failed to load notification stats.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title || '').trim();
    const message = String(body.message || '').trim();
    const targetUrl = String(body.url || '/').trim() || '/';

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required.' },
        { status: 400 }
      );
    }

    const subscribers = await prisma.pushSubscription.findMany();

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        removed: 0,
        subscriberCount: 0,
      });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}` },
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    await Promise.all(
      subscribers.map(async (sub) => {
        const pushTarget = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        };

        try {
          await webpush.sendNotification(pushTarget, payload);
          sent += 1;
        } catch (error: any) {
          failed += 1;

          if (error.statusCode === 410 || error.statusCode === 404) {
            removed += 1;
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.error(`Staff notification failed for subscription ${sub.id}:`, error);
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      sent,
      failed,
      removed,
      subscriberCount: subscribers.length,
    });
  } catch (error: any) {
    console.error('Staff notification broadcast failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification.' },
      { status: 500 }
    );
  }
}

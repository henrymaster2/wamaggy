import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await prisma.mealBooking.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      select: {
        id: true,
        date: true,
        time: true,
        guests: true,
        preferences: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        createdAt: true,
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('BOOKINGS GET ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      date,
      time,
      guests,
      preferences,
      customerName,
      customerPhone,
      customerEmail,
      userId,
    } = body;

    if (!date || !time || !guests) {
      return NextResponse.json({ error: 'Date, time, and guests are required' }, { status: 400 });
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      return NextResponse.json({ error: 'Guests must be a valid number' }, { status: 400 });
    }

    const booking = await prisma.mealBooking.create({
      data: {
        date: new Date(`${date}T00:00:00`),
        time: String(time),
        guests: guestCount,
        preferences: preferences ? String(preferences) : null,
        customerName: customerName ? String(customerName) : null,
        customerPhone: customerPhone ? String(customerPhone) : null,
        customerEmail: customerEmail ? String(customerEmail) : null,
        userId: userId ? Number(userId) : null,
      },
      select: {
        id: true,
        date: true,
        time: true,
        guests: true,
        preferences: true,
        status: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        createdAt: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('BOOKINGS POST ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await prisma.$queryRaw`
      SELECT
        "id",
        "date",
        "time",
        "guests",
        "preferences",
        "status",
        "customerName",
        "customerPhone",
        "customerEmail",
        "createdAt"
      FROM "MealBooking"
      ORDER BY "date" ASC, "time" ASC
    `;

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

    const [booking] = await prisma.$queryRaw<any[]>`
      INSERT INTO "MealBooking" (
        "date",
        "time",
        "guests",
        "preferences",
        "customerName",
        "customerPhone",
        "customerEmail",
        "userId",
        "updatedAt"
      )
      VALUES (
        ${new Date(`${date}T00:00:00`)},
        ${String(time)},
        ${guestCount},
        ${preferences ? String(preferences) : null},
        ${customerName ? String(customerName) : null},
        ${customerPhone ? String(customerPhone) : null},
        ${customerEmail ? String(customerEmail) : null},
        ${userId ? Number(userId) : null},
        CURRENT_TIMESTAMP
      )
      RETURNING
        "id",
        "date",
        "time",
        "guests",
        "preferences",
        "status",
        "customerName",
        "customerPhone",
        "customerEmail",
        "createdAt"
    `;

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('BOOKINGS POST ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const LOCATION_ID = 1;

type RestaurantLocationRow = {
  id: number;
  lat: number;
  lng: number;
  address: string;
  deliveryRadiusKm: number;
  pricePerKm: number;
  createdAt: Date;
  updatedAt: Date;
};

const toNumber = (value: unknown, fallback: number) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<RestaurantLocationRow[]>`
      SELECT "id",
             "lat",
             "lng",
             "address",
             "deliveryRadiusKm",
             "pricePerKm",
             "createdAt",
             "updatedAt"
      FROM "RestaurantLocation"
      WHERE "id" = ${LOCATION_ID}
      LIMIT 1
    `;

    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error('RESTAURANT LOCATION GET ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant location' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const address = String(body.address || '').trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !address) {
      return NextResponse.json(
        { error: 'Latitude, longitude, and address are required.' },
        { status: 400 }
      );
    }

    const deliveryRadiusKm = Math.max(0, toNumber(body.deliveryRadiusKm, 5));
    const pricePerKm = Math.max(0, toNumber(body.pricePerKm, 0));

    const rows = await prisma.$queryRaw<RestaurantLocationRow[]>`
      INSERT INTO "RestaurantLocation" (
        "id",
        "lat",
        "lng",
        "address",
        "deliveryRadiusKm",
        "pricePerKm",
        "updatedAt"
      )
      VALUES (
        ${LOCATION_ID},
        ${lat},
        ${lng},
        ${address},
        ${deliveryRadiusKm},
        ${pricePerKm},
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE
      SET "lat" = EXCLUDED."lat",
          "lng" = EXCLUDED."lng",
          "address" = EXCLUDED."address",
          "deliveryRadiusKm" = EXCLUDED."deliveryRadiusKm",
          "pricePerKm" = EXCLUDED."pricePerKm",
          "updatedAt" = NOW()
      RETURNING "id",
                "lat",
                "lng",
                "address",
                "deliveryRadiusKm",
                "pricePerKm",
                "createdAt",
                "updatedAt"
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('RESTAURANT LOCATION POST ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to save restaurant location' },
      { status: 500 }
    );
  }
}

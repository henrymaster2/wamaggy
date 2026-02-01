import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST: Save new order from customer
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableNumber, items, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        table: tableNumber ? String(tableNumber) : 'Takeaway',
        total: total,
        status: 'PENDING', // Updated to uppercase to match frontend logic
        items: {
          create: items.map((item: any) => ({
            foodId: item.id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl || "", 
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('ORDER POST ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch all orders for staff dashboard
 */
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('ORDER GET ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update order status (PENDING -> READY -> SERVED)
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing order ID or status' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('ORDER PATCH ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to update order status', details: error.message },
      { status: 500 }
    );
  }
}
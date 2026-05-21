import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type OrderItemPayload = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
};

type OrderPaymentRow = {
  id: number;
  paymentType: string;
  paymentStatus: string;
  mpesaCheckoutRequestId: string | null;
  mpesaMerchantRequestId: string | null;
  mpesaReceiptNumber: string | null;
  mpesaPhone: string | null;
};

/**
 * POST: Save new order from customer (linked to User)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableNumber, items, total, userId, paymentType, paymentStatus, mpesaPhone } = body;
    const normalizedPaymentType = paymentType === 'MPESA' ? 'MPESA' : 'CASH';

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
        status: 'PENDING',
        // Link to user if userId is provided
        userId: userId ? Number(userId) : null,
        items: {
          create: items.map((item: OrderItemPayload) => ({
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

    await prisma.$executeRaw`
      UPDATE "Order"
      SET "paymentType" = ${normalizedPaymentType},
          "paymentStatus" = ${paymentStatus || 'PENDING'},
          "mpesaPhone" = ${mpesaPhone || null}
      WHERE "id" = ${order.id}
    `;

    return NextResponse.json(
      {
        ...order,
        paymentType: normalizedPaymentType,
        paymentStatus: paymentStatus || 'PENDING',
        mpesaPhone: mpesaPhone || null,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown order error';
    console.error('ORDER POST ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: message },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch all orders for staff OR history for a specific user
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Build filter: if userId exists, fetch only for that user
    const whereClause = userId ? { userId: Number(userId) } : {};

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    if (orders.length === 0) return NextResponse.json([]);

    const paymentRows = await prisma.$queryRaw<OrderPaymentRow[]>`
      SELECT "id",
             "paymentType",
             "paymentStatus",
             "mpesaCheckoutRequestId",
             "mpesaMerchantRequestId",
             "mpesaReceiptNumber",
             "mpesaPhone"
      FROM "Order"
      WHERE "id" IN (${Prisma.join(orders.map((order) => order.id))})
    `;
    const paymentsByOrderId = new Map(paymentRows.map((row) => [row.id, row]));

    return NextResponse.json(orders.map((order) => ({
      ...order,
      paymentType: paymentsByOrderId.get(order.id)?.paymentType || 'CASH',
      paymentStatus: paymentsByOrderId.get(order.id)?.paymentStatus || 'PENDING',
      mpesaCheckoutRequestId: paymentsByOrderId.get(order.id)?.mpesaCheckoutRequestId || null,
      mpesaMerchantRequestId: paymentsByOrderId.get(order.id)?.mpesaMerchantRequestId || null,
      mpesaReceiptNumber: paymentsByOrderId.get(order.id)?.mpesaReceiptNumber || null,
      mpesaPhone: paymentsByOrderId.get(order.id)?.mpesaPhone || null,
    })));
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
    const { id, status, paymentStatus } = body;

    if (!id || (!status && !paymentStatus)) {
      return NextResponse.json(
        { error: 'Missing order ID or update status' },
        { status: 400 }
      );
    }

    const updatedOrder = status
      ? await prisma.order.update({
          where: { id: Number(id) },
          data: { status: status },
        })
      : await prisma.order.findUnique({ where: { id: Number(id) } });

    if (paymentStatus) {
      await prisma.$executeRaw`
        UPDATE "Order"
        SET "paymentStatus" = ${paymentStatus}
        WHERE "id" = ${Number(id)}
      `;
    }

    return NextResponse.json({ ...updatedOrder, paymentStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown order update error';
    console.error('ORDER PATCH ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to update order status', details: message },
      { status: 500 }
    );
  }
}

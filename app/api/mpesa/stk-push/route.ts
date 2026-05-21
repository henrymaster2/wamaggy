import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeMpesaPhone, sendStkPush } from '@/lib/mpesa/stk';

export async function POST(req: Request) {
  try {
    const { orderId, phone } = await req.json();

    if (!orderId || !phone) {
      return NextResponse.json(
        { error: 'Order ID and phone number are required.' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const mpesaPhone = normalizeMpesaPhone(phone);
    const stkResponse = await sendStkPush({
      amount: order.total,
      phone: mpesaPhone,
      accountReference: `ORDER${order.id}`,
      transactionDesc: `African Cuisine order ${order.id}`,
    });

    await prisma.$executeRaw`
      UPDATE "Order"
      SET "paymentType" = 'MPESA',
          "paymentStatus" = 'PENDING',
          "mpesaPhone" = ${mpesaPhone},
          "mpesaMerchantRequestId" = ${stkResponse.MerchantRequestID || null},
          "mpesaCheckoutRequestId" = ${stkResponse.CheckoutRequestID || null}
      WHERE "id" = ${order.id}
    `;

    return NextResponse.json({
      order: {
        ...order,
        paymentType: 'MPESA',
        paymentStatus: 'PENDING',
        mpesaPhone,
        mpesaMerchantRequestId: stkResponse.MerchantRequestID || null,
        mpesaCheckoutRequestId: stkResponse.CheckoutRequestID || null,
      },
      customerMessage: stkResponse.CustomerMessage || 'M-Pesa payment request sent.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send M-Pesa STK push.';
    console.error('MPESA STK PUSH ERROR:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

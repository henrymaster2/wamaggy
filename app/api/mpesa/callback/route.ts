import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CallbackItem = {
  Name: string;
  Value?: string | number;
};

type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: CallbackItem[];
      };
    };
  };
};

const getMetadataValue = (items: CallbackItem[] | undefined, name: string) => (
  items?.find((item) => item.Name === name)?.Value
);

export async function POST(req: Request) {
  try {
    const body = await req.json() as StkCallbackBody;
    const callback = body.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const metadataItems = callback.CallbackMetadata?.Item;
    const receiptNumber = getMetadataValue(metadataItems, 'MpesaReceiptNumber');

    await prisma.$executeRaw`
      UPDATE "Order"
      SET "paymentStatus" = ${callback.ResultCode === 0 ? 'PAID' : 'FAILED'},
          "mpesaReceiptNumber" = ${receiptNumber ? String(receiptNumber) : null}
      WHERE "mpesaCheckoutRequestId" = ${callback.CheckoutRequestID}
    `;

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('MPESA CALLBACK ERROR:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

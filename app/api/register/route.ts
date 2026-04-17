import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure the Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Your App Password
  },
});

export async function POST(req: Request) {
  try {
    const { name, email, phone } = await req.json();

    if (!phone || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check or Create User
    let user = await prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      user = await prisma.user.create({
        data: { name, email, phone },
      });
      isNewUser = true;
    }

    // 2. Send Welcome Email if it's a new registration
    if (isNewUser) {
      try {
        await transporter.sendMail({
          from: `"African Cuisine" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Welcome to African Cuisine! 🍲",
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h1 style="color: #ea580c;">Hello, ${name}!</h1>
              <p>Welcome to <b>African Cuisine</b>. We're thrilled to have you join us.</p>
              <p>Your account has been set up successfully. You can now place orders directly from your table.</p>
              <br />
              <p>Enjoy your meal!</p>
              <hr />
              <small>Table Ordering System powered by African Cuisine</small>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email failed to send, but user was created:", emailErr);
      }
    }

    // 3. Fetch history
    const history = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ user, history });
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
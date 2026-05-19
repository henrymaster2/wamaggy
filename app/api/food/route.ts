import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const webpush = require("web-push");
const vapidEmail = process.env.VAPID_EMAIL || "admin@africancuisine.com";
const vapidSubject = vapidEmail.startsWith("mailto:") ? vapidEmail : `mailto:${vapidEmail}`;

// Configure web-push with cryptographic VAPID signatures
webpush.setVapidDetails(
  vapidSubject,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const allowedStatuses = new Set(["Available", "Pending", "Not Available"]);

export async function GET() {
  try {
    const foods = await prisma.food.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(foods);
  } catch (error) {
    console.error("GET Food Error:", error);
    return NextResponse.json({ error: "Failed to fetch food" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, price, description, status, imageUrl, variations } = body;

    // Validation
    if (!name || !price || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.food.create({
      data: {
        name,
        category: category || "Food",
        price: parseFloat(price),
        description: description || "",
        status: status || "Available",
        imageUrl,
        variations: variations || [],
      },
    });

    // 🔔 Real-Time Web Push Broadcast Engine
    try {
      // 1. Fetch all active device notification endpoints from PostgreSQL
      const subscribers = await prisma.pushSubscription.findMany();

      if (subscribers.length > 0) {
        // 2. Build the visual payload structure your Service Worker listens for
        const notificationPayload = JSON.stringify({
          title: "🔥 New Meal Added!",
          body: `${name} is now available under ${category || "Food"} for KSh ${price}!`,
          icon: imageUrl || "/icon-192.png",
          badge: "/icon-192.png",
          data: { url: `/?foodId=${item.id}` }
        });

        console.log(`📢 Broadcasting fresh meal update to ${subscribers.length} device tokens...`);

        // 3. Dispatch encrypted payloads concurrently across all client channels
        const pushPromises = subscribers.map((sub) => {
          const pushTarget = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            }
          };

          return webpush.sendNotification(pushTarget, notificationPayload).catch(async (err: any) => {
            // Automatically housekeep and clean up dead/expired subscription nodes
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log(`🗑️ Cleaning stale subscriber token ID: ${sub.id}`);
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            } else {
              console.error(`Anomalous transmission error on Node ${sub.id}:`, err);
            }
          });
        });

        // Run broadcasts as a background promise chain without hanging the primary HTTP thread
        Promise.all(pushPromises);
      }
    } catch (pushError) {
      // Caught inside a isolated block so notification engine errors never crash food database writes
      console.error("Background notification broadcast failed safely:", pushError);
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("POST /api/food error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    const status = String(body.status || "");

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid food id" }, { status: 400 });
    }

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Invalid food status" }, { status: 400 });
    }

    const item = await prisma.food.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("PATCH /api/food error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid food id" }, { status: 400 });
    }

    await prisma.food.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/food error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

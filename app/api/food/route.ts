import { NextResponse } from "next/server";
import { prisma } from "@/prisma.config"; // Ensure this path matches your project structure

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
        // Save variations as JSON, defaulting to empty array if none provided
        variations: variations || [],
      },
    });

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

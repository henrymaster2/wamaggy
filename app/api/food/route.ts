import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma.config';

// 1. FETCH ITEMS (With Category Filtering)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const foods = await prisma.food.findMany({
      where: category ? { category: category } : {}, 
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(foods);
  } catch (error) {
    console.error('GET /api/food error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// 2. CREATE NEW ITEM
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, description, status, imageUrl, category, variations } = body;

    // Validation
    if (!name || !description || !status || !imageUrl || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.food.create({
      data: {
        name,
        category,
        price: Number(price) || 0,
        description,
        status,
        imageUrl,
        variations: variations || [], 
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('POST /api/food error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

// 3. UPDATE ITEM (Fixes the 400 error when changing status)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const updatedItem = await prisma.food.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        // Ensure price is a number if it's being updated
        ...(updateData.price && { price: Number(updateData.price) })
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PATCH /api/food error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// 4. DELETE ITEM
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await prisma.food.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/food error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

type User = {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __USERS__: Record<string, User> | undefined;
}

const users: Record<string, User> =
  globalThis.__USERS__ ?? (globalThis.__USERS__ = {});

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = users[email];

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Login successful',
    user,
  });
}
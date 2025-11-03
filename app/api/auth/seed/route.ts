import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin user already exists' });
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    const adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrador',
      funcao: 'Administrador de Sistemas',
      isAdmin: true,
      nivelAcesso: 'admin',
    });

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        username: adminUser.username,
        fullName: adminUser.fullName,
        isAdmin: adminUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}


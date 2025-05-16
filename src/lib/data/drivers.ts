import prisma from '@/lib/prisma';
import type { Driver } from '@prisma/client';

export async function fetchDrivers(): Promise<Driver[]> {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return drivers;
  } catch (error) {
    console.error('Database Error (fetchDrivers):', error);
    throw new Error('Failed to fetch drivers.');
  }
}

export async function fetchDriverById(id: string): Promise<Driver | null> {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });
    return driver;
  } catch (error) {
    console.error('Database Error (fetchDriverById):', error);
    throw new Error('Failed to fetch driver.');
  }
}

import prisma from '@/lib/prisma';
import type { Vehicle, VehicleType, Driver } from '@prisma/client'; // Importar tipos necesarios
import { unstable_noStore as noStore } from 'next/cache'; // Importar noStore

// Definir el tipo extendido para Vehículo con detalles (incluyendo purchaseDate)
export type VehicleWithDetails = Vehicle & {
  vehicleType: VehicleType | null;
  drivers: Driver[];
};

export async function fetchVehicles(): Promise<VehicleWithDetails[]> {
  noStore(); // Desactivar caché para asegurar datos frescos
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        vehicleType: true,
        drivers: true,
      },
      // purchaseDate se incluye por defecto ya que es parte del modelo Vehicle
    });
    return vehicles;
  } catch (error) {
    console.error('Database Error (fetchVehicles):', error);
    throw new Error('Failed to fetch vehicles.');
  }
}

// Función para obtener un vehículo por ID con detalles (Añadida)
export async function fetchVehicleById(id: string): Promise<VehicleWithDetails | null> {
   noStore(); // Desactivar caché
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
       include: { // Incluir relaciones
        vehicleType: true,
        drivers: true,
      },
      // purchaseDate se incluye por defecto
    });
    return vehicle;
  } catch (error) {
    console.error('Database Error (fetchVehicleById):', error);
    throw new Error('Failed to fetch vehicle.');
  }
}

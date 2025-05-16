// Convertir a Server Component para obtener tipos y conductores, pasar al formulario cliente
import prisma from '@/lib/prisma';
import VehicleForm from '../_components/VehicleForm'; // Importar el nuevo componente
import { addVehicle } from '../actions'; // Importar la acción de añadir
import type { VehicleType } from '@prisma/client'; // Importar solo VehicleType

export default async function NewVehiclePage() {
  let vehicleTypes: VehicleType[] = [];
  // Ya no se precargan los conductores aquí
  let errorMessage: string | null = null;

  try {
    // Obtener tipos de vehículo para el select
    vehicleTypes = await prisma.vehicleType.findMany({
      orderBy: { name: 'asc' },
    });

    // La carga de conductores se hará de forma asíncrona en el formulario
  } catch (error) {
    console.error("Error al cargar datos para la página de nuevo vehículo:", error);
    errorMessage = "No se pudieron cargar los datos necesarios para crear un nuevo vehículo. Por favor, inténtelo de nuevo más tarde.";
  }

  if (errorMessage) {
    return (
      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Error</h1>
        <p className="text-red-500">{errorMessage}</p>
        {/* Podríamos añadir un botón para reintentar o volver a la página anterior */}
      </main>
    );
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Añadir Nuevo Vehículo</h1>
      {/* Renderizar el formulario reutilizable pasándole los tipos de vehículos y la acción de añadir */}
      <VehicleForm vehicleTypes={vehicleTypes} action={addVehicle} />
    </main>
  );
}

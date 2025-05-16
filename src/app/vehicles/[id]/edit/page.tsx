import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VehicleForm from '../../_components/VehicleForm'; // Importar el componente reutilizable
import { updateVehicle } from '../../actions'; // Importar la acción de actualizar
// Importar tipos necesarios
import type { VehicleType, Vehicle, Driver } from '@prisma/client'; // Importar Vehicle también

// Props para la página dinámica, incluye los parámetros de la ruta (params.id)
interface EditVehiclePageProps {
  params: { id: string };
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  // Esperar la resolución de params antes de acceder a id
  const { id } = await params;

  // Obtener los datos del vehículo específico, incluyendo los conductores asignados
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      drivers: true, // Incluir los conductores relacionados
    },
  });

  // Si el vehículo no se encuentra, mostrar página 404
  if (!vehicle) {
    notFound();
  }

  // Obtener también la lista de tipos de vehículo para el select
  const vehicleTypes = await prisma.vehicleType.findMany({
    orderBy: { name: 'asc' },
  });
  // Ya no se precarga la lista completa de conductores aquí

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Editar Vehículo (ID: {vehicle.id.substring(0, 8)}...)</h1>
      {/* Renderizar el formulario reutilizable pasándole los datos iniciales, tipos y la acción de actualizar */}
      <VehicleForm
        initialData={vehicle as Vehicle & { drivers: Driver[] }} // Pasar los datos iniciales
        vehicleTypes={vehicleTypes}
        action={updateVehicle.bind(null, vehicle.id)} // Pasar la acción de actualizar con el ID bindeado
      />
    </main>
  );
}

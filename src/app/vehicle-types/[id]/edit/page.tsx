import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VehicleTypeForm from '../../_components/VehicleTypeForm'; // Importar el componente reutilizable
import { updateVehicleType } from '../../actions'; // Importar la acción de actualizar
import type { VehicleType } from '@prisma/client'; // Importar tipo necesario

interface EditVehicleTypePageProps {
  params: { id: string };
}

export default async function EditVehicleTypePage({ params }: EditVehicleTypePageProps) {
  // Esperar la resolución de params antes de acceder a id
  const { id } = await params;

  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id },
  });

  if (!vehicleType) {
    notFound();
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Editar Tipo de Vehículo</h1>
      {/* Renderizar el formulario reutilizable pasándole los datos iniciales y la acción de actualizar */}
      <VehicleTypeForm
        initialData={vehicleType} // Pasar los datos iniciales
        action={updateVehicleType.bind(null, vehicleType.id)} // Pasar la acción de actualizar con el ID bindeado
      />
    </main>
  );
}

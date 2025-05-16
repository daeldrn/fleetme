import VehicleTypeForm from '../_components/VehicleTypeForm'; // Importar el nuevo componente
import { addVehicleType } from '../actions'; // Importar la acción de añadir

export default function NewVehicleTypePage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Añadir Nuevo Tipo de Vehículo</h1>
      {/* Renderizar el formulario reutilizable pasándole la acción de añadir */}
      <VehicleTypeForm action={addVehicleType} />
    </main>
  );
}

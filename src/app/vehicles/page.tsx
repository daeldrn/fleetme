import Link from 'next/link';
import DeleteVehicleForm from './_components/DeleteVehicleForm'; // Importar el componente DeleteVehicleForm
import { fetchVehicles, VehicleWithDetails } from '@/lib/data'; // Importar la función y el tipo de obtención de datos

export const dynamic = 'force-dynamic'; // Mantener renderizado dinámico

// Icono de Editar (ejemplo SVG)
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

// Icono de Eliminar (ejemplo SVG)
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm7 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);


// Helper para obtener clases de estilo basadas en el estado del vehículo
function getStatusClasses(status: string): string {
  switch (status) {
    case 'activo':
      return 'bg-green-100 text-green-800';
    case 'mantenimiento':
      return 'bg-yellow-100 text-yellow-800';
    case 'inactivo':
      return 'bg-red-100 text-red-800';
    case 'vendido':
      return 'bg-gray-100 text-gray-800'; // Añadir estilo para inactivo si es necesario
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function VehiclesPage() {
  let vehicles: VehicleWithDetails[] = []; // Tipar explícitamente la variable vehicles
  let errorMessage: string | null = null;

  try {
    vehicles = await fetchVehicles(); // Usar la función de obtención de datos
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    errorMessage = "No se pudieron cargar los vehículos. Por favor, inténtelo de nuevo más tarde.";
  }


  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Registro de Vehículos</h1> {/* Cambiar el texto del encabezado */}
        <Link href="/vehicles/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Añadir Vehículo
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marca</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modelo</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Año</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Matrícula</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">VIN</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Compra</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Conductores Asignados</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th><th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Renderizar vehículos solo si no hay error */}
            {!errorMessage && vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{vehicle.make}</td><td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.model}</td><td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.year}</td><td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.licensePlate}</td><td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.vin}</td>
                {/* Celda Fecha de Compra */}
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString() : '-'} {/* Mostrar fecha formateada o '-' */}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.vehicleType?.name ?? 'N/A'}</td><td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {vehicle.drivers.map(driver => driver.name).join(', ') || '-'}
                </td><td className="py-4 px-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(vehicle.status)}`} // Usar la función helper
                  >{vehicle.status}</span>
                </td>
                {/* Celda de acciones con flexbox para alinear iconos */}
                <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2"> {/* Usar flexbox y space-x-2 */}
                    {/* Usar Link con icono para editar */}
                    <Link href={`/vehicles/${vehicle.id}/edit`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                      <EditIcon />
                    </Link>
                    {/* Usar DeleteVehicleForm con icono para eliminar */}
                    <DeleteVehicleForm id={vehicle.id} icon={<DeleteIcon />} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mostrar mensaje de error si existe */}
      {errorMessage && (
        <div className="mt-4 text-center text-red-500">
          <p>{errorMessage}</p>
        </div>
      )}
      {/* Mostrar mensaje de no vehículos solo si no hay error y la lista está vacía */}
      {!errorMessage && vehicles.length === 0 && (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-400">No hay vehículos registrados.</p>
      )}
    </main>
  );
}

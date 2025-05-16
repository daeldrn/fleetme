import Link from 'next/link';
import prisma from '@/lib/prisma';
import DeleteVehicleTypeForm from './_components/DeleteVehicleTypeForm'; // Importar componente

export const dynamic = 'force-dynamic';

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

export default async function VehicleTypesPage() {
  const vehicleTypes = await prisma.vehicleType.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tipos de Vehículos</h1>
        <Link href="/vehicle-types/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Añadir Tipo
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Max. Conductores</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {vehicleTypes.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 px-4 text-center text-gray-500 dark:text-gray-400">
                  No hay tipos de vehículo registrados.
                </td>
              </tr>
            ) : (
              vehicleTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{type.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{type.maxDrivers}</td>
                  {/* Celda de acciones con flexbox para alinear iconos */}
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2"> {/* Usar flexbox y space-x-2 */}
                      {/* Usar Link con icono para editar */}
                      <Link href={`/vehicle-types/${type.id}/edit`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <EditIcon />
                      </Link>
                      {/* Usar DeleteVehicleTypeForm con icono para eliminar */}
                      <DeleteVehicleTypeForm id={type.id} icon={<DeleteIcon />} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

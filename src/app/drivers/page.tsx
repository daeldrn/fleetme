import Link from 'next/link';
import type { Driver } from '@prisma/client'; // Importar tipo Driver
import DeleteDriverForm from './_components/DeleteDriverForm'; // Importar componente
import { fetchDrivers } from '@/lib/data/drivers'; // Importar la función de obtención de datos

export const dynamic = 'force-dynamic'; // Renderizado dinámico

// Helper para obtener clases de estilo basadas en el estado del conductor
function getDriverStatusClasses(status: string): string {
  switch (status) {
    case 'activo':
      return 'bg-green-100 text-green-800';
    case 'de Permiso':
      return 'bg-yellow-100 text-yellow-800';
    case 'inactivo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

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


export default async function DriversPage() {
  let drivers: Driver[] = []; // Tipar explícitamente la variable drivers
  let errorMessage: string | null = null;

  try {
    // Obtener conductores usando la función centralizada
    drivers = await fetchDrivers();
  } catch (error) {
    console.error("Error fetching drivers:", error);
    errorMessage = "No se pudieron cargar los conductores. Por favor, inténtelo de nuevo más tarde.";
  }

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Registro de Conductores</h1> {/* Cambiar el texto del encabezado */}
        {/* Enlace para añadir conductor (funcionalidad futura) */}
        <Link href="/drivers/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Añadir Conductor
        </Link>
      </div>

      {/* Tabla de Conductores */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº Licencia</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección Particular</th> {/* Cambiado de Email a Dirección Particular */}
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vencimiento Licencia</th> {/* Nuevo encabezado */}
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría Licencia</th> {/* Nuevo encabezado */}
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-4 px-4 text-center text-gray-500 dark:text-gray-400"> {/* Aumentar colSpan */}
                  No hay conductores registrados.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{driver.name}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{driver.licenseNumber}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{driver.contactPhone ?? '-'}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{driver.privateAddress ?? '-'}</td> {/* Mostrar privateAddress */}
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{driver.licenseExpirationDate?.toDateString() ?? '-'}</td> {/* Mostrar fecha de vencimiento */}
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{driver.licenseCategory ?? '-'}</td> {/* Mostrar categoría */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getDriverStatusClasses(driver.status)}`} // Usar la función helper
                    >
                      {driver.status}
                    </span>
                  </td>
                  {/* Celda de acciones con flexbox para alinear iconos */}
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2"> {/* Usar flexbox y space-x-2 */}
                      {/* Usar Link con icono para editar */}
                      <Link href={`/drivers/${driver.id}/edit`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <EditIcon />
                      </Link>
                      {/* Usar DeleteDriverForm con icono para eliminar */}
                      <DeleteDriverForm id={driver.id} icon={<DeleteIcon />} />
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

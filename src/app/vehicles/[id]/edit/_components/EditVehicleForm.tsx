'use client';

import { useActionState, useState, useEffect, useTransition, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { updateVehicle, FormState } from '@/app/vehicles/actions'; // Importar acción y tipo
import { searchDrivers } from '@/app/drivers/actions'; // Importar la acción de búsqueda
import type { Vehicle, VehicleType, Driver } from '@prisma/client'; // Importar tipos de Prisma
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Importar usePathname

// Debounce function (puede refactorizarse a un archivo de utilidades si se usa en varios lugares)
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

const initialState: FormState = { message: null, errors: {} };

// Componente botón de envío (igual que en NewVehiclePage, podría refactorizarse)
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        pending ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {pending ? 'Actualizando...' : 'Actualizar Vehículo'}
    </button>
  );
}

interface EditVehicleFormProps {
  vehicle: Vehicle & { drivers: Driver[] }; // Asegurar que drivers está incluido
  vehicleTypes: VehicleType[];
  // availableDrivers ya no se pasa como prop
}

// Definir un tipo para los conductores buscados (solo los campos necesarios)
type SearchedDriver = {
  id: string;
  name: string;
  licenseNumber: string;
};

export default function EditVehicleForm({ vehicle, vehicleTypes }: EditVehicleFormProps) {
  // Usar bind para pasar el ID a la Server Action 'updateVehicle'
  const updateVehicleWithId = updateVehicle.bind(null, vehicle.id);
  const [state, formAction] = useActionState(updateVehicleWithId, initialState);
  const currentPath = usePathname();

  // Estado para la búsqueda de conductores
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedDriver[]>([]);
  // Inicializar selectedDrivers con los conductores ya asignados al vehículo
  const [selectedDrivers, setSelectedDrivers] = useState<SearchedDriver[]>(vehicle.drivers);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isPendingSearch, startTransitionSearch] = useTransition(); // Usar useTransition para la búsqueda

  // Función para buscar conductores
  const handleSearchDrivers = async (query: string) => {
    if (query.trim() === '') {
      setSearchResults([]);
      setIsLoadingSearch(false);
      return;
    }
    setIsLoadingSearch(true);
    startTransitionSearch(async () => { // Usar startTransitionSearch
      const results = await searchDrivers(query);
      setSearchResults(results);
      setIsLoadingSearch(false);
    });
  };

  // Debounce para la búsqueda
  const debouncedSearch = useCallback(debounce(handleSearchDrivers, 300), []);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleSelectDriver = (driver: SearchedDriver) => {
    // Evitar duplicados y añadir a seleccionados
    if (!selectedDrivers.find(d => d.id === driver.id)) {
      setSelectedDrivers(prev => [...prev, driver]);
    }
    setSearchTerm(''); // Limpiar búsqueda
    setSearchResults([]); // Limpiar resultados
  };

  const handleRemoveSelectedDriver = (driverId: string) => {
    setSelectedDrivers(prev => prev.filter(d => d.id !== driverId));
  };


  return (
    // Pasar formAction al prop action del formulario
    <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-xl">
       {/* Hidden inputs para los IDs de los conductores seleccionados */}
      {selectedDrivers.map(driver => (
        <input key={driver.id} type="hidden" name="driverIds" value={driver.id} />
      ))}

       {/* Campo Tipo de Vehículo */}
      <div>
        <label htmlFor="vehicleTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Vehículo</label>
        <select
          name="vehicleTypeId"
          id="vehicleTypeId"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.vehicleTypeId} // Usar defaultValue con el ID actual
          aria-describedby="vehicleTypeId-error"
        >
          <option value="" disabled>Seleccione un tipo...</option>
          {vehicleTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} (Max: {type.maxDrivers} conductores)
            </option>
          ))}
        </select>
         {/* Enlace para crear nuevo tipo */}
         <div className="mt-1 text-right">
            <Link href={`/vehicle-types/new?redirectTo=${encodeURIComponent(currentPath)}`} className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
              + Crear Nuevo Tipo
            </Link>
          </div>
        <div id="vehicleTypeId-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.vehicleTypeId &&
            state.errors.vehicleTypeId.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Marca */}
      <div>
        <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
        <input
          type="text"
          name="make"
          id="make"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.make} // Usar defaultValue
          aria-describedby="make-error"
        />
        <div id="make-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.make &&
            state.errors.make.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Modelo */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
        <input
          type="text"
          name="model"
          id="model"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.model}
          aria-describedby="model-error"
        />
        <div id="model-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.model &&
            state.errors.model.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Año */}
       <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
        <input
          type="number"
          name="year"
          id="year"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.year}
          aria-describedby="year-error"
        />
        <div id="year-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.year &&
            state.errors.year.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Matrícula */}
      <div>
        <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Matrícula</label>
        <input
          type="text"
          name="licensePlate"
          id="licensePlate"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.licensePlate}
          aria-describedby="licensePlate-error"
        />
        <div id="licensePlate-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.licensePlate &&
            state.errors.licensePlate.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo VIN */}
      <div>
        <label htmlFor="vin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">VIN</label>
        <input
          type="text"
          name="vin"
          id="vin"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.vin}
          aria-describedby="vin-error"
        />
        <div id="vin-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.vin &&
            state.errors.vin.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Estado */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
        <select
          name="status"
          id="status"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={vehicle.status}
          aria-describedby="status-error"
        >
          <option value="active">Activo</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="sold">Vendido</option>
          <option value="inactive">Inactivo</option>
        </select>
         <div id="status-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.status &&
            state.errors.status.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Mensaje de error general */}
         {state?.message && (
            <div aria-live="polite" className="text-sm text-red-500">
              <p>{state.message}</p>
            </div>
          )}

      {/* Sección Asignar Conductores con Búsqueda */}
      <div>
        <label htmlFor="driverSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar y Asignar Conductores (Opcional)</label>
        <input
          type="text"
          id="driverSearch"
          placeholder="Buscar por nombre o licencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
        {isLoadingSearch && <p className="text-sm text-gray-500 mt-1">Buscando...</p>}

        {/* Resultados de la búsqueda */}
        {searchResults.length > 0 && (
          <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto">
            {searchResults.map((driver) => (
              <li key={driver.id}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectDriver(driver)}>
                {driver.name} ({driver.licenseNumber})
              </li>
            ))}
          </ul>
        )}

        {/* Conductores Seleccionados */}
        {selectedDrivers.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conductores Seleccionados:</h4>
            <ul className="mt-1 space-y-1">
              {selectedDrivers.map((driver) => (
                <li key={driver.id} className="flex items-center justify-between text-sm p-1 bg-gray-100 dark:bg-gray-700 rounded">
                  <span>{driver.name} ({driver.licenseNumber})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedDriver(driver.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                    aria-label={`Quitar a ${driver.name}`}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>


      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <Link
          href="/vehicles"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

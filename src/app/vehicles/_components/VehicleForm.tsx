'use client';

import { useActionState, useState, useEffect, useCallback, useTransition } from 'react';
import { FormState } from '@/app/vehicles/actions'; // Importar el tipo de estado
import { searchDrivers } from '@/app/drivers/actions'; // Importar la acción de búsqueda
import type { Vehicle, VehicleType, Driver } from '@prisma/client'; // Importar tipos de Prisma
import Link from 'next/link';
import { usePathname, redirect } from 'next/navigation'; // Importar usePathname y redirect
import { VEHICLE_STATUS } from '@/constants/vehicle'; // Importar la constante de estados
import { debounce } from '@/lib/utils'; // Importar la función debounce
import SubmitButton from '@/components/SubmitButton'; // Importar el componente SubmitButton compartido
import toast from 'react-hot-toast'; // Importar toast

const initialState: FormState = { message: null, errors: {} };

interface VehicleFormProps {
  initialData?: (Vehicle & { drivers: Driver[] }) | null; // Datos iniciales para edición
  vehicleTypes: VehicleType[];
  action: (prevState: FormState | undefined, formData: FormData) => Promise<FormState>; // Server Action a usar
}

// Definir un tipo para los conductores buscados (solo los campos necesarios)
type SearchedDriver = {
  id: string;
  name: string;
  licenseNumber: string;
};

export default function VehicleForm({ initialData, vehicleTypes, action }: VehicleFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const currentPath = usePathname();
  const isEditing = !!initialData; // Determinar si estamos editando

  // Estado para la búsqueda de conductores
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedDriver[]>([]);
  // Inicializar selectedDrivers con los conductores ya asignados al vehículo (si estamos editando)
  const [selectedDrivers, setSelectedDrivers] = useState<SearchedDriver[]>(initialData?.drivers || []);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isPendingSearch, startTransitionSearch] = useTransition(); // Usar useTransition para la búsqueda

  // Mostrar toast y redirigir si la acción fue exitosa
  useEffect(() => {
    if (state?.toastMessage) {
      if (state.toastMessage.type === 'success') {
        toast.success(state.toastMessage.message);
        // Redirigir después de un breve retraso para permitir que el toast se muestre
        const timer = setTimeout(() => {
          redirect('/vehicles');
        }, 1000); // Retraso de 1 segundo
        return () => clearTimeout(timer); // Limpiar el temporizador si el componente se desmonta
      } else {
        toast.error(state.toastMessage.message);
      }
    }
  }, [state]);


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
          defaultValue={initialData?.vehicleTypeId || ''} // Usar defaultValue con el ID actual o vacío
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

      {/* Campo Fecha de Compra */}
      <div>
        <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Compra (Opcional)</label>
        <input
          type="date"
          name="purchaseDate"
          id="purchaseDate"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : ''} // Formatear fecha para input type="date"
          aria-describedby="purchaseDate-error"
        />
        {/* No hay validación del lado del cliente para este campo todavía */}
        <div id="purchaseDate-error" aria-live="polite" aria-atomic="true">
          {/* Los errores de validación del servidor se mostrarán aquí si existen */}
          {state?.errors?.purchaseDate &&
            state.errors.purchaseDate.map((error: string) => (
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
          defaultValue={initialData?.make || ''} // Usar defaultValue
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
          defaultValue={initialData?.model || ''}
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
          defaultValue={initialData?.year || ''}
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
          defaultValue={initialData?.licensePlate || ''}
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
          defaultValue={initialData?.vin || ''}
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
          defaultValue={initialData?.status || 'active'} // Usar defaultValue
          aria-describedby="status-error"
        >
          {VEHICLE_STATUS.map(status => (
            <option key={status} value={status}>
              {/* Capitalizar la primera letra para mostrar */}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
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

      {/* Mostrar mensaje de error específico para driverIds */}
      <div id="driverIds-error" aria-live="polite" aria-atomic="true">
        {state?.errors?.driverIds &&
          state.errors.driverIds.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
      </div>


      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <Link
          href="/vehicles"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </Link>
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}

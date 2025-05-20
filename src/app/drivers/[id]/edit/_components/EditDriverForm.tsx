'use client';

import { useActionState, useEffect } from 'react';
import { updateDriver, DriverFormState } from '@/app/drivers/actions'; // Importar acción y tipo de Driver
import type { Driver } from '@prisma/client'; // Importar tipo de Prisma
import Link from 'next/link';
import SubmitButton from '@/components/SubmitButton'; // Importar el componente SubmitButton compartido
import { DRIVER_STATUS, LICENSE_CATEGORIES } from '@/constants/drivers'; // Importar las constantes de estados y categorías de licencia
import toast from 'react-hot-toast'; // Importar toast
import { redirect } from 'next/navigation'; // Importar redirect

const initialState: DriverFormState = { message: null, errors: {} };

interface EditDriverFormProps {
  driver: Driver; // Recibe el conductor actual como prop
}

export default function EditDriverForm({ driver }: EditDriverFormProps) {
  // Usar bind para pasar el ID a la Server Action 'updateDriver'
  const updateDriverWithId = updateDriver.bind(null, driver.id);
  const [state, formAction] = useActionState(updateDriverWithId, initialState);

  // Mostrar toast y redirigir si la acción fue exitosa
  useEffect(() => {
    if (state?.toastMessage) {
      if (state.toastMessage.type === 'success') {
        toast.success(state.toastMessage.message);
        // Redirigir después de un breve retraso para permitir que el toast se muestre
        const timer = setTimeout(() => {
          redirect('/drivers');
        }, 1000); // Retraso de 1 segundo
        return () => clearTimeout(timer); // Limpiar el temporizador si el componente se desmonta
      } else {
        toast.error(state.toastMessage.message);
      }
    }
  }, [state]);


  return (
    <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      {/* Campo Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={driver.name}
          aria-describedby="name-error"
        />
        <div id="name-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.name &&
            state.errors.name.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Número de Licencia */}
      <div>
        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Licencia</label>
        <input
          type="text"
          name="licenseNumber"
          id="licenseNumber"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={driver.licenseNumber}
          aria-describedby="licenseNumber-error"
        />
        <div id="licenseNumber-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.licenseNumber &&
            state.errors.licenseNumber.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Teléfono (Opcional) */}
      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono de Contacto</label>
        <input
          type="tel"
          name="contactPhone"
          id="contactPhone"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={driver.contactPhone ?? ''} // Manejar posible null
          aria-describedby="contactPhone-error"
        />
         <div id="contactPhone-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.contactPhone &&
            state.errors.contactPhone.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Direccion Particular (Opcional) */}
      <div>
        <label htmlFor="privateAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Particular</label>
        <input
          type="text" // Cambiado de email a text
          name="privateAddress"
          id="privateAddress"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={driver.privateAddress ?? ''} // Usar privateAddress
          aria-describedby="privateAddress-error" // Actualizar aria-describedby
        />
         <div id="privateAddress-error" aria-live="polite" aria-atomic="true"> {/* Actualizar id */}
          {state?.errors?.privateAddress && // Usar privateAddress
            state.errors.privateAddress.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Categoría Licencia */}
      <div>
        <label htmlFor="licenseCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría Licencia</label>
        <select
          name="licenseCategory"
          id="licenseCategory"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={driver.licenseCategory ?? ''} // Usar defaultValue con el valor actual o vacío
          aria-describedby="licenseCategory-error"
        >
          <option value="">Seleccione una categoría...</option> {/* Opción por defecto */}
          {LICENSE_CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div id="licenseCategory-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.licenseCategory &&
            state.errors.licenseCategory.map((error: string) => (
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          defaultValue={driver.status}
          aria-describedby="status-error"
        >
          {DRIVER_STATUS.map(status => (
            <option key={status} value={status}>
              {/* Capitalizar la primera letra para mostrar */}
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
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

      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <Link
          href="/drivers"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </Link>
        <SubmitButton isEditing={true} text="Actualizar Conductor" /> {/* Usar el componente compartido */}
      </div>
    </form>
  );
}

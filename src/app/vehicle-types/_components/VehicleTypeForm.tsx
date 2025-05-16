'use client';

import { useActionState, useEffect } from 'react';
import { VehicleTypeFormState } from '@/app/vehicle-types/actions'; // Importar el tipo de estado
import type { VehicleType } from '@prisma/client'; // Importar tipo Prisma
import Link from 'next/link';
import { useSearchParams, redirect } from 'next/navigation'; // Importar useSearchParams y redirect
import SubmitButton from '@/components/SubmitButton'; // Importar el componente SubmitButton compartido
import toast from 'react-hot-toast'; // Importar toast

const initialState: VehicleTypeFormState = { message: null, errors: {} };

interface VehicleTypeFormProps {
  initialData?: VehicleType | null; // Datos iniciales para edición
  action: (prevState: VehicleTypeFormState | undefined, formData: FormData) => Promise<VehicleTypeFormState>; // Server Action a usar
}

export default function VehicleTypeForm({ initialData, action }: VehicleTypeFormProps) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo'); // Obtener redirectTo de la URL
  const isEditing = !!initialData; // Determinar si estamos editando

  const [state, formAction] = useActionState(action, initialState);

  // Determinar a dónde debe ir el botón Cancelar
  // TODO: Mejorar validación de redirectTo
  const cancelUrl = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/vehicle-types';

  // Mostrar toast y redirigir si la acción fue exitosa
  useEffect(() => {
    if (state?.toastMessage) {
      if (state.toastMessage.type === 'success') {
        toast.success(state.toastMessage.message);
        // Redirigir después de un breve retraso para permitir que el toast se muestre
        const timer = setTimeout(() => {
          // Redirigir a la URL especificada en redirectTo si existe y es válida, de lo contrario a la lista por defecto
          redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/vehicle-types');
        }, 1000); // Retraso de 1 segundo
        return () => clearTimeout(timer); // Limpiar el temporizador si el componente se desmonta
      } else {
        toast.error(state.toastMessage.message);
      }
    }
  }, [state, redirectTo]); // Añadir redirectTo a las dependencias del useEffect


  return (
    <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-xl">
      {/* Campo oculto para pasar redirectTo a la Server Action */}
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {/* Campo Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Tipo</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          defaultValue={initialData?.name || ''} // Usar defaultValue
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          aria-describedby="name-error"
        />
        <div id="name-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.name &&
            state.errors.name.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
        </div>
      </div>

      {/* Campo Max Conductores */}
      <div>
        <label htmlFor="maxDrivers" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Máximo Conductores</label>
        <input
          type="number"
          name="maxDrivers"
          id="maxDrivers"
          required
          min="1"
          defaultValue={initialData?.maxDrivers || 1} // Usar defaultValue
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          aria-describedby="maxDrivers-error"
        />
        <div id="maxDrivers-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.maxDrivers &&
            state.errors.maxDrivers.map((error: string) => (
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
          href={cancelUrl} // Usar la URL de cancelación determinada
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </Link>
        <SubmitButton isEditing={isEditing} />
      </div>
    </form>
  );
}

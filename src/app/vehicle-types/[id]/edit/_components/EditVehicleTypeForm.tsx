'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateVehicleType, VehicleTypeFormState } from '@/app/vehicle-types/actions';
import type { VehicleType } from '@prisma/client';
import Link from 'next/link';

const initialState: VehicleTypeFormState = { message: null, errors: {} };

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
      {pending ? 'Actualizando...' : 'Actualizar Tipo'}
    </button>
  );
}

interface EditVehicleTypeFormProps {
  vehicleType: VehicleType;
}

export default function EditVehicleTypeForm({ vehicleType }: EditVehicleTypeFormProps) {
  const updateVehicleTypeWithId = updateVehicleType.bind(null, vehicleType.id);
  const [state, formAction] = useActionState(updateVehicleTypeWithId, initialState);

  return (
    <form action={formAction} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-xl">
      {/* Campo Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Tipo</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          defaultValue={vehicleType.name}
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
          defaultValue={vehicleType.maxDrivers}
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
          href="/vehicle-types"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

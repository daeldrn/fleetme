'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import SubmitButton from '@/components/SubmitButton';
import { DRIVER_STATUS } from '@/constants/drivers';
import type { Driver } from '@prisma/client';
import { useEffect, useTransition } from 'react'; // Importar useEffect y useTransition
import toast from 'react-hot-toast'; // Importar toast
import { redirect } from 'next/navigation'; // Importar redirect

// Esquema de validación para Driver (reutilizado de actions.ts)
const DriverSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }),
  licenseNumber: z.string().min(1, { message: 'El número de licencia es requerido.' }),
  contactPhone: z.string().optional(),
  privateAddress: z.string().optional(), // Cambiado de email a privateAddress, ahora opcional sin validación de email
  licenseExpirationDate: z.string().optional().refine((date) => { // Añadir validación para fecha de vencimiento
    if (!date) return true; // Campo opcional
    return !isNaN(new Date(date).getTime()); // Validar que sea una fecha válida
  }, {
    message: 'Fecha de vencimiento de licencia inválida.',
  }),
  licenseCategory: z.string().optional(), // Añadir campo para categoría de licencia
  status: z.enum(DRIVER_STATUS),
});

// Inferir el tipo del esquema para usarlo en React Hook Form
type DriverFormValues = z.infer<typeof DriverSchema>;

interface DriverFormProps {
  initialData?: Driver | null; // Datos iniciales para edición
  action: (prevState: any, formData: FormData) => Promise<any>; // Server Action a usar (addDriver o updateDriver)
}

export default function DriverForm({ initialData, action }: DriverFormProps) {
  const isEditing = !!initialData;

  // Configurar React Hook Form con Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Importar reset
  } = useForm<DriverFormValues>({
    resolver: zodResolver(DriverSchema),
    // Mapear initialData a DriverFormValues para defaultValues
    defaultValues: initialData ? {
        name: initialData.name,
        licenseNumber: initialData.licenseNumber,
        contactPhone: initialData.contactPhone ?? '', // Asegurar string vacío para campos opcionales null
        privateAddress: initialData.privateAddress ?? '', // Usar privateAddress
        licenseExpirationDate: initialData.licenseExpirationDate?.toISOString().split('T')[0] ?? '', // Formatear fecha para input type="date"
        licenseCategory: initialData.licenseCategory ?? '', // Usar licenseCategory
        status: initialData.status as DriverFormValues['status'], // Convertir explícitamente el tipo
    } : { // Valores por defecto para creación
      name: '',
      licenseNumber: '',
      contactPhone: '',
      privateAddress: '', // Usar privateAddress
      licenseExpirationDate: '', // Valor por defecto vacío para fecha
      licenseCategory: '', // Valor por defecto vacío para categoría
      status: 'activo', // Valor por defecto para el estado
    },
  });

  // Usar useActionState para manejar el estado de la Server Action
  const [serverState, formAction] = useActionState(action, { message: null, errors: {}, toastMessage: undefined }); // Inicializar toastMessage
  const [isPending, startTransition] = useTransition(); // Usar useTransition

  // Manejar el envío del formulario con React Hook Form
  const onSubmit = async (data: DriverFormValues) => {
    // Crear FormData manualmente para la Server Action
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('licenseNumber', data.licenseNumber);
    // Solo añadir campos opcionales si tienen valor
    if (data.contactPhone) formData.append('contactPhone', data.contactPhone);
    if (data.privateAddress) formData.append('privateAddress', data.privateAddress); // Cambiado de email a privateAddress
    if (data.licenseExpirationDate) formData.append('licenseExpirationDate', data.licenseExpirationDate); // Añadir fecha de vencimiento
    if (data.licenseCategory) formData.append('licenseCategory', data.licenseCategory); // Añadir categoría de licencia
    formData.append('status', data.status);

    // Si estamos editando, añadir el ID
    if (isEditing && initialData?.id) {
        formData.append('id', initialData.id);
    }

    // Disparar la Server Action dentro de startTransition
    startTransition(() => {
      formAction(formData);
    });
  };

   // Resetear el formulario si initialData cambia (útil si el componente se reutiliza para diferentes conductores)
   // Mapear initialData a DriverFormValues antes de resetear
   useEffect(() => {
     if (initialData) {
       reset({
         name: initialData.name,
         licenseNumber: initialData.licenseNumber,
         contactPhone: initialData.contactPhone ?? '',
         privateAddress: initialData.privateAddress ?? '', // Usar privateAddress
         licenseExpirationDate: initialData.licenseExpirationDate?.toISOString().split('T')[0] ?? '', // Formatear fecha para input type="date"
         licenseCategory: initialData.licenseCategory ?? '', // Usar licenseCategory
         status: initialData.status as DriverFormValues['status'], // Convertir explícitamente el tipo
       });
     } else {
       // Resetear a valores por defecto si no hay initialData (para formulario de creación)
       reset({
         name: '',
         licenseNumber: '',
         contactPhone: '',
         privateAddress: '', // Usar privateAddress
         licenseExpirationDate: '', // Valor por defecto vacío para fecha
         licenseCategory: '', // Valor por defecto vacío para categoría
         status: 'activo',
       });
     }
   }, [initialData, reset]);

   // Mostrar toast y redirigir si la acción fue exitosa
   useEffect(() => {
     if (serverState?.toastMessage) {
       if (serverState.toastMessage.type === 'success') {
         toast.success(serverState.toastMessage.message);
         // Redirigir después de un breve retraso para permitir que el toast se muestre
         const timer = setTimeout(() => {
           redirect('/drivers');
         }, 1000); // Retraso de 1 segundo
         return () => clearTimeout(timer); // Limpiar el temporizador si el componente se desmonta
       } else {
         toast.error(serverState.toastMessage.message);
       }
     }
   }, [serverState]);


  return (
    // Usar handleSubmit de React Hook Form
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-xl">
      {/* Campo Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
        <input
          type="text"
          id="name"
          {...register('name')} // Registrar el input con React Hook Form
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.name || serverState?.errors?.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.name || serverState?.errors?.name ? 'true' : 'false'}
          aria-describedby="name-error"
        />
        {/* Mostrar errores de validación del cliente o servidor */}
        {(errors.name || serverState?.errors?.name) && (
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {(errors.name?.message || serverState?.errors?.name?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.name?.message || serverState.errors.name[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Campo Número de Licencia */}
      <div>
        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Licencia</label>
        <input
          type="text"
          id="licenseNumber"
          {...register('licenseNumber')} // Registrar el input
           className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.licenseNumber || serverState?.errors?.licenseNumber ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.licenseNumber || serverState?.errors?.licenseNumber ? 'true' : 'false'}
          aria-describedby="licenseNumber-error"
        />
         {(errors.licenseNumber || serverState?.errors?.licenseNumber) && (
          <div id="licenseNumber-error" aria-live="polite" aria-atomic="true">
            {(errors.licenseNumber?.message || serverState?.errors?.licenseNumber?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.licenseNumber?.message || serverState.errors.licenseNumber[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Campo Teléfono (Opcional) */}
      <div>
        <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono de Contacto</label>
        <input
          type="tel"
          id="contactPhone"
          {...register('contactPhone')} // Registrar el input
           className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.contactPhone || serverState?.errors?.contactPhone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.contactPhone || serverState?.errors?.contactPhone ? 'true' : 'false'}
          aria-describedby="contactPhone-error"
        />
         {(errors.contactPhone || serverState?.errors?.contactPhone) && (
          <div id="contactPhone-error" aria-live="polite" aria-atomic="true">
            {(errors.contactPhone?.message || serverState?.errors?.contactPhone?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.contactPhone?.message || serverState.errors.contactPhone[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Campo Direccion Particular (Opcional) */}
      <div>
        <label htmlFor="privateAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección Particular</label>
        <input
          type="text" // Cambiado de email a text
          id="privateAddress"
          {...register('privateAddress')} // Registrar el input con privateAddress
           className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.privateAddress || serverState?.errors?.privateAddress ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.privateAddress || serverState?.errors?.privateAddress ? 'true' : 'false'}
          aria-describedby="privateAddress-error" // Actualizar aria-describedby
        />
         {(errors.privateAddress || serverState?.errors?.privateAddress) && ( // Usar privateAddress
          <div id="privateAddress-error" aria-live="polite" aria-atomic="true"> {/* Actualizar id */}
            {(errors.privateAddress?.message || serverState?.errors?.privateAddress?.[0]) && ( // Usar privateAddress
              <p className="mt-2 text-sm text-red-500">{errors.privateAddress?.message || serverState.errors.privateAddress[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Campo Fecha de Vencimiento de Licencia (Opcional) */}
      <div>
        <label htmlFor="licenseExpirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Vencimiento de Licencia</label>
        <input
          type="date" // Usar type="date" para el selector de fecha
          id="licenseExpirationDate"
          {...register('licenseExpirationDate')} // Registrar el input
           className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.licenseExpirationDate || serverState?.errors?.licenseExpirationDate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.licenseExpirationDate || serverState?.errors?.licenseExpirationDate ? 'true' : 'false'}
          aria-describedby="licenseExpirationDate-error"
        />
         {(errors.licenseExpirationDate || serverState?.errors?.licenseExpirationDate) && (
          <div id="licenseExpirationDate-error" aria-live="polite" aria-atomic="true">
            {(errors.licenseExpirationDate?.message || serverState?.errors?.licenseExpirationDate?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.licenseExpirationDate?.message || serverState.errors.licenseExpirationDate[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Campo Categoría de Licencia (Opcional) */}
      <div>
        <label htmlFor="licenseCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría de Licencia</label>
        <input
          type="text"
          id="licenseCategory"
          {...register('licenseCategory')} // Registrar el input
           className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.licenseCategory || serverState?.errors?.licenseCategory ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.licenseCategory || serverState?.errors?.licenseCategory ? 'true' : 'false'}
          aria-describedby="licenseCategory-error"
        />
         {(errors.licenseCategory || serverState?.errors?.licenseCategory) && (
          <div id="licenseCategory-error" aria-live="polite" aria-atomic="true">
            {(errors.licenseCategory?.message || serverState?.errors?.licenseCategory?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.licenseCategory?.message || serverState.errors.licenseCategory[0]}</p>
            )}
          </div>
        )}
      </div>

       {/* Campo Estado */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
        <select
          id="status"
          {...register('status')} // Registrar el select
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.status || serverState?.errors?.status ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.status || serverState?.errors?.status ? 'true' : 'false'}
          aria-describedby="status-error"
        >
          {DRIVER_STATUS.map(status => (
            <option key={status} value={status}>
              {/* Capitalizar la primera letra para mostrar */}
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
         {(errors.status || serverState?.errors?.status) && (
          <div id="status-error" aria-live="polite" aria-atomic="true">
            {(errors.status?.message || serverState?.errors?.status?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.status?.message || serverState.errors.status[0]}</p>
            )}
          </div>
        )}
      </div>

      {/* Mensaje de error general del servidor */}
       {serverState?.message && !serverState?.errors && (
          <div aria-live="polite" className="text-sm text-red-500">
            <p>{serverState.message}</p>
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
        <SubmitButton isEditing={isEditing} /> {/* Usar el componente compartido */}
      </div>
    </form>
  );
}

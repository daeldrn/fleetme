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
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
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
        email: initialData.email ?? '', // Asegurar string vacío para campos opcionales null
        status: initialData.status as DriverFormValues['status'], // Convertir explícitamente el tipo
    } : { // Valores por defecto para creación
      name: '',
      licenseNumber: '',
      contactPhone: '',
      email: '',
      status: 'active', // Valor por defecto para el estado
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
    if (data.email) formData.append('email', data.email);
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
         email: initialData.email ?? '',
         status: initialData.status as DriverFormValues['status'], // Convertir explícitamente el tipo
       });
     } else {
       // Resetear a valores por defecto si no hay initialData (para formulario de creación)
       reset({
         name: '',
         licenseNumber: '',
         contactPhone: '',
         email: '',
         status: 'active',
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

      {/* Campo Email (Opcional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input
          type="email"
          id="email"
          {...register('email')} // Registrar el input
           className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white ${
            errors.email || serverState?.errors?.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-invalid={errors.email || serverState?.errors?.email ? 'true' : 'false'}
          aria-describedby="email-error"
        />
         {(errors.email || serverState?.errors?.email) && (
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {(errors.email?.message || serverState?.errors?.email?.[0]) && (
              <p className="mt-2 text-sm text-red-500">{errors.email?.message || serverState.errors.email[0]}</p>
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

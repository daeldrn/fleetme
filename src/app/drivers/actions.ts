'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DRIVER_STATUS } from '@/constants/drivers'; // Importar la constante de estados desde la nueva ubicación

export type DriverStatus = typeof DRIVER_STATUS[number];

import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

// Función auxiliar para manejar errores comunes de Prisma
function handlePrismaError(error: any, action: string): string {
  console.error(`Database Error (${action}):`, error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'campo(s)';
      return `Error: El ${target} proporcionado ya existe.`;
    }
    if (error.code === 'P2025') {
       return `Error: El registro a ${action === 'eliminar' ? 'eliminar' : 'actualizar'} no fue encontrado.`;
    }
    // Puedes añadir manejo para otros códigos de error de Prisma aquí
  }
  return `Error interno al intentar ${action} el conductor.`;
}


// Esquema de validación para Driver
const DriverSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }),
  licenseNumber: z.string().min(1, { message: 'El número de licencia es requerido.' }),
  contactPhone: z.string().optional(), // Opcional
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')), // Opcional pero debe ser email válido o vacío
  status: z.enum(DRIVER_STATUS), // Usar la constante para los estados
});

// Estado del formulario para añadir/editar conductor
export type DriverFormState = {
  message: string | null;
  errors?: {
    name?: string[];
    licenseNumber?: string[];
    contactPhone?: string[];
    email?: string[];
    status?: string[];
  };
  toastMessage?: { // Añadir campo para mensajes de toast
    type: 'success' | 'error';
    message: string;
  };
};

// Server Action para añadir conductor
export async function addDriver(
  prevState: DriverFormState | undefined,
  formData: FormData
): Promise<DriverFormState> {
  // 1. Validar datos
  const validatedFields = DriverSchema.safeParse({
    name: formData.get('name'),
    licenseNumber: formData.get('licenseNumber'),
    contactPhone: formData.get('contactPhone'),
    email: formData.get('email'),
    status: formData.get('status'),
  });

  // 2. Si validación falla, devolver errores
  if (!validatedFields.success) {
    console.error('Validation Errors (Add Driver):', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Revise los campos proporcionados.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

   // Preparar datos para Prisma (manejar email opcional vacío)
   const dataToSave = {
     ...validatedFields.data,
     email: validatedFields.data.email || null, // Guardar null si el email está vacío
   };


  // 3. Guardar en DB
  try {
    await prisma.driver.create({
      data: dataToSave,
    });
  } catch (error) {
    return { message: handlePrismaError(error, 'añadir') };
  }

  // 4. Revalidar ruta
  revalidatePath('/drivers');

  // 5. Redirigir
  // No redirigimos inmediatamente para que el toast se muestre en la página actual
  // redirect('/drivers');

  return {
    message: 'Conductor añadido con éxito.',
    toastMessage: { type: 'success', message: 'Conductor añadido con éxito.' },
  };
}

// --- Server Action para Eliminar Conductor ---

// Usaremos el mismo tipo de estado que para eliminar vehículo
export type DeleteDriverState = {
  message: string | null;
  error?: string;
  toastMessage?: { // Añadir campo para mensajes de toast
    type: 'success' | 'error';
    message: string;
  };
};

export async function deleteDriver(
  prevState: DeleteDriverState | undefined,
  formData: FormData
): Promise<DeleteDriverState> {
  const id = formData.get('id') as string;

  if (!id) {
    return { message: 'Error: ID de conductor no proporcionado para la eliminación.' };
  }

  try {
    console.log(`Intentando eliminar conductor con ID: ${id}`);
    await prisma.driver.delete({
      where: { id: id },
    });
    console.log(`Conductor con ID: ${id} eliminado.`);

    revalidatePath('/drivers');
    // No redirigimos inmediatamente para que el toast se muestre en la página actual
    // redirect('/drivers');

    return {
      message: 'Conductor eliminado con éxito.',
      toastMessage: { type: 'success', message: 'Conductor eliminado con éxito.' },
    };

  } catch (error) {
    return {
      message: handlePrismaError(error, 'eliminar'),
      toastMessage: { type: 'error', message: handlePrismaError(error, 'eliminar') },
    };
  }
}


// --- Server Action para Actualizar Conductor ---

export async function updateDriver(
  id: string, // Necesitamos el ID para saber qué vehículo actualizar
  prevState: DriverFormState | undefined, // Reutilizar el mismo estado que addDriver
  formData: FormData
): Promise<DriverFormState> {

   // Validar que el ID existe (básico)
  if (!id) {
    return { message: 'Error: ID de conductor no proporcionado para la actualización.' };
  }

  // 1. Validar los datos del formulario usando Zod
  const validatedFields = DriverSchema.safeParse({
    name: formData.get('name'),
    licenseNumber: formData.get('licenseNumber'),
    contactPhone: formData.get('contactPhone'),
    email: formData.get('email'),
    status: formData.get('status'),
  });

  // 2. Si la validación falla, devolver errores
  if (!validatedFields.success) {
    console.error('Validation Errors (Update Driver):', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Revise los campos proporcionados.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Preparar datos para Prisma (manejar email opcional vacío)
   const dataToUpdate = {
     ...validatedFields.data,
     email: validatedFields.data.email || null, // Guardar null si el email está vacío
   };

  // 3. Si la validación es exitosa, actualizar el conductor en la DB
  try {
    await prisma.driver.update({
      where: { id: id },
      data: dataToUpdate,
    });
  } catch (error) {
     return { message: handlePrismaError(error, 'actualizar') };
  }

  // 4. Revalidar la caché de la página de conductores y la página de edición
  revalidatePath('/drivers');
  revalidatePath(`/drivers/${id}/edit`); // Revalidar también la página de edición

  // 5. Redirigir al usuario de vuelta a la página de conductores
  // No redirigimos inmediatamente para que el toast se muestre en la página actual
  // redirect('/drivers');

  return {
    message: 'Conductor actualizado con éxito.',
    toastMessage: { type: 'success', message: 'Conductor actualizado con éxito.' },
  };
}

// --- Server Action para Buscar Conductores ---
export async function searchDrivers(query: string): Promise<
  { id: string; name: string; licenseNumber: string }[]
> {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const drivers = await prisma.driver.findMany({
      where: {
        AND: [ // Usar AND para combinar la búsqueda por nombre/licencia y el estado
          {
            OR: [
              { name: { contains: query } }, // Buscar por nombre
              { licenseNumber: { contains: query } }, // Buscar por número de licencia
            ],
          },
          { status: 'active' }, // Filtrar solo por conductores activos
        ],
      },
      select: {
        id: true,
        name: true,
        licenseNumber: true,
      },
      take: 10, // Limitar el número de resultados
    });
    return drivers;
  } catch (error) {
    console.error('Database Error (searchDrivers):', error); // Mensaje de error más específico
    // En una aplicación real, podrías querer loggear esto a un servicio de monitoreo
    // o devolver un error al cliente de alguna manera si es necesario manejarlo en la UI.
    // Por ahora, devolver un array vacío es suficiente para no romper la UI de búsqueda.
    return [];
  }
}

'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { DRIVER_STATUS, LICENSE_CATEGORIES } from '@/constants/drivers'; // Importar las constantes de estados y categorías de licencia

export type DriverStatus = typeof DRIVER_STATUS[number];
export type LicenseCategory = typeof LICENSE_CATEGORIES[number]; // Exportar tipo para la categoría de licencia

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
  privateAddress: z.string().optional(), // Cambiado de email a privateAddress, ahora opcional sin validación de email
  licenseExpirationDate: z.string().optional().refine((date) => { // Añadir validación para fecha de vencimiento
    if (!date) return true; // Campo opcional
    return !isNaN(new Date(date).getTime()); // Validar que sea una fecha válida
  }, {
    message: 'Fecha de vencimiento de licencia inválida.',
  }),
  licenseCategory: z.enum(LICENSE_CATEGORIES as unknown as [string, ...string[]], { // Usar 'as unknown as [string, ...string[]]' para compatibilidad con z.enum
    errorMap: (issue, _ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: `Categoría de licencia inválida. Debe ser una de: ${LICENSE_CATEGORIES.join(', ')}` };
      }
      // Asegurar que el mensaje siempre sea un string
      return { message: issue.message || 'Error de validación en la categoría de licencia.' };
    },
  }).optional(), // Hacer el campo opcional si es necesario, o .default(LICENSE_CATEGORIES[0]) si debe tener un valor por defecto
  status: z.enum(DRIVER_STATUS), // Usar la constante para los estados
});

// Estado del formulario para añadir/editar conductor
export type DriverFormState = {
  message: string | null;
  errors?: {
    name?: string[];
    licenseNumber?: string[];
    contactPhone?: string[];
    privateAddress?: string[]; // Cambiado de email a privateAddress
    licenseExpirationDate?: string[]; // Añadir error para fecha de vencimiento
    licenseCategory?: string[]; // Añadir error para categoría de licencia
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
    privateAddress: formData.get('privateAddress'), // Cambiado de email a privateAddress
    licenseExpirationDate: formData.get('licenseExpirationDate'), // Obtener fecha de vencimiento
    licenseCategory: formData.get('licenseCategory'), // Obtener categoría de licencia
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

   // Preparar datos para Prisma (manejar privateAddress, fechas opcionales/nulas y licenseCategory opcional)
   const dataToSave: Prisma.DriverCreateInput = { // Tipar explícitamente para mejor seguridad
     name: validatedFields.data.name,
     licenseNumber: validatedFields.data.licenseNumber,
     contactPhone: validatedFields.data.contactPhone || null, // Guardar null si está vacío
     privateAddress: validatedFields.data.privateAddress || null, // Guardar null si está vacío
     licenseExpirationDate: validatedFields.data.licenseExpirationDate ? new Date(validatedFields.data.licenseExpirationDate) : null, // Convertir a Date o null
     licenseCategory: validatedFields.data.licenseCategory || null, // Guardar null si está vacío
     status: validatedFields.data.status,
     // createdAt y updatedAt son manejados por @default y @updatedAt en el schema
   };


  // 3. Guardar en DB
  try {
    await prisma.driver.create({
      data: dataToSave as any, // Usar 'as any' temporalmente si hay problemas de tipo persistentes con Prisma
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
    return {
      message: 'Error: ID de conductor no proporcionado para la actualización.',
      toastMessage: { type: 'error', message: 'Error: ID de conductor no proporcionado para la actualización.' }, // Añadir toast de error
    };
  }

  // 1. Validar los datos del formulario usando Zod
  const validatedFields = DriverSchema.safeParse({
    name: formData.get('name'),
    licenseNumber: formData.get('licenseNumber'),
    contactPhone: formData.get('contactPhone'),
    privateAddress: formData.get('privateAddress'), // Cambiado de email a privateAddress
    licenseExpirationDate: formData.get('licenseExpirationDate'), // Obtener fecha de vencimiento
    licenseCategory: formData.get('licenseCategory'), // Obtener categoría de licencia
    status: formData.get('status'),
  });

  // 2. Si la validación falla, devolver errores
  if (!validatedFields.success) {
    console.error('Validation Errors (Update Driver):', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Revise los campos proporcionados.',
      errors: validatedFields.error.flatten().fieldErrors,
      toastMessage: { type: 'error', message: 'Error de validación. Revise los campos.' }, // Añadir toast de error de validación
    };
  }

  // Preparar datos para Prisma (manejar privateAddress, fechas opcionales/nulas y licenseCategory opcional)
   const dataToUpdate: Prisma.DriverUpdateInput = { // Tipar explícitamente
     name: validatedFields.data.name,
     licenseNumber: validatedFields.data.licenseNumber,
     contactPhone: validatedFields.data.contactPhone || null, // Guardar null si está vacío
     privateAddress: validatedFields.data.privateAddress || null, // Guardar null si está vacío
     licenseExpirationDate: validatedFields.data.licenseExpirationDate ? new Date(validatedFields.data.licenseExpirationDate) : null, // Convertir a Date o null
     licenseCategory: validatedFields.data.licenseCategory || null, // Guardar null si está vacío
     status: validatedFields.data.status,
   };

  // 3. Si la validación es exitosa, actualizar el conductor en la DB
  try {
    await prisma.driver.update({
      where: { id: id },
      data: dataToUpdate as any, // Usar 'as any' temporalmente si hay problemas de tipo persistentes con Prisma
    });
  } catch (error) {
     return {
       message: handlePrismaError(error, 'actualizar'),
       toastMessage: { type: 'error', message: handlePrismaError(error, 'actualizar') }, // Añadir toast de error
     };
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
          { status: 'activo' }, // Filtrar solo por conductores activos
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

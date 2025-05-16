'use server'; // Marcar este módulo como contenedor de Server Actions

import { z } from 'zod'; // Usaremos Zod para validar los datos del formulario
import prisma from '@/lib/prisma'; // Importar cliente Prisma
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client'; // Importar tipos de Prisma si es necesario para errores
import { VEHICLE_STATUS } from '@/constants/vehicle'; // Importar la constante de estados

// Definir un esquema de validación con Zod (ACTUALIZADO)
const VehicleSchema = z.object({
  make: z.string().min(1, { message: 'La marca es requerida.' }),
  model: z.string().min(1, { message: 'El modelo es requerido.' }),
  year: z.coerce.number().int().min(1900, { message: 'Año inválido.' }).max(new Date().getFullYear() + 1, { message: 'Año inválido.' }),
  licensePlate: z.string().min(1, { message: 'La matrícula es requerida.' }),
  vin: z.string().min(1, { message: 'El VIN es requerido.' }),
  purchaseDate: z.preprocess((arg) => { // Preprocesar para manejar string vacío o null
    if (typeof arg === 'string' && arg === '') return undefined; // Convertir string vacío a undefined
    if (arg === null) return undefined; // Convertir null a undefined
    return arg;
  }, z.coerce.date().optional()), // Coercionar a fecha y hacer opcional
  status: z.enum(VEHICLE_STATUS), // Usar la constante de estados
  vehicleTypeId: z.string().min(1, { message: 'El tipo de vehículo es requerido.' }), // Añadido
});

// Tipar el estado que puede devolver la acción (para errores de validación) (ACTUALIZADO)
export type FormState = {
  message: string | null;
  errors?: {
    make?: string[];
    model?: string[];
    year?: string[];
    licensePlate?: string[];
    vin?: string[];
    purchaseDate?: string[]; // Añadir errores para purchaseDate
    status?: string[];
    vehicleTypeId?: string[];
    driverIds?: string[]; // Añadir errores para driverIds
  };
  toastMessage?: { // Añadir campo para mensajes de toast
    type: 'success' | 'error';
    message: string;
  };
};

// La Server Action addVehicle (ACTUALIZADA)
export async function addVehicle(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  // 1. Validar los datos del formulario usando Zod
  const validatedFields = VehicleSchema.safeParse({
    make: formData.get('make'),
    model: formData.get('model'),
    year: formData.get('year'),
    licensePlate: formData.get('licensePlate'),
    vin: formData.get('vin'),
    purchaseDate: formData.get('purchaseDate'), // Leer purchaseDate
    status: formData.get('status'),
    vehicleTypeId: formData.get('vehicleTypeId'), // Añadido
  });

  // 2. Si la validación falla, devolver errores
  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Por favor, corrija los campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 3. Si la validación es exitosa, proceder con más validaciones y creación
  const driverIds = formData.getAll('driverIds') as string[]; // Leer driverIds

  // VALIDACIÓN ADICIONAL: maxDrivers
  if (driverIds.length > 0) { // Solo validar si se intentan asignar conductores
    const vehicleType = await prisma.vehicleType.findUnique({
      where: { id: validatedFields.data.vehicleTypeId },
    });
    if (!vehicleType) {
      // Este error ya debería ser capturado por la validación de Zod si vehicleTypeId es requerido y no existe,
      // pero es una buena doble comprobación.
      return { message: 'Error: El tipo de vehículo seleccionado no es válido.' };
    }
    if (driverIds.length > vehicleType.maxDrivers) {
      return {
        message: 'Error de validación.', // Mensaje general de validación
        errors: {
          driverIds: [`El número de conductores asignados (${driverIds.length}) excede el máximo permitido (${vehicleType.maxDrivers}) para el tipo "${vehicleType.name}".`],
        },
      };
    }
  }

  // Crear el vehículo en la DB usando Prisma
  try {
    await prisma.vehicle.create({
      data: {
        make: validatedFields.data.make,
        model: validatedFields.data.model,
        year: validatedFields.data.year,
        licensePlate: validatedFields.data.licensePlate,
        vin: validatedFields.data.vin,
        purchaseDate: validatedFields.data.purchaseDate, // Guardar purchaseDate
        status: validatedFields.data.status,
        vehicleTypeId: validatedFields.data.vehicleTypeId,
        drivers: driverIds.length > 0 ? { connect: driverIds.map(id => ({ id })) } : undefined, // Conectar conductores
        // createdAt y updatedAt son manejados por Prisma (@default y @updatedAt)
      },
    });
  } catch (error) {
    console.error('Database Error (Add Vehicle):', error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
       // Podríamos analizar error.meta.target para saber qué campo falló (licensePlate o vin)
       return { message: 'Error: La matrícula o el VIN ya existen.' };
     }
    return { message: 'Error al guardar el vehículo en la base de datos.' };
  }

  // 4. Revalidar la caché
  revalidatePath('/vehicles');

  // 5. Redirigir
  // No redirigimos inmediatamente para que el toast se muestre en la página actual
  // redirect('/vehicles');

  return {
    message: 'Vehículo añadido con éxito.',
    toastMessage: { type: 'success', message: 'Vehículo añadido con éxito.' },
  };
}

// --- Server Action para Eliminar Vehículo --- (Sin cambios)
export type DeleteState = {
  message: string | null;
  error?: string;
  toastMessage?: { // Añadir campo para mensajes de toast
    type: 'success' | 'error';
    message: string;
  };
};

export async function deleteVehicle(
  prevState: DeleteState | undefined,
  formData: FormData
): Promise<DeleteState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { message: 'Error: ID de vehículo no proporcionado.' };
  }
  try {
    console.log(`Intentando eliminar vehículo con ID: ${id}`);
    await prisma.vehicle.delete({ where: { id: id } });
    console.log(`Vehículo con ID: ${id} eliminado.`);
    revalidatePath('/vehicles');
    // No redirigimos inmediatamente para que el toast se muestre en la página actual
    // redirect('/vehicles');

    return {
      message: 'Vehículo eliminado con éxito.',
      toastMessage: { type: 'success', message: 'Vehículo eliminado con éxito.' },
    };
  } catch (error) {
    console.error('Database Error (Delete Vehicle):', error);
    const errorMessage = (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
      ? 'Error: No se encontró el vehículo a eliminar.'
      : 'Error al eliminar el vehículo de la base de datos.';
    return {
      message: errorMessage,
      toastMessage: { type: 'error', message: errorMessage },
    };
  }
}


// --- Server Action para Actualizar Vehículo --- (ACTUALIZADA)
export async function updateVehicle(
  id: string,
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
   if (!id) {
    return { message: 'Error: ID de vehículo no proporcionado para la actualización.' };
  }

  // 1. Validar datos
  const validatedFields = VehicleSchema.safeParse({
    make: formData.get('make'),
    model: formData.get('model'),
    year: formData.get('year'),
    licensePlate: formData.get('licensePlate'),
    vin: formData.get('vin'),
    purchaseDate: formData.get('purchaseDate'), // Leer purchaseDate
    status: formData.get('status'),
    vehicleTypeId: formData.get('vehicleTypeId'),
  });
  // Obtener los IDs de los conductores seleccionados
  const driverIds = formData.getAll('driverIds') as string[];

  // 2. Si validación falla
  if (!validatedFields.success) {
    console.error('Validation Errors (Update Vehicle):', validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Por favor, corrija los campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // VALIDACIÓN ADICIONAL: maxDrivers
  const vehicleType = await prisma.vehicleType.findUnique({
    where: { id: validatedFields.data.vehicleTypeId },
  });

  if (!vehicleType) {
    return { message: 'Error: El tipo de vehículo seleccionado no es válido.' };
  }

  if (driverIds.length > vehicleType.maxDrivers) {
    return {
      message: 'Error de validación.', // Mensaje general de validación
      errors: {
        driverIds: [`El número de conductores asignados (${driverIds.length}) excede el máximo permitido (${vehicleType.maxDrivers}) para el tipo "${vehicleType.name}".`],
      },
    };
  }

  // 3. Actualizar en DB
  try {
    await prisma.vehicle.update({ // Usar 'vehicle' en minúscula
      where: { id: id },
      data: {
        make: validatedFields.data.make,
        model: validatedFields.data.model,
        year: validatedFields.data.year,
        licensePlate: validatedFields.data.licensePlate,
        vin: validatedFields.data.vin,
        purchaseDate: validatedFields.data.purchaseDate, // Actualizar purchaseDate
        status: validatedFields.data.status,
        vehicleTypeId: validatedFields.data.vehicleTypeId,
        // Actualizar la relación M-N con los conductores
        drivers: {
          set: driverIds.map(driverId => ({ id: driverId })), // Desconecta los no listados, conecta los nuevos
        },
        // updatedAt se actualiza automáticamente por Prisma
      },
    });
  } catch (error) {
     console.error('Database Error (Update Vehicle):', error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
             return { message: 'Error: No se encontró el vehículo a actualizar.' };
        }
         if (error.code === 'P2002') {
           return { message: 'Error: La matrícula o el VIN ya existen para otro vehículo.' };
         }
     }
    return { message: 'Error al actualizar el vehículo en la base de datos.' };
  }

  // 4. Revalidar caché
  revalidatePath('/vehicles');
  revalidatePath(`/vehicles/${id}/edit`);

  // 5. Redirigir
  // No redirigimos inmediatamente para que el toast se muestre en la página actual
  // redirect('/vehicles');

  return {
    message: 'Vehículo actualizado con éxito.',
    toastMessage: { type: 'success', message: 'Vehículo actualizado con éxito.' },
  };
}

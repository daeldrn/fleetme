'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';

// Esquema de validación para VehicleType
const VehicleTypeSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido.' }),
  // Asegurarse que maxDrivers sea un número entero positivo
  maxDrivers: z.coerce.number().int({ message: 'Debe ser un número entero.' }).positive({ message: 'Debe ser un número positivo.' }).min(1, { message: 'Debe ser al menos 1.' }).default(1),
});

// Estado del formulario para añadir/editar tipo
export type VehicleTypeFormState = {
  message: string | null;
  errors?: {
    name?: string[];
    maxDrivers?: string[];
  };
  toastMessage?: { // Añadir campo para mensajes de toast
    type: 'success' | 'error';
    message: string;
  };
};

// --- ADD ACTION ---
export async function addVehicleType(
  prevState: VehicleTypeFormState | undefined,
  formData: FormData
): Promise<VehicleTypeFormState> {
  const validatedFields = VehicleTypeSchema.safeParse({
    name: formData.get('name'),
    maxDrivers: formData.get('maxDrivers'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.vehicleType.create({
      data: validatedFields.data,
    });
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
       return { message: 'Error: Ya existe un tipo con ese nombre.' };
     }
    return { message: 'Error al guardar el tipo de vehículo.' };
  }

  revalidatePath('/vehicle-types');

  // Comprobar si hay URL de redirección personalizada
  const redirectTo = formData.get('redirectTo') as string | null;
  if (redirectTo) {
    // Validar mínimamente que parece una ruta interna
    if (redirectTo.startsWith('/')) {
      // No redirigimos inmediatamente para que el toast se muestre en la página actual
      // redirect(redirectTo);
      return {
        message: 'Tipo de vehículo añadido con éxito.',
        toastMessage: { type: 'success', message: 'Tipo de vehículo añadido con éxito.' },
      };
    } else {
      // Si no es válida, redirigir a la lista por defecto
      console.warn(`Invalid redirectTo value provided: ${redirectTo}. Redirecting to default.`);
      // No redirigimos inmediatamente para que el toast se muestre en la página actual
      // redirect('/vehicle-types');
       return {
        message: 'Tipo de vehículo añadido con éxito.',
        toastMessage: { type: 'success', message: 'Tipo de vehículo añadido con éxito.' },
      };
    }
  } else {
    // Redirección por defecto
    // No redirigimos inmediatamente para que el toast se muestre en la página actual
    // redirect('/vehicle-types');
     return {
      message: 'Tipo de vehículo añadido con éxito.',
      toastMessage: { type: 'success', message: 'Tipo de vehículo añadido con éxito.' },
    };
  }
}

// --- UPDATE ACTION ---
export async function updateVehicleType(
  id: string,
  prevState: VehicleTypeFormState | undefined,
  formData: FormData
): Promise<VehicleTypeFormState> {
   if (!id) {
    return { message: 'Error: ID no proporcionado.' };
  }

  const validatedFields = VehicleTypeSchema.safeParse({
    name: formData.get('name'),
    maxDrivers: formData.get('maxDrivers'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.vehicleType.update({
      where: { id: id },
      data: validatedFields.data,
    });
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
           return { message: 'Error: Ya existe otro tipo con ese nombre.' };
        }
        if (error.code === 'P2025') {
           return { message: 'Error: No se encontró el tipo a actualizar.' };
        }
     }
    return { message: 'Error al actualizar el tipo de vehículo.' };
  }

  revalidatePath('/vehicle-types');
  revalidatePath(`/vehicle-types/${id}/edit`);
  // No redirigimos inmediatamente para que el toast se muestre en la página actual
  // redirect('/vehicle-types');

  return {
    message: 'Tipo de vehículo actualizado con éxito.',
    toastMessage: { type: 'success', message: 'Tipo de vehículo actualizado con éxito.' },
  };
}

// --- DELETE ACTION ---
export type DeleteVehicleTypeState = {
  message: string | null;
  toastMessage?: { // Añadir campo para mensajes de toast
    type: 'success' | 'error';
    message: string;
  };
};

export async function deleteVehicleType(
   prevState: DeleteVehicleTypeState | undefined,
   formData: FormData
): Promise<DeleteVehicleTypeState> {
  const id = formData.get('id') as string;
   if (!id) {
    return { message: 'Error: ID no proporcionado.' };
  }

  try {
    // Verificar si algún vehículo usa este tipo antes de eliminar
    const vehiclesUsingType = await prisma.vehicle.count({
      where: { vehicleTypeId: id },
    });

    if (vehiclesUsingType > 0) {
      return { message: `Error: No se puede eliminar el tipo porque está siendo usado por ${vehiclesUsingType} vehículo(s).` };
    }

    await prisma.vehicleType.delete({
      where: { id: id },
    });
    revalidatePath('/vehicle-types');
    // No redirigimos inmediatamente para que el toast se muestre en la página actual
    // redirect('/vehicle-types');

    return {
      message: 'Tipo de vehículo eliminado con éxito.',
      toastMessage: { type: 'success', message: 'Tipo de vehículo eliminado con éxito.' },
    };
  } catch (error) {
     const errorMessage = (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
       ? 'Error: No se encontró el tipo a eliminar.'
       : (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') // Foreign key constraint failed
         ? 'Error: No se puede eliminar el tipo porque está siendo usado por uno o más vehículos.'
         : 'Error al eliminar el tipo de vehículo.';
    return {
      message: errorMessage,
      toastMessage: { type: 'error', message: errorMessage },
    };
  }
}

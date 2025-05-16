'use client';

import { deleteVehicleType } from '@/app/vehicle-types/actions';
import DeleteForm from '@/components/DeleteForm'; // Importar el componente DeleteForm compartido
import { ReactNode } from 'react'; // Importar ReactNode

interface DeleteVehicleTypeFormProps {
  id: string;
  icon?: ReactNode; // Añadir prop para el icono
}

export default function DeleteVehicleTypeForm({ id, icon }: DeleteVehicleTypeFormProps) {
  return (
    <DeleteForm
      id={id}
      action={deleteVehicleType}
      successMessage="Tipo de vehículo eliminado con éxito."
      icon={icon} // Pasar el icono al componente DeleteForm
    />
  );
}

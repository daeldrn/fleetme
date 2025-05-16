'use client';

import { deleteVehicle } from '@/app/vehicles/actions';
import DeleteForm from '@/components/DeleteForm'; // Importar el componente DeleteForm compartido
import { ReactNode } from 'react'; // Importar ReactNode

interface DeleteVehicleFormProps {
  id: string;
  icon?: ReactNode; // Añadir prop para el icono
}

export default function DeleteVehicleForm({ id, icon }: DeleteVehicleFormProps) {
  return (
    <DeleteForm
      id={id}
      action={deleteVehicle}
      successMessage="Vehículo eliminado con éxito."
      icon={icon} // Pasar el icono al componente DeleteForm
    />
  );
}

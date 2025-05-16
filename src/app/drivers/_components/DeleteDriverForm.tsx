'use client';

import { deleteDriver } from '@/app/drivers/actions';
import DeleteForm from '@/components/DeleteForm'; // Importar el componente DeleteForm compartido
import { ReactNode } from 'react'; // Importar ReactNode

interface DeleteDriverFormProps {
  id: string;
  icon?: ReactNode; // Añadir prop para el icono
}

export default function DeleteDriverForm({ id, icon }: DeleteDriverFormProps) {
  return (
    <DeleteForm
      id={id}
      action={deleteDriver}
      successMessage="Conductor eliminado con éxito."
      icon={icon} // Pasar el icono al componente DeleteForm
    />
  );
}

'use client';

import { useActionState, useEffect, useState, useRef } from 'react'; // Importar useRef
import SubmitButton from '@/components/SubmitButton';
import { ReactNode } from 'react'; // Importar ReactNode
import Modal from '@/components/Modal'; // Importar el componente Modal
import toast from 'react-hot-toast'; // Importar toast

interface DeleteFormProps {
  id: string;
  action: (prevState: any, formData: FormData) => Promise<any>; // Server Action para eliminar
  successMessage?: string; // Mensaje opcional de éxito
  errorMessage?: string; // Mensaje opcional de error
  icon?: ReactNode; // Añadir prop para el icono
  itemName?: string; // Nombre del item a eliminar (para el mensaje del modal)
}

export default function DeleteForm({ id, action, successMessage, errorMessage, icon, itemName = 'este elemento' }: DeleteFormProps) {
  const [state, formAction] = useActionState(action, { message: null, error: undefined });
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal
  const formRef = useRef<HTMLFormElement>(null); // Referencia al formulario

  useEffect(() => {
    if (state?.error) {
      setDisplayError(state.error);
    } else {
      setDisplayError(null);
    }
    // Si la acción fue exitosa, cerrar el modal
    if (state?.message === successMessage) {
        setIsModalOpen(false);
    }

    // Mostrar toast si hay un mensaje de toast en el estado
    if (state?.toastMessage) {
      if (state.toastMessage.type === 'success') {
        toast.success(state.toastMessage.message);
      } else {
        toast.error(state.toastMessage.message);
      }
    }

  }, [state, successMessage]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    // Disparar el envío del formulario referenciado
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
    // El modal se cerrará en el useEffect si la acción es exitosa
  };


  return (
    <>
      {/* Botón que abre el modal */}
      {icon ? (
        <button
          type="button" // Cambiar a type="button" para no enviar el formulario
          onClick={openModal}
          className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ${
            state?.message === successMessage ? 'opacity-50 cursor-not-allowed' : '' // Deshabilitar si ya se eliminó con éxito
          }`}
          disabled={state?.message === successMessage} // Deshabilitar si ya se eliminó con éxito
        >
          {icon}
        </button>
      ) : (
        // Si no hay icono, usar un SubmitButton con texto que también abre el modal
        <SubmitButton text={state?.message === successMessage ? 'Eliminado' : 'Eliminar'} onClick={openModal} disabled={state?.message === successMessage} />
      )}

      {/* Formulario real (oculto visualmente si se usa icono) */}
      <form ref={formRef} action={formAction} className="inline" onSubmit={() => setDisplayError(null)} style={{ display: icon ? 'none' : 'inline' }}>
        <input type="hidden" name="id" value={id} />
        {/* Si no se usa icono, el SubmitButton ya está renderizado arriba */}
        {!icon && <SubmitButton text={state?.message === successMessage ? 'Eliminado' : 'Eliminar'} />}
      </form>

      {/* Mostrar mensaje de error si existe */}
      {displayError && (
        <p className="text-red-500 text-sm mt-1" aria-live="polite">
          {displayError}
        </p>
      )}

      {/* Modal de Confirmación */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h3 className="text-lg font-bold mb-4">Confirmar Eliminación</h3>
        <p className="mb-6">¿Está seguro de que desea eliminar {itemName}? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </>
  );
}

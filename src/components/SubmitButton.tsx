'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  isEditing?: boolean; // Opcional, para cambiar el texto si es necesario
  text?: string; // Texto personalizado para el botón
  onClick?: () => void; // Añadir prop onClick opcional
  disabled?: boolean; // Añadir prop disabled opcional
}

export default function SubmitButton({ isEditing = false, text, onClick, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const buttonText = text || (pending ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar' : 'Guardar'));

  return (
    <button
      type="submit"
      aria-disabled={pending || disabled} // Deshabilitar si está pendiente o si se pasa disabled
      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        pending || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick} // Pasar el onClick prop al botón nativo
      disabled={pending || disabled} // Deshabilitar si está pendiente o si se pasa disabled
    >
      {buttonText}
    </button>
  );
}

import { notFound } from 'next/navigation';
import { fetchDriverById } from '@/lib/data/drivers'; // Importar la función de obtención de datos por ID
import DriverForm from '../../_components/DriverForm'; // Corregir la ruta de importación
import { updateDriver } from '../../actions'; // Corregir la ruta de importación

interface EditDriverPageProps {
  params: { id: string };
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
  const id = params.id;

  // Obtener conductor por ID usando la función centralizada
  const driver = await fetchDriverById(id);

  if (!driver) {
    notFound();
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Editar Conductor</h1>
      {/* Usar el componente DriverForm y pasar los datos iniciales y la Server Action updateDriver */}
      <DriverForm initialData={driver} action={updateDriver.bind(null, id)} />
    </main>
  );
}

import DriverForm from '../_components/DriverForm'; // Importar el componente DriverForm
import { addDriver } from '../actions'; // Importar la Server Action addDriver

export default function NewDriverPage() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Añadir Nuevo Conductor</h1>
      {/* Usar el componente DriverForm y pasar la Server Action addDriver */}
      <DriverForm action={addDriver} />
    </main>
  );
}

import type { Metadata } from "next"; // Importar Metadata

export const metadata: Metadata = {
  title: "FleetMe - Inicio", // Título específico para la página de inicio
  description: "Gestión de Flota de Vehículos",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Bienvenido a FleetMe
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Gestiona tu flota de vehículos de forma eficiente.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          {/* Aquí podríamos agregar enlaces a las secciones principales más adelante */}
        </div>
      </div>
    </main>
  );
}

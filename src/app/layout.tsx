'use client'; // Convertir a Client Component para usar estado

import { useState } from 'react'; // Importar useState
// Eliminar importación de Metadata
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from 'react-hot-toast'; // Importar Toaster

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NOTA: La exportación de metadata se movió a page.tsx o se manejaría con generateMetadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState(false);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-center" /> {/* Añadir el componente Toaster */}
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              FleetMe
            </Link>
            <div className="flex items-center space-x-4">
              {/* Menú Vehículos con Desplegable */}
              <div className="relative">
                <button
                  onClick={() => setIsVehicleMenuOpen(!isVehicleMenuOpen)}
                  onBlur={() => setTimeout(() => setIsVehicleMenuOpen(false), 150)} // Cerrar al perder foco (con delay)
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  Vehículos
                  {/* Icono flecha (opcional) */}
                  <svg className={`inline-block ml-1 h-4 w-4 transition-transform duration-200 ${isVehicleMenuOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Contenido del Desplegable */}
                {isVehicleMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <Link
                      href="/vehicles"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsVehicleMenuOpen(false)} // Cerrar al hacer clic
                    >
                      Registro de Vehículos {/* Cambiar el texto del enlace */}
                    </Link>
                    <Link
                      href="/vehicle-types"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsVehicleMenuOpen(false)} // Cerrar al hacer clic
                    >
                      Tipos de Vehículos
                    </Link>
                  </div>
                )}
              </div>

              {/* Otros enlaces principales */}
              <Link href="/drivers" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                Conductores
              </Link>
              {/* Ya no necesitamos el enlace directo a Tipos aquí */}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

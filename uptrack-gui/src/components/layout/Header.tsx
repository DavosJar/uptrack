import React from 'react';

const Header: React.FC = () => {
  return (
    <header role="banner" className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-white text-2xl font-bold tracking-wide">
          Uptrack
        </div>
        <nav aria-label="Navegación principal" className="flex space-x-6">
          <button 
            aria-label="Ir al Dashboard"
            className="bg-white text-blue-600 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Dashboard
          </button>
          <button 
            aria-label="Ver reportes"
            className="bg-white text-green-600 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Reports
          </button>
          <button 
            aria-label="Abrir configuración"
            className="bg-white text-red-600 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Settings
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
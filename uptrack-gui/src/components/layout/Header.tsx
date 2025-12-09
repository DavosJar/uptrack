import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-white text-2xl font-bold tracking-wide">
          Uptrack
        </div>
        <nav className="flex space-x-6">
          <button className="bg-white text-blue-600 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Dashboard
          </button>
          <button className="bg-white text-green-600 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Reports
          </button>
          <button className="bg-white text-red-600 font-semibold py-2 px-6 rounded-full shadow-md hover:bg-gray-100 hover:shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Settings
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
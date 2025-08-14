/**
 * Página de Configuración del Sistema
 * 
 * Configuración general del sistema y preferencias
 */

import React from 'react';
import { Settings } from 'lucide-react';

const Configuracion = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Configuración del Sistema
        </h1>
        <p className="text-gray-600 mt-1">
          Administra la configuración general del sistema
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Configuración General
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Ajustes principales del sistema
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el nombre de la empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda Por Defecto
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="ARS">Pesos Argentinos (ARS)</option>
                  <option value="USD">Dólares Americanos (USD)</option>
                  <option value="EUR">Euros (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona Horaria
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Habilitar notificaciones por email
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;

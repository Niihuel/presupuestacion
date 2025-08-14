/**
 * Componente para la sexta etapa del wizard: Seguimiento
 * 
 * Permite gestionar el seguimiento del presupuesto con integración Kanban
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, Clock, CheckCircle, XCircle, AlertCircle, 
  MessageSquare, Calendar, User, Bell, TrendingUp,
  Phone, Mail, FileText, ArrowRight, RefreshCw
} from 'lucide-react';

const EtapaSeguimiento = ({ formData, updateFormData, errors = {} }) => {
  const [localData, setLocalData] = useState({
    kanban_status: 'enviado',
    follow_up_date: '',
    customer_response: '',
    customer_feedback: '',
    response_date: '',
    status_notes: '',
    next_actions: [],
    reminders: [],
    contact_history: [],
    probability: 50,
    estimated_closing_date: '',
    competitor_info: '',
    ...formData
  });

  const [newAction, setNewAction] = useState('');
  const [newReminder, setNewReminder] = useState({ date: '', description: '' });
  const [newContact, setNewContact] = useState({ type: 'call', description: '', date: '' });

  // Actualizar formData cuando localData cambie
  useEffect(() => {
    updateFormData(localData);
  }, [localData, updateFormData]);

  const handleInputChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Estados del kanban
  const kanbanStatuses = [
    { 
      value: 'nuevo', 
      label: 'Nuevo', 
      color: 'bg-gray-100 text-gray-800',
      icon: FileText,
      description: 'Presupuesto recién creado'
    },
    { 
      value: 'en_desarrollo', 
      label: 'En Desarrollo', 
      color: 'bg-blue-100 text-blue-800',
      icon: RefreshCw,
      description: 'En proceso de elaboración'
    },
    { 
      value: 'en_cotizacion', 
      label: 'En Cotización', 
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
      description: 'Definiendo precios y condiciones'
    },
    { 
      value: 'in_review', 
      label: 'En Revisión', 
      color: 'bg-purple-100 text-purple-800',
      icon: AlertCircle,
      description: 'Listo para revisión interna'
    },
    { 
      value: 'enviado', 
      label: 'Enviado', 
      color: 'bg-indigo-100 text-indigo-800',
      icon: ArrowRight,
      description: 'Enviado al cliente'
    },
    { 
      value: 'en_seguimiento', 
      label: 'En Seguimiento', 
      color: 'bg-orange-100 text-orange-800',
      icon: Target,
      description: 'Esperando respuesta del cliente'
    },
    { 
      value: 'aceptado', 
      label: 'Aceptado', 
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      description: 'Aprobado por el cliente'
    },
    { 
      value: 'rechazado', 
      label: 'Rechazado', 
      color: 'bg-red-100 text-red-800',
      icon: XCircle,
      description: 'Rechazado por el cliente'
    }
  ];

  const actionTypes = [
    { value: 'call', label: 'Llamar al cliente', icon: Phone },
    { value: 'email', label: 'Enviar email', icon: Mail },
    { value: 'meeting', label: 'Programar reunión', icon: Calendar },
    { value: 'follow_up', label: 'Hacer seguimiento', icon: Target },
    { value: 'review', label: 'Revisar propuesta', icon: FileText },
    { value: 'update', label: 'Actualizar presupuesto', icon: RefreshCw }
  ];

  const addNextAction = () => {
    if (newAction.trim()) {
      setLocalData(prev => ({
        ...prev,
        next_actions: [...prev.next_actions, {
          id: Date.now(),
          description: newAction,
          completed: false,
          created_at: new Date().toISOString()
        }]
      }));
      setNewAction('');
    }
  };

  const toggleAction = (actionId) => {
    setLocalData(prev => ({
      ...prev,
      next_actions: prev.next_actions.map(action =>
        action.id === actionId ? { ...action, completed: !action.completed } : action
      )
    }));
  };

  const removeAction = (actionId) => {
    setLocalData(prev => ({
      ...prev,
      next_actions: prev.next_actions.filter(action => action.id !== actionId)
    }));
  };

  const addReminder = () => {
    if (newReminder.date && newReminder.description) {
      setLocalData(prev => ({
        ...prev,
        reminders: [...prev.reminders, {
          id: Date.now(),
          ...newReminder,
          active: true
        }]
      }));
      setNewReminder({ date: '', description: '' });
    }
  };

  const addContact = () => {
    if (newContact.description && newContact.date) {
      setLocalData(prev => ({
        ...prev,
        contact_history: [...prev.contact_history, {
          id: Date.now(),
          ...newContact,
          created_at: new Date().toISOString()
        }]
      }));
      setNewContact({ type: 'call', description: '', date: '' });
    }
  };

  const removeContact = (contactId) => {
    setLocalData(prev => ({
      ...prev,
      contact_history: prev.contact_history.filter(contact => contact.id !== contactId)
    }));
  };

  const currentStatus = kanbanStatuses.find(status => status.value === localData.kanban_status);
  const StatusIcon = currentStatus?.icon || FileText;

  const getProbabilityColor = (probability) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    if (probability >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Seguimiento del Presupuesto
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Gestione el seguimiento y la evolución del presupuesto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado y Seguimiento */}
        <div className="space-y-6">
          {/* Estado Actual */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Estado Actual</h4>
            
            <div className="space-y-3">
              {kanbanStatuses.map((status) => {
                const Icon = status.icon;
                return (
                  <label key={status.value} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    localData.kanban_status === status.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="kanban_status"
                      value={status.value}
                      checked={localData.kanban_status === status.value}
                      onChange={(e) => handleInputChange('kanban_status', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${status.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{status.label}</div>
                        <div className="text-sm text-gray-600">{status.description}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Información de Seguimiento */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Información de Seguimiento</h5>
            
            <div className="space-y-4">
              {/* Fecha de Seguimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próxima fecha de seguimiento
                </label>
                <input
                  type="date"
                  value={localData.follow_up_date}
                  onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Probabilidad de Cierre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Probabilidad de cierre (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localData.probability}
                    onChange={(e) => handleInputChange('probability', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`font-medium text-sm w-12 ${getProbabilityColor(localData.probability)}`}>
                    {localData.probability}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Bajo</span>
                  <span>Alto</span>
                </div>
              </div>

              {/* Fecha Estimada de Cierre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha estimada de cierre
                </label>
                <input
                  type="date"
                  value={localData.estimated_closing_date}
                  onChange={(e) => handleInputChange('estimated_closing_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Respuesta del Cliente */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Respuesta del Cliente</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de respuesta
                </label>
                <input
                  type="date"
                  value={localData.response_date}
                  onChange={(e) => handleInputChange('response_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respuesta del cliente
                </label>
                <textarea
                  value={localData.customer_response}
                  onChange={(e) => handleInputChange('customer_response', e.target.value)}
                  placeholder="Respuesta o comentarios del cliente..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback adicional
                </label>
                <textarea
                  value={localData.customer_feedback}
                  onChange={(e) => handleInputChange('customer_feedback', e.target.value)}
                  placeholder="Feedback o sugerencias del cliente..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Acciones y Historial */}
        <div className="space-y-6">
          {/* Próximas Acciones */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Próximas Acciones</h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Agregar nueva acción..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addNextAction()}
                />
                <button
                  type="button"
                  onClick={addNextAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {localData.next_actions.map((action) => (
                  <div key={action.id} className={`flex items-center gap-3 p-3 border rounded-lg ${
                    action.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={action.completed}
                      onChange={() => toggleAction(action.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className={`flex-1 text-sm ${
                      action.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {action.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAction(action.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {localData.next_actions.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay acciones pendientes
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recordatorios */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recordatorios</h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newReminder.date}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={addReminder}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Agregar Recordatorio
              </button>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {localData.reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{reminder.description}</div>
                      <div className="text-gray-600">{new Date(reminder.date).toLocaleDateString()}</div>
                    </div>
                    <Bell className="w-4 h-4 text-yellow-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historial de Contactos */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Historial de Contactos</h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newContact.type}
                  onChange={(e) => setNewContact(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {actionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newContact.date}
                  onChange={(e) => setNewContact(prev => ({ ...prev, date: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newContact.description}
                  onChange={(e) => setNewContact(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={addContact}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Agregar Contacto
              </button>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {localData.contact_history.map((contact) => {
                  const ContactIcon = actionTypes.find(type => type.value === contact.type)?.icon || MessageSquare;
                  return (
                    <div key={contact.id} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <ContactIcon className="w-4 h-4 text-gray-600 mt-1" />
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{contact.description}</div>
                        <div className="text-gray-600">
                          {new Date(contact.date).toLocaleDateString()} - 
                          {actionTypes.find(type => type.value === contact.type)?.label}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContact(contact.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {localData.contact_history.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay contactos registrados
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información de Competencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Información de competencia
            </label>
            <textarea
              value={localData.competitor_info}
              onChange={(e) => handleInputChange('competitor_info', e.target.value)}
              placeholder="Información sobre la competencia, precios de referencia, etc..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notas del Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas adicionales
            </label>
            <textarea
              value={localData.status_notes}
              onChange={(e) => handleInputChange('status_notes', e.target.value)}
              placeholder="Notas adicionales sobre el estado del presupuesto..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Resumen del Estado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Resumen del Estado
        </h5>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatus?.color}`}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {currentStatus?.label}
            </div>
            <div className="text-xs text-gray-600 mt-1">Estado Actual</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getProbabilityColor(localData.probability)}`}>
              {localData.probability}%
            </div>
            <div className="text-xs text-gray-600">Probabilidad</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {localData.next_actions.filter(a => !a.completed).length}
            </div>
            <div className="text-xs text-gray-600">Acciones Pendientes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {localData.contact_history.length}
            </div>
            <div className="text-xs text-gray-600">Contactos Realizados</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EtapaSeguimiento;

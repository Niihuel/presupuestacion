'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchSelect } from '@/components/ui/search-select';
import { Alert } from '@/components/ui/alert';
import { Users, Building, Phone, Mail, MapPin, FileText } from 'lucide-react';
import axios from 'axios';

interface Step1ClientProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export default function Step1Client({ data, onUpdate, onNext }: Step1ClientProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(data.clientId || '');
  const [selectedProjectId, setSelectedProjectId] = useState(data.projectId || '');
  const [newClient, setNewClient] = useState(false);
  const [newProject, setNewProject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Datos del nuevo cliente
  const [clientData, setClientData] = useState({
    name: '',
    cuit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  // Datos del nuevo proyecto
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    location: '',
    type: 'industrial',
    estimatedStartDate: '',
    estimatedEndDate: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId && !newClient) {
      loadProjects(selectedClientId);
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadProjects = async (clientId: string) => {
    try {
      const response = await axios.get(`/api/projects?clientId=${clientId}`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!selectedClientId && !newClient) {
      newErrors.client = 'Debe seleccionar o crear un cliente';
    }

    if (newClient) {
      if (!clientData.name) newErrors.clientName = 'El nombre es requerido';
      if (!clientData.cuit) newErrors.clientCuit = 'El CUIT es requerido';
      if (!clientData.email) newErrors.clientEmail = 'El email es requerido';
    }

    if (!selectedProjectId && !newProject) {
      newErrors.project = 'Debe seleccionar o crear un proyecto';
    }

    if (newProject) {
      if (!projectData.name) newErrors.projectName = 'El nombre del proyecto es requerido';
      if (!projectData.location) newErrors.projectLocation = 'La ubicación es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let finalClientId = selectedClientId;
      let finalProjectId = selectedProjectId;

      // Crear nuevo cliente si es necesario
      if (newClient) {
        const response = await axios.post('/api/clients', clientData);
        finalClientId = response.data.id;
      }

      // Crear nuevo proyecto si es necesario
      if (newProject) {
        const response = await axios.post('/api/projects', {
          ...projectData,
          clientId: finalClientId
        });
        finalProjectId = response.data.id;
      }

      // Actualizar datos del wizard
      onUpdate({
        clientId: finalClientId,
        projectId: finalProjectId,
        client: newClient ? clientData : clients.find(c => c.id === finalClientId),
        project: newProject ? projectData : projects.find(p => p.id === finalProjectId)
      });

      onNext();
    } catch (error) {
      console.error('Error saving client/project:', error);
      setErrors({ general: 'Error al guardar los datos' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selección o creación de cliente */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Datos del Cliente
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Cliente</Label>
              <SearchSelect
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                placeholder="Seleccione un cliente"
                searchPlaceholder="Buscar cliente por nombre o CUIT..."
                disabled={newClient}
                options={clients.map(client => ({
                  value: client.id,
                  label: client.name,
                  description: `CUIT: ${client.cuit} - ${client.email || 'Sin email'}`
                }))}
                emptyText="No se encontraron clientes"
              />
              {errors.client && (
                <p className="text-sm text-red-500 mt-1">{errors.client}</p>
              )}
            </div>
            <div className="pt-6">
              <Button
                type="button"
                variant={newClient ? "default" : "outline"}
                onClick={() => setNewClient(!newClient)}
              >
                {newClient ? 'Usar Existente' : 'Nuevo Cliente'}
              </Button>
            </div>
          </div>

          {newClient && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="clientName">Razón Social *</Label>
                <Input
                  id="clientName"
                  value={clientData.name}
                  onChange={(e) => setClientData({...clientData, name: e.target.value})}
                  placeholder="Empresa S.A."
                />
                {errors.clientName && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientCuit">CUIT *</Label>
                <Input
                  id="clientCuit"
                  value={clientData.cuit}
                  onChange={(e) => setClientData({...clientData, cuit: e.target.value})}
                  placeholder="30-12345678-9"
                />
                {errors.clientCuit && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientCuit}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({...clientData, email: e.target.value})}
                  placeholder="contacto@empresa.com"
                />
                {errors.clientEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.clientEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="clientPhone">Teléfono</Label>
                <Input
                  id="clientPhone"
                  value={clientData.phone}
                  onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                  placeholder="+54 351 4123456"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="clientAddress">Dirección</Label>
                <Input
                  id="clientAddress"
                  value={clientData.address}
                  onChange={(e) => setClientData({...clientData, address: e.target.value})}
                  placeholder="Av. Example 1234"
                />
              </div>

              <div>
                <Label htmlFor="clientCity">Ciudad</Label>
                <Input
                  id="clientCity"
                  value={clientData.city}
                  onChange={(e) => setClientData({...clientData, city: e.target.value})}
                  placeholder="Córdoba"
                />
              </div>

              <div>
                <Label htmlFor="clientProvince">Provincia</Label>
                <Input
                  id="clientProvince"
                  value={clientData.province}
                  onChange={(e) => setClientData({...clientData, province: e.target.value})}
                  placeholder="Córdoba"
                />
              </div>
            </div>
          )}

          {selectedClientId && !newClient && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {clients.find(c => c.id === selectedClientId) && (
                  <>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{clients.find(c => c.id === selectedClientId).email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{clients.find(c => c.id === selectedClientId).phone}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{clients.find(c => c.id === selectedClientId).address}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Selección o creación de proyecto */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building className="h-5 w-5" />
          Datos del Proyecto
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Proyecto</Label>
              <SearchSelect
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                placeholder="Seleccione un proyecto"
                searchPlaceholder="Buscar proyecto por nombre o ubicación..."
                disabled={newProject || !selectedClientId}
                options={projects.map(project => ({
                  value: project.id,
                  label: project.name,
                  description: `Ubicación: ${project.location} - Tipo: ${project.type || 'No especificado'}`
                }))}
                emptyText={!selectedClientId ? "Seleccione un cliente primero" : "No se encontraron proyectos"}
              />
              {errors.project && (
                <p className="text-sm text-red-500 mt-1">{errors.project}</p>
              )}
            </div>
            <div className="pt-6">
              <Button
                type="button"
                variant={newProject ? "default" : "outline"}
                onClick={() => setNewProject(!newProject)}
                disabled={!selectedClientId && !newClient}
              >
                {newProject ? 'Usar Existente' : 'Nuevo Proyecto'}
              </Button>
            </div>
          </div>

          {newProject && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="projectName">Nombre del Proyecto *</Label>
                <Input
                  id="projectName"
                  value={projectData.name}
                  onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                  placeholder="Nave Industrial Norte"
                />
                {errors.projectName && (
                  <p className="text-sm text-red-500 mt-1">{errors.projectName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="projectLocation">Ubicación *</Label>
                <Input
                  id="projectLocation"
                  value={projectData.location}
                  onChange={(e) => setProjectData({...projectData, location: e.target.value})}
                  placeholder="Parque Industrial"
                />
                {errors.projectLocation && (
                  <p className="text-sm text-red-500 mt-1">{errors.projectLocation}</p>
                )}
              </div>

              <div>
                <Label htmlFor="projectType">Tipo de Obra</Label>
                <Select 
                  value={projectData.type} 
                  onValueChange={(value) => setProjectData({...projectData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="infrastructure">Infraestructura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="projectDescription">Descripción</Label>
                <Textarea
                  id="projectDescription"
                  value={projectData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectData({...projectData, description: e.target.value})}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {selectedProjectId && !newProject && projects.find(p => p.id === selectedProjectId) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>{projects.find(p => p.id === selectedProjectId).description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{projects.find(p => p.id === selectedProjectId).location}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {errors.general && (
        <Alert variant="destructive">
          {errors.general}
        </Alert>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleNext} 
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Siguiente: Selección de Planta y Piezas'}
        </Button>
      </div>
    </div>
  );
}

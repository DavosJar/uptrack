import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Monitor, Settings } from 'lucide-react';

const AddTarget: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'WEB',
    url: '',
    interval: '3 min',
    internalNetwork: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name.trim() || !formData.url.trim() || !formData.type) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/targets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          url: formData.url,
        }),
      });

      if (response.ok) {
        setModalTitle('Éxito');
        setModalMessage('Sistema agregado correctamente');
        setModalType('success');
        setIsModalOpen(true);
      } else {
        const data = await response.json();
        setModalTitle('Error');
        setModalMessage(data.message || 'Error al crear el sistema');
        setModalType('error');
        setIsModalOpen(true);
      }
    } catch (err) {
      setModalTitle('Error');
      setModalMessage('Error de red');
      setModalType('error');
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Agregar Nuevo Sistema</h1>
      <form onSubmit={handleSubmit} className="bg-background-card border border-border-dark rounded-xl p-8 space-y-8 shadow-lg">
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-600">
              <Monitor className="text-primary w-5 h-5" />
              <h2 className="text-lg font-semibold text-white">Información del Sistema</h2>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Nombre del Sistema"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ej. API de Producción"
              required
              helpText="Alias descriptivo para identificación."
            />
            <FormField
              label="URL a Monitorear"
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://ejemplo.com"
              required
              helpText="URL completa del endpoint a verificar."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'WEB', label: 'WEB' },
                { value: 'API', label: 'API' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center h-11 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-600 bg-background text-white hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={handleChange}
                    className="sr-only"
                    required
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-600">
              <Settings className="text-primary w-5 h-5" />
              <h2 className="text-lg font-semibold text-white">Configuración de Monitoreo</h2>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Intervalo</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '1 min', label: '1 min' },
                  { value: '3 min', label: '3 min' },
                  { value: '5 min', label: '5 min' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center h-11 border rounded-lg cursor-pointer transition-colors text-xs ${
                      formData.interval === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-600 bg-background text-white hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interval"
                      value={option.value}
                      checked={formData.interval === option.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Red Interna</label>
              <label className="flex items-center justify-between w-full h-11 px-4 border border-gray-400 rounded-lg bg-background hover:border-gray-300 cursor-pointer transition-colors">
                <span className="text-sm text-white">Habilitar monitoreo interno</span>
                <div className="relative w-12 h-6">
                  <input
                    type="checkbox"
                    name="internalNetwork"
                    checked={formData.internalNetwork}
                    onChange={(e) => setFormData({ ...formData, internalNetwork: e.target.checked })}
                    className="sr-only"
                  />
                  <span className={`absolute inset-0 rounded-full transition-colors ${formData.internalNetwork ? 'bg-primary' : 'bg-gray-600'}`}></span>
                  <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.internalNetwork ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-600">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Agregando...' : 'Agregar Sistema'}
          </Button>
        </div>
      </form>
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={modalTitle}
      >
        <p className={modalType === 'success' ? 'text-green-400' : 'text-red-400'}>
          {modalMessage}
        </p>
        <div className="flex justify-end mt-4">
          <Button onClick={handleModalClose}>Aceptar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AddTarget;
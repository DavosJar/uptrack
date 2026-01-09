import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Settings, Trash2, Play, Pause, AlertTriangle } from 'lucide-react';
import { fetchWithAuth } from '../api/fetch';

interface Target {
  id: string;
  name: string;
  url: string;
  target_type: string;
  is_active: boolean;
  current_status: string;
  last_checked_at: string | null;
  avg_response_time: number;
}

const Systems: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [targetToToggle, setTargetToToggle] = useState<Target | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetchWithAuth('/api/v1/targets');

        if (response.ok) {
          const data = await response.json();
          console.log('Targets response:', data);
          setTargets(data.data || []);
        } else {
          // Fallback to mock data
          const mockTargets: Target[] = [
            {
              id: "019aec8b-d045-7d4b-9c9a-e9c2e3425631",
              name: "Google",
              url: "https://www.google.com",
              target_type: "WEB",
              is_active: true,
              current_status: "UP",
              last_checked_at: "2025-12-04T22:29:35-05:00",
              avg_response_time: 215
            },
            {
              id: "019aec8b-d045-7d4b-9c9a-e9c2e3425632",
              name: "GitHub",
              url: "https://github.com",
              target_type: "WEB",
              is_active: true,
              current_status: "DOWN",
              last_checked_at: "2025-12-04T22:28:15-05:00",
              avg_response_time: 1250
            },
            {
              id: "019aec8b-d045-7d4b-9c9a-e9c2e3425633",
              name: "API Interna",
              url: "https://api.interna.com/health",
              target_type: "API",
              is_active: false,
              current_status: "DEGRADED",
              last_checked_at: "2025-12-04T22:27:45-05:00",
              avg_response_time: 850
            }
          ];
          setTargets(mockTargets);
          setError('Error al cargar los sistemas - usando datos de prueba');
        }
      } catch (err) {
        // Fallback to mock data
        const mockTargets: Target[] = [
          {
            id: "019aec8b-d045-7d4b-9c9a-e9c2e3425631",
            name: "Google",
            url: "https://www.google.com",
            target_type: "WEB",
            is_active: true,
            current_status: "UP",
            last_checked_at: "2025-12-04T22:29:35-05:00",
            avg_response_time: 215
          },
          {
            id: "019aec8b-d045-7d4b-9c9a-e9c2e3425632",
            name: "GitHub",
            url: "https://github.com",
            target_type: "WEB",
            is_active: true,
            current_status: "DOWN",
            last_checked_at: "2025-12-04T22:28:15-05:00",
            avg_response_time: 1250
          }
        ];
        setTargets(mockTargets);
        setError('Error de red - usando datos de prueba');
      } finally {
        setLoading(false);
      }
    };

    fetchTargets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'text-green-400';
      case 'DOWN': return 'text-red-400';
      case 'DEGRADED': return 'text-yellow-400';
      case 'FLAPPING': return 'text-orange-400';
      case 'UNSTABLE': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UP': return 'En línea';
      case 'DOWN': return 'Fuera de línea';
      case 'DEGRADED': return 'Degradado';
      case 'FLAPPING': return 'Inestable';
      case 'UNSTABLE': return 'Inestable';
      default: return 'Desconocido';
    }
  };

  const handleConfigure = (targetId: string) => {
    // TODO: Implement configure functionality
    console.log('Configure target:', targetId);
  };

  const handleToggleActive = (targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    if (target) {
      setTargetToToggle(target);
      setShowToggleModal(true);
    }
  };

  const confirmToggle = async () => {
    if (!targetToToggle) return;

    setIsToggling(true);
    const newActiveState = !targetToToggle.is_active;
    
    try {
        const response = await fetchWithAuth(`/api/v1/targets/${targetToToggle.id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active: newActiveState })
        });

        if (response.ok) {
            setTargets(prev => prev.map(t => 
                t.id === targetToToggle.id ? { ...t, is_active: newActiveState } : t
            ));
            setShowToggleModal(false);
            setTargetToToggle(null);
        } else {
            const errorText = await response.text();
            console.error('Error toggling target:', errorText);
            setErrorMessage('Error al cambiar el estado del sistema. Por favor, intenta de nuevo.');
            setShowToggleModal(false);
            setShowErrorModal(true);
        }
    } catch (error) {
        console.error("Failed to toggle target", error);
        setErrorMessage('Error al conectar con el servidor. Por favor, verifica tu conexión.');
        setShowToggleModal(false);
        setShowErrorModal(true);
    } finally {
        setIsToggling(false);
    }
  };

  const handleDelete = async (targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    if (target) {
      setTargetToDelete(target);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!targetToDelete) return;

    setIsDeleting(true);
    try {
        const response = await fetchWithAuth(`/api/v1/targets/${targetToDelete.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            setTargets(prev => prev.filter(t => t.id !== targetToDelete.id));
            setShowDeleteModal(false);
            setTargetToDelete(null);
        } else {
            const errorText = await response.text();
            console.error('Error deleting target:', errorText);
            setErrorMessage('Error al eliminar el sistema. Por favor, intenta de nuevo.');
            setShowDeleteModal(false);
            setShowErrorModal(true);
        }
    } catch (error) {
        console.error("Failed to delete target", error);
        setErrorMessage('Error al conectar con el servidor. Por favor, verifica tu conexión.');
        setShowDeleteModal(false);
        setShowErrorModal(true);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main">
      <div className="w-full pt-8 pb-8">
        <div className="max-w-[95%] lg:max-w-[75%] mx-auto px-4 md:px-0">
          {/* Custom Header Layout */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-text-main mb-2">Gestión de Sistemas</h1>
            <p className="text-text-muted">Administra el ciclo de vida de tus sistemas monitoreados.</p>
          </div>

          {loading ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              <p className="text-text-main">Cargando sistemas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8" role="alert" aria-live="assertive">
              <p className="text-red-400">{error}</p>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8" role="status">
              <p className="text-text-main">No hay sistemas configurados. Usa el botón del navbar para agregar uno.</p>
            </div>
          ) : (
            <section aria-label="Lista de sistemas" className="space-y-6">
              {/* Header Card - Hidden on mobile */}
              <div className="hidden md:block bg-background-card border border-border-dark rounded-lg p-4" role="row" aria-label="Encabezados de columnas">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-text-muted">
                  <div className="col-span-3">Sistema</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-3">URL</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-2">Tiempo Promedio</div>
                </div>
              </div>

              {/* Systems List */}
              <ul role="list" className="space-y-4">
                {targets.map((target) => (
                  <li key={target.id} className="bg-background-card border border-border-dark rounded-lg overflow-hidden hover:border-primary/50 transition-colors" role="listitem">
                    {/* Desktop: Table-like layout */}
                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:p-4 md:items-center">
                      <div className="md:col-span-3">
                        <h3 
                          className="text-lg font-bold text-text-main cursor-pointer hover:text-primary transition-colors" 
                          onClick={() => navigate(`/target/${target.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/target/${target.id}`); }}
                          aria-label={`Ver detalles de ${target.name}`}
                        >
                          {target.name}
                        </h3>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm text-text-muted">{target.target_type}</span>
                      </div>
                      <div className="md:col-span-3">
                        <p className="text-sm text-text-muted truncate">{target.url}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(target.current_status)} bg-gray-700`} aria-label={`Estado: ${getStatusText(target.current_status)}`}>
                          {getStatusText(target.current_status)}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm text-text-muted">
                          {target.avg_response_time ? `${target.avg_response_time} ms` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile: Card-like layout similar to dashboard */}
                    <div className="md:hidden p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 
                          className="text-lg font-bold text-text-main cursor-pointer hover:text-primary transition-colors" 
                          onClick={() => navigate(`/target/${target.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/target/${target.id}`); }}
                          aria-label={`Ver detalles de ${target.name}`}
                        >
                          {target.name}
                        </h3>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(target.current_status)} bg-gray-700`} aria-label={`Estado: ${getStatusText(target.current_status)}`}>
                          {getStatusText(target.current_status)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-text-muted mb-4">
                        <p><span className="font-medium">Tipo:</span> {target.target_type}</p>
                        <p><span className="font-medium">URL:</span> {target.url}</p>
                        <p><span className="font-medium">Tiempo promedio:</span> {target.avg_response_time ? `${target.avg_response_time} ms` : 'N/A'}</p>
                        {target.last_checked_at && (
                          <p><span className="font-medium">Última verificación:</span> {new Date(target.last_checked_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Subtle vertical dividers - Desktop only */}
                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:px-4 md:pb-4" aria-hidden="true">
                      <div className="col-span-3 border-r border-border-dark h-1"></div>
                      <div className="col-span-2 border-r border-border-dark h-1"></div>
                      <div className="col-span-3 border-r border-border-dark h-1"></div>
                      <div className="col-span-2 border-r border-border-dark h-1"></div>
                      <div className="col-span-2 h-1"></div>
                    </div>

                    {/* Action Buttons Area */}
                    <div className="bg-background-hover px-4 py-3 border-t border-border-dark">
                      <div role="group" aria-label="Acciones del sistema" className="flex gap-2 md:gap-3 justify-end flex-wrap">
                        <Button
                          onClick={() => handleConfigure(target.id)}
                          variant="secondary"
                          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm"
                          aria-label={`Configurar ${target.name}`}
                        >
                          <Settings className="w-3 h-3 md:w-4 md:h-4" aria-hidden="true" />
                          <span className="hidden sm:inline">Configurar</span>
                          <span className="sm:hidden">Config</span>
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(target.id)}
                          variant="secondary"
                          className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm ${
                            target.is_active 
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          aria-label={`${target.is_active ? 'Desactivar' : 'Activar'} ${target.name}`}
                        >
                          {target.is_active ? (
                            <>
                              <Pause className="w-3 h-3 md:w-4 md:h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Desactivar</span>
                              <span className="sm:hidden">Off</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 md:w-4 md:h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Activar</span>
                              <span className="sm:hidden">On</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDelete(target.id)}
                          variant="secondary"
                          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm bg-red-600 hover:bg-red-700 text-white"
                          aria-label={`Eliminar ${target.name}`}
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" aria-hidden="true" />
                          <span className="hidden sm:inline">Eliminar</span>
                          <span className="sm:hidden">Borrar</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Confirmar Eliminación"
        borderColor="border-red-500"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-500/20 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-text-main font-medium">
                ¿Estás seguro de que deseas eliminar este sistema?
              </p>
              {targetToDelete && (
                <p className="text-text-muted mt-2">
                  <span className="font-semibold">{targetToDelete.name}</span>
                  <br />
                  <span className="text-sm">{targetToDelete.url}</span>
                </p>
              )}
              <p className="text-red-400 mt-3 text-sm">
                Esta acción no se puede deshacer. Se eliminarán todos los datos históricos asociados.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-background-hover hover:bg-border-dark text-text-main rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toggle Active Modal */}
      <Modal
        isOpen={showToggleModal}
        onClose={() => !isToggling && setShowToggleModal(false)}
        title={targetToToggle?.is_active ? "Desactivar Sistema" : "Activar Sistema"}
        borderColor={targetToToggle?.is_active ? "border-yellow-500" : "border-green-500"}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${targetToToggle?.is_active ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
              {targetToToggle?.is_active ? <Pause size={24} /> : <Play size={24} />}
            </div>
            <div>
              <p className="text-text-main font-medium">
                {targetToToggle?.is_active 
                  ? '¿Estás seguro de que deseas desactivar el monitoreo de este sistema?' 
                  : '¿Estás seguro de que deseas activar el monitoreo de este sistema?'}
              </p>
              {targetToToggle && (
                <p className="text-text-muted mt-2">
                  <span className="font-semibold">{targetToToggle.name}</span>
                  <br />
                  <span className="text-sm">{targetToToggle.url}</span>
                </p>
              )}
              <p className="text-text-muted mt-3 text-sm">
                {targetToToggle?.is_active 
                  ? 'El sistema dejará de ser monitoreado y no recibirás alertas.'
                  : 'El sistema comenzará a ser monitoreado y recibirás alertas según la configuración.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowToggleModal(false)}
              disabled={isToggling}
              className="px-4 py-2 bg-background-hover hover:bg-border-dark text-text-main rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmToggle}
              disabled={isToggling}
              className={`px-4 py-2 ${targetToToggle?.is_active ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2`}
            >
              {isToggling ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Procesando...
                </>
              ) : (
                <>
                  {targetToToggle?.is_active ? <Pause size={16} /> : <Play size={16} />}
                  {targetToToggle?.is_active ? 'Desactivar' : 'Activar'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        borderColor="border-red-500"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-500/20 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-text-main">{errorMessage}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-4 py-2 bg-background-hover hover:bg-border-dark text-text-main rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Systems;
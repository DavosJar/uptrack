import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Settings, Trash2, Play } from 'lucide-react';
import { fetchWithAuth } from '../api/fetch';

interface Target {
  id: string;
  name: string;
  url: string;
  target_type: string;
  current_status: string;
  last_checked_at: string | null;
  avg_response_time: number;
}

const Systems: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              current_status: "UP",
              last_checked_at: "2025-12-04T22:29:35-05:00",
              avg_response_time: 215
            },
            {
              id: "019aec8b-d045-7d4b-9c9a-e9c2e3425632",
              name: "GitHub",
              url: "https://github.com",
              target_type: "WEB",
              current_status: "DOWN",
              last_checked_at: "2025-12-04T22:28:15-05:00",
              avg_response_time: 1250
            },
            {
              id: "019aec8b-d045-7d4b-9c9a-e9c2e3425633",
              name: "API Interna",
              url: "https://api.interna.com/health",
              target_type: "API",
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
            current_status: "UP",
            last_checked_at: "2025-12-04T22:29:35-05:00",
            avg_response_time: 215
          },
          {
            id: "019aec8b-d045-7d4b-9c9a-e9c2e3425632",
            name: "GitHub",
            url: "https://github.com",
            target_type: "WEB",
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
    // TODO: Implement toggle active/inactive
    console.log('Toggle active for target:', targetId);
  };

  const handleDelete = (targetId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete target:', targetId);
  };

  return (
    <div className="min-h-screen bg-background text-text-main">
      <div className="w-full pt-8 pb-8">
        <div className="max-w-[95%] lg:max-w-[75%] mx-auto px-4 md:px-0">
          {/* Custom Header Layout */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Gestión de Sistemas</h1>
            <p className="text-text-muted">Administra el ciclo de vida de tus sistemas monitoreados.</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-white">Cargando sistemas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white">No hay sistemas configurados. Usa el botón del navbar para agregar uno.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Card - Hidden on mobile */}
              <div className="hidden md:block bg-background-card border border-border-dark rounded-lg p-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-text-muted">
                  <div className="col-span-3">Sistema</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-3">URL</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-2">Tiempo Promedio</div>
                </div>
              </div>

              {/* Systems List */}
              <div className="space-y-4">
                {targets.map((target) => (
                  <div key={target.id} className="bg-background-card border border-border-dark rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
                    {/* Desktop: Table-like layout */}
                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:p-4 md:items-center">
                      <div className="md:col-span-3">
                        <h3 className="text-lg font-bold text-white cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/target/${target.id}`)}>
                          {target.name}
                        </h3>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm text-gray-300">{target.target_type}</span>
                      </div>
                      <div className="md:col-span-3">
                        <p className="text-sm text-gray-300 truncate">{target.url}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(target.current_status)} bg-gray-700`}>
                          {getStatusText(target.current_status)}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm text-gray-300">
                          {target.avg_response_time ? `${target.avg_response_time} ms` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile: Card-like layout similar to dashboard */}
                    <div className="md:hidden p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/target/${target.id}`)}>
                          {target.name}
                        </h3>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${getStatusColor(target.current_status)} bg-gray-700`}>
                          {getStatusText(target.current_status)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-300 mb-4">
                        <p><span className="font-medium">Tipo:</span> {target.target_type}</p>
                        <p><span className="font-medium">URL:</span> {target.url}</p>
                        <p><span className="font-medium">Tiempo promedio:</span> {target.avg_response_time ? `${target.avg_response_time} ms` : 'N/A'}</p>
                        {target.last_checked_at && (
                          <p><span className="font-medium">Última verificación:</span> {new Date(target.last_checked_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Subtle vertical dividers - Desktop only */}
                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:px-4 md:pb-4">
                      <div className="col-span-3 border-r border-gray-600/50 h-1"></div>
                      <div className="col-span-2 border-r border-gray-600/50 h-1"></div>
                      <div className="col-span-3 border-r border-gray-600/50 h-1"></div>
                      <div className="col-span-2 border-r border-gray-600/50 h-1"></div>
                      <div className="col-span-2 h-1"></div>
                    </div>

                    {/* Action Buttons Area */}
                    <div className="bg-gray-700/30 px-4 py-3 border-t border-gray-600/50">
                      <div className="flex gap-2 md:gap-3 justify-end flex-wrap">
                        <Button
                          onClick={() => handleConfigure(target.id)}
                          variant="secondary"
                          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm"
                        >
                          <Settings className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Configurar</span>
                          <span className="sm:hidden">Config</span>
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(target.id)}
                          variant="secondary"
                          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm"
                        >
                          <Play className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Activar</span>
                          <span className="sm:hidden">On/Off</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(target.id)}
                          variant="secondary"
                          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 text-xs md:text-sm bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                          <span className="sm:hidden">Borrar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Systems;
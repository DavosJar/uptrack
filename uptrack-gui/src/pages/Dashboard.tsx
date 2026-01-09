import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetchWithAuth('/api/v1/targets');

        if (response.ok) {
          const data = await response.json();
          console.log('Targets response:', data);
          setTargets(data.data || []);
        } else {
          setError('Error al cargar los sistemas');
        }
      } catch (err) {
        setError('Error de red');
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

  const totalTargets = targets.length;
  const onlineTargets = targets.filter(t => t.current_status === 'UP').length;
  const alertsTargets = targets.filter(t => ['DOWN', 'DEGRADED', 'FLAPPING', 'UNSTABLE'].includes(t.current_status)).length;

  const filteredTargets = targets
    .filter(target => target.current_status !== 'UP') // Only show targets that are not UP
    .filter(target => {
      const matchesSearch = target.name.toLowerCase().includes(search.toLowerCase()) ||
                           target.url.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || target.current_status === filterStatus;
      return matchesSearch && matchesFilter;
    });

  return (
    <div className="min-h-screen bg-background text-text-main">
      <div className="w-full pt-8 pb-8">
        <div className="max-w-[95%] lg:max-w-[75%] mx-auto px-4 md:px-0">
          <PageHeader
            title="Dashboard"
            description="Bienvenido al dashboard de monitoreo de UpTrack."
          />

          <section aria-label="Estadísticas de sistemas" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <article className="bg-background-card border border-border-dark rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-main mb-2">Total Sistemas</h3>
              <p className="text-3xl font-bold text-primary" aria-label={`${totalTargets} sistemas en total`}>{totalTargets}</p>
            </article>
            <article className="bg-background-card border border-border-dark rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-main mb-2">Sistemas Online</h3>
              <p className="text-3xl font-bold text-green-500" aria-label={`${onlineTargets} sistemas en línea`}>{onlineTargets}</p>
            </article>
            <article className="bg-background-card border border-border-dark rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-main mb-2">Con Alertas</h3>
              <p className="text-3xl font-bold text-red-500" aria-label={`${alertsTargets} sistemas con alertas`}>{alertsTargets}</p>
            </article>
          </section>

          {/* Targets Grid */}
          {loading ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              <p className="text-text-main">Cargando sistemas...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8" role="alert" aria-live="assertive">
              <p className="text-red-500">{error}</p>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8" role="status">
              <p className="text-text-main">No hay sistemas configurados. Usa el botón del navbar para agregar uno.</p>
            </div>
          ) : (
            <div>
              {/* Search and Filters */}
              <section aria-label="Filtros y búsqueda" className="mb-8">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Buscar sistemas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-border-dark rounded-lg bg-background-input text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Buscar sistemas por nombre o URL"
                  />
                  <div role="group" aria-label="Filtros de estado" className="flex gap-2 flex-wrap">
                    {[
                      { key: 'ALL', label: 'Todos' },
                      { key: 'DOWN', label: 'Fuera de Línea' },
                      { key: 'DEGRADED', label: 'Degradado' },
                      { key: 'FLAPPING', label: 'Inestable' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilterStatus(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === key
                            ? 'bg-primary text-white'
                            : 'bg-background-card text-text-main hover:bg-background-hover border border-border-dark'
                        }`}
                        aria-pressed={filterStatus === key}
                        aria-label={`Filtrar por ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Targets Grid */}
              <section aria-label="Lista de sistemas" className="flex flex-wrap justify-center gap-6">
                {filteredTargets.map((target) => (
                  <article key={target.id} className="bg-background-card border border-border-dark rounded-lg p-6 hover:border-primary/50 transition-colors w-full max-w-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 
                        className="text-xl font-bold text-text-main truncate cursor-pointer hover:text-primary transition-colors" 
                        onClick={() => navigate(`/target/${target.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/target/${target.id}`); }}
                      >
                        {target.name}
                      </h3>
                      <span className={`text-xl font-bold uppercase ${getStatusColor(target.current_status)}`} aria-label={`Estado: ${getStatusText(target.current_status)}`}>
                        {getStatusText(target.current_status)}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-text-muted mb-4">
                      <p><span className="font-medium text-text-main">URL:</span> {target.url}</p>
                      <p><span className="font-medium text-text-main">Tipo:</span> {target.target_type}</p>
                    </div>
                    <hr className="border-border-dark mb-4" aria-hidden="true" />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm text-text-muted">
                        <span>Tiempo promedio</span>
                        <span className="font-medium text-lg text-text-main">{target.avg_response_time ? `${target.avg_response_time} ms` : 'N/A'}</span>
                      </div>
                      {target.last_checked_at && (
                        <div className="flex justify-between items-center text-sm text-text-muted">
                          <span>Última verificación</span>
                          <span className="font-medium text-text-main">{new Date(target.last_checked_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
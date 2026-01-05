import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '../api/fetch';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConnectTelegram = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetchWithAuth('/api/v1/notifications/telegram/link');
      
      if (!response.ok) {
        throw new Error('Error al generar el enlace de vinculación');
      }

      const data = await response.json();
      
      if (data.success && data.data.link) {
        // Abrir el enlace en una nueva pestaña
        window.open(data.data.link, '_blank');
        setSuccess('Se ha abierto Telegram. Por favor, presiona "Iniciar" en el bot para completar la vinculación.');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-main">Configuración</h1>
      </div>

      <div className="bg-background-surface rounded-xl border border-border-dark p-6">
        <h2 className="text-lg font-semibold text-text-main mb-4">Canales de Notificación</h2>
        <p className="text-text-muted mb-6">
          Configura los medios por los cuales deseas recibir alertas cuando tus sistemas cambien de estado.
        </p>

        <div className="space-y-4">
          {/* Telegram Integration Card */}
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border-dark">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Send className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="font-medium text-text-main">Telegram</h3>
                <p className="text-sm text-text-muted">Recibe alertas instantáneas a través de nuestro bot</p>
              </div>
            </div>
            
            <button
              onClick={handleConnectTelegram}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Conectar Telegram</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400">
              <CheckCircle size={20} />
              <p>{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

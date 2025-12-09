import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api/fetch';
import { PageHeader } from '../components/ui/PageHeader';
import FormField from '../components/ui/FormField';
import Button from '../components/ui/Button';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  timezone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    timezone: '',
    language: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithAuth('/api/v1/users/me');

        if (response.ok) {
          const data = await response.json();
          console.log('Profile response:', data);
          setProfile(data.data);
          setFormData({
            full_name: data.data.full_name || '',
            avatar_url: data.data.avatar_url || '',
            timezone: data.data.timezone || '',
            language: data.data.language || '',
          });
          // Auto-abrir formulario si el perfil está incompleto
          if (!data.data.full_name || !data.data.timezone || !data.data.language) {
            setIsEditing(true);
          }
        } else {
          setError('Error al cargar el perfil');
        }
      } catch (err) {
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetchWithAuth('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setIsEditing(false);
      } else {
        setError('Error al actualizar el perfil');
      }
    } catch (err) {
      setError('Error de red');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-white">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-white">No se encontró el perfil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full pt-8 pb-8">
        <div className="max-w-[95%] lg:max-w-[75%] mx-auto px-4 md:px-0">
          <PageHeader
            title="Mi Perfil"
            description="Gestiona tu información personal"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-gray-800/40 border border-gray-600 rounded-lg p-8">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                  label="Nombre Completo"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Ingresa tu nombre completo"
                  required
                />

                <FormField
                  label="Avatar URL"
                  name="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/avatar.jpg"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Zona Horaria
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Selecciona una zona horaria</option>
                    <option value="America/Santiago">America/Santiago</option>
                    <option value="America/Mexico_City">America/Mexico_City</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Europe/Madrid">Europe/Madrid</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Idioma
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Selecciona un idioma</option>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  {profile?.full_name && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          full_name: profile.full_name || '',
                          avatar_url: profile.avatar_url || '',
                          timezone: profile.timezone || '',
                          language: profile.language || '',
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-white">{profile?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                    <p className="text-white">{profile?.full_name || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Zona Horaria</label>
                    <p className="text-white">{profile?.timezone || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Idioma</label>
                    <p className="text-white">{profile?.language || 'No especificado'}</p>
                  </div>
                  {profile?.avatar_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Avatar</label>
                      <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full" />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-600">
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

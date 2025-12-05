import React, { useState } from 'react';
import { Monitor } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ email: '', password: '' });
        window.location.href = '/login';
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Monitor className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Crear Cuenta</h1>
          <p className="text-white mt-2">Empieza a monitorear tus sistemas hoy.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full bg-background border border-border rounded-lg h-11 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-background border border-border rounded-lg h-11 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">Registration successful! Redirecting...</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover h-11 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all mt-2 active:scale-[0.98]"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div className="text-center text-sm text-white">
          ¿Ya tienes cuenta? <a href="/login" className="text-primary font-medium hover:underline">Inicia sesión</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
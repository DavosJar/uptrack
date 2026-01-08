import React, { useState } from 'react';
import { Eye, EyeOff, Monitor } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.data.token);
        window.location.href = '/dashboard';
      } else {
        const data = await response.json();
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsLogin(true);
        setFormData({ email: '', password: '' });
        setSuccess('Registro exitoso. Por favor inicia sesión.');
      } else {
        const data = await response.json();
        setError(data.message || 'Error al registrarse');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-text-main">
      <aside className="hidden md:flex flex-col items-center justify-center bg-background-surface p-12 border-r border-border-dark relative overflow-hidden" aria-label="Información de la aplicación">
        {/* Abstract background shape */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" aria-hidden="true"></div>
        <div className="flex flex-col items-start max-w-sm gap-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Monitor className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-text-main">UpTrack</span>
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tighter text-text-main">
            Tu centro de control unificado.
          </h1>
          <p className="text-lg text-text-muted">
            Monitoreo inteligente y en tiempo real para todos tus sistemas web críticos.
          </p>
        </div>
      </aside>
      <main className="flex flex-col items-center justify-center p-8 sm:p-12 bg-background" role="main">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="text-3xl font-bold text-text-main">
              {isLogin ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h2>
            <p className="text-text-muted">
              {isLogin ? 'Inicia sesión para acceder a tu dashboard.' : 'Regístrate para comenzar a monitorear tus sistemas.'}
            </p>
          </div>
          <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="flex flex-col gap-6" aria-label={isLogin ? 'Formulario de inicio de sesión' : 'Formulario de registro'}>
            <label className="flex flex-col w-full gap-2">
              <span className="text-sm font-medium text-text-muted">Correo electrónico</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@tuempresa.com"
                className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-text-main placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                required
                aria-required="true"
                autoComplete="email"
              />
            </label>
            <label className="flex flex-col w-full gap-2">
              <span className="text-sm font-medium text-text-muted">Contraseña</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 pr-12 text-text-main placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  required
                  aria-required="true"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </label>
            {error && <p role="alert" aria-live="polite" className="text-status-danger text-sm">{error}</p>}
            {success && <p role="status" aria-live="polite" className="text-status-success text-sm">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-primary hover:bg-primary-hover h-11 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {loading ? (isLogin ? 'Iniciando...' : 'Registrando...') : (isLogin ? 'Iniciar Sesión' : 'Crear cuenta')}
            </button>
            <div className="flex justify-center text-sm mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                  setFormData({ email: '', password: '' });
                }}
                className="text-primary hover:text-primary-hover font-medium"
              >
                {isLogin ? '¿No tienes cuenta? Crear cuenta' : '¿Ya tienes cuenta? Iniciar sesión'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
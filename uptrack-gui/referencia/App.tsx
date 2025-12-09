import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  PlayCircle, 
  PauseCircle, 
  Edit, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  BarChart, 
  Users,
  Menu,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { ViewState, System, TeamMember, MetricData } from './types';

// --- MOCK DATA & ASSETS ---

const IMAGES = {
  userAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmYWrwqrLGVqsa8PsNYJ8b6iPXOx91rf2yse7Hzsfnmig_bY691fVzmDyyOl0nx4UKHUg9APx2Ot4nqm-oJBz96ckjLYJtS52bZ4Z85WLWxHdotBAxNllSGakk3asDn4Z56H_Jpc9CBN7dqNKHLBMv2j-RYtkYD5X91LN4j0vhOmOW-KPy39ji-4HSWUklMXmtFHut80ziuPKJ5psJj8j427MNnbObE6ibUSIAvXu5NdRlnviIJBmgjT-SsXHZDYtgZ886ISpaXHQ",
  slack: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8U5Guf8rD2jWeejkibmefrLaC-avAlJjbEbHmmRKmfuly6aOlA0H_tQ9vRYArrvdaG7hcPrD769KDtaPNZHeFc-gRaAStf3xc-NYXLcnvlTmAosUCrxhx8amlIj_YDaU_3fjDjYsdULiQZMgpmBNEo2DpW8ijw9FgKqqA9XTc3QOVG2gyxJXqg9E3vahb1H-94TjfgvR4SAEbazsLM1ozttBqit8jqGrkJn7mRUV0koXJgGEijeY9Ad1kCCYz5sFFHOnvm0IFvFA",
  telegram: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxHLUKdvxEO8tjghzFXeClKteJfInZw5sQ1ewgg0L5PEs2WUdmSDOSbmda0G8WJn9FiFLhGLZGpYQGwfU1i2Ue2t1Solb37KYoxKGIzJ0ZlAizsmCVe16ETBv_sngtLOJyJZgewVUwmB4rSBFQPo92hProKw0k6_s731dPpNoZ9iVxMnonxRWhVKAI9JA5CruKaBT90BCVdmB-yhd_EYhDxIDf4me_yyTzHBolyRaTRDqh-pUsLXXUlnsP1d--JW20YYQGo5sWT7w",
  whatsapp: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYBntagdKOcDG6Ey1o-fPnyHVF98BE9ILeuH8PzrNE3v5w63XdhLitix2sQgLR-V1C0U1ld3sca0RXUt-cLr6AznRspN3W5jJtpEqhHATe2yiTKAw-WfLcOArrdV2QyJKGb_F47BZry7wtVsg52J40HgLDA1dW3KdeBkpv0Ps6SHr_U3fI03p6Z6Zn0zv-qadlqDElRzU5sf_eTK_-12jnrTu5PLxE5iZlm4ETXYY8qTByqRGzvCUT9hd6caLnuEU6IYhuNhcElx8",
  team: {
    ana: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4DhlA07acxRQDJMlQ5SwDvGN_Po0Eg44go6XfbPGkGJzVSXIb7z3oWHdW9pPsSoJMRZCfPJv3eV7bcvFVm2xmPiRPOLvjZltu55g1CCRfk5IBel95IIKpwYklfGHlDTqmXO-LkLdOVzATAvSkiK1yT5Rct4vNK6E58GLOmBLoxd1l7HS9-LQrGdiDyVitfPtW-5Gqcz7Vjo9uSZyYYaTH_u34pVYmG63oJiNA55xZTwoJvr4Lnxs-b8qdgqo6559A5q3Pl3Qv_og",
    carlos: "https://lh3.googleusercontent.com/aida-public/AB6AXuDN5HQYB_yoX7rhNH0Glgz2BHKeL21MLxyxYpuR9TRApbrNgQyzD0i9wtofzwQJoamE1Kbo7kMXZNpPQwZPYWsjlI0BIXXOXgRaeLVDPQ31d8wqsmaZGFe2sPdxf6Ros_h7pRh3VcsaodwKLpoZwpnp87PaWwXHSsOUmRgQSH7KSwJ4QT8rULkoTcLBbOFpk6yn2_VmCmubKdl3aRB1ylLR8l6ejQV7udceGVDyYXZqneFbrf7Q-MEVDfQUqjj7p9agDgMS9qDLJn0",
    beatriz: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwE9Pwwu6UIdGWEDEfdr3ZvGw7GyQzd5s8y3WBV9VZ8yWZS6H_40hssIJTBwNkce7Clp8wUQnMpol0Ujb1zAIML2B3Re70aNRXlmQRWJVuE_WaImp9nsQq-QkRInt0251sP-ezJeinqGagd_XrG6QD1QD5ULKdcf_mqpQEMyuBuSFYtgEDpBv6carzkA15Z-OMj9Ih0uyhk61zA3XQPfRJf9alGCiX0PowF0cMHt2rQH_0uF5WyHAY378ZdEXCvFqMyemM_z6Lmyo",
    david: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkjVXoSWiqSQbSRpUoOr5vh_TYaii4hGH-OPfmVRGe0CSk3YLN6MdXvqrlr_NUxQoNlAxTYotArzUnNu8lKmREBoATOECef9lAiUDibLR48rfrTgL_AbhOK8L7pp-yhVj32C1DR0En_yiug8UfrGWDDlnMjzaUJWQNh3DoRpZZBX_jQd0RmG6rg1ng10ZF7HHHd4FPvNfq0B9C_S7mzxezpfi75RQs_UUeJ9eWxMx6SBH6yOVj0iQL7MTgiDJ97Wp4FoMXVb4gSDo"
  }
};

const SYSTEMS_MOCK: System[] = [
  { id: '1', name: 'Main API', url: 'api.example.com', status: 'UP', uptime: 99.98, responseTime: 120, lastChecked: 'a few seconds ago' },
  { id: '2', name: 'Corporate Website', url: 'www.mycompany.com', status: 'DOWN', uptime: 92.15, responseTime: null, lastChecked: '5 minutes ago' },
  { id: '3', name: 'Payment Gateway', url: 'payments.service.io', status: 'WARNING', uptime: 99.99, responseTime: 1500, lastChecked: '12 seconds ago' },
  { id: '4', name: 'Database Server', url: 'db1.cluster.internal', status: 'UP', uptime: 100, responseTime: 45, lastChecked: '30 seconds ago' },
  { id: '5', name: 'CDN Asset Host', url: 'cdn.mycompany.com', status: 'UP', uptime: 99.99, responseTime: 80, lastChecked: '1 minute ago' },
];

const TEAM_MOCK: TeamMember[] = [
  { id: '1', name: 'Ana Pérez', email: 'ana.perez@email.com', role: 'Admin', joinDate: '15 Ene, 2023', status: 'Active', avatarUrl: IMAGES.team.ana },
  { id: '2', name: 'Carlos Gómez', email: 'carlos.gomez@email.com', role: 'Member', joinDate: '20 Feb, 2023', status: 'Active', avatarUrl: IMAGES.team.carlos },
  { id: '3', name: 'Beatriz Sanz', email: 'beatriz.sanz@email.com', role: 'Viewer', joinDate: '05 Mar, 2023', status: 'Active', avatarUrl: IMAGES.team.beatriz },
  { id: '4', name: 'David Lopez', email: 'david.lopez@nuevo.com', role: 'Member', joinDate: 'Hoy', status: 'Pending', avatarUrl: IMAGES.team.david },
];

const CHART_DATA_RESPONSE: MetricData[] = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: Math.floor(Math.random() * 100) + 50 }));
const CHART_DATA_CPU: MetricData[] = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: Math.floor(Math.random() * 60) + 10 }));

// --- SHARED COMPONENTS ---

const StatusBadge = ({ status }: { status: System['status'] }) => {
  const styles = {
    UP: 'bg-status-success text-status-success',
    DOWN: 'bg-status-danger text-status-danger',
    WARNING: 'bg-status-warning text-status-warning',
  };
  
  // Using a pseudo-bg opacity trick or simple bg color. For consistency, let's use the color text with a localized background.
  // Tailwind doesn't support bg-opacity on arbitrary values easily without config, so we will use the text color and a dot.
  
  const dotColor = {
    UP: 'bg-status-success',
    DOWN: 'bg-status-danger',
    WARNING: 'bg-status-warning',
  };

  const textColor = {
    UP: 'text-status-success',
    DOWN: 'text-status-danger',
    WARNING: 'text-status-warning',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${dotColor[status]}`}></div>
      <p className={`text-sm font-bold ${textColor[status]}`}>{status}</p>
    </div>
  );
};

// --- VIEWS ---

const LoginView = ({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-text-main">
      <div className="hidden md:flex flex-col items-center justify-center bg-background-surface p-12 border-r border-border-dark relative overflow-hidden">
        {/* Abstract background shape */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col items-start max-w-sm gap-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">SystemWatch</span>
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tighter text-white">
            Tu centro de control unificado.
          </h1>
          <p className="text-lg text-text-muted">
            Monitoreo inteligente y en tiempo real para todos tus sistemas web críticos.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="text-3xl font-bold text-white">Bienvenido de nuevo</h2>
            <p className="text-text-muted">Inicia sesión para acceder a tu dashboard.</p>
          </div>
          <div className="flex flex-col gap-6">
            <label className="flex flex-col w-full gap-2">
              <span className="text-sm font-medium text-text-muted">Correo electrónico</span>
              <input type="email" placeholder="ejemplo@tuempresa.com" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
            </label>
            <label className="flex flex-col w-full gap-2">
              <span className="text-sm font-medium text-text-muted">Contraseña</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 pr-12 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button onClick={onLogin} className="w-full bg-primary hover:bg-primary-hover h-11 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
              Iniciar Sesión
            </button>
            <div className="flex justify-between items-center text-sm mt-2">
               <a href="#" className="text-primary hover:text-primary-hover font-medium">¿Olvidaste tu contraseña?</a>
               <button onClick={onRegister} className="text-text-muted hover:text-white transition-colors">Crear cuenta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterView = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-md space-y-8 bg-background-card p-8 rounded-2xl border border-border-dark shadow-2xl">
        <div className="text-center">
            <div className="flex justify-center mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                    <Monitor className="w-7 h-7 text-white" />
                </div>
            </div>
          <h1 className="text-3xl font-bold">Crear Cuenta</h1>
          <p className="text-text-muted mt-2">Empieza a monitorear tus sistemas hoy.</p>
        </div>
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-muted">Nombre de usuario</label>
            <input type="text" placeholder="juanperez" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-muted">Correo electrónico</label>
            <input type="email" placeholder="tu@email.com" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-muted">Contraseña</label>
            <input type="password" placeholder="••••••••" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all" />
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary-hover h-11 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all mt-2 active:scale-[0.98]">
            Registrarse
          </button>
        </form>
        <div className="text-center text-sm text-text-muted">
          ¿Ya tienes cuenta? <button onClick={onLogin} className="text-primary font-medium hover:underline">Inicia sesión</button>
        </div>
      </div>
    </div>
  );
}

const Sidebar = ({ view, setView, isDesktopOpen, setIsDesktopOpen }: { view: ViewState, setView: (v: ViewState) => void, isDesktopOpen: boolean, setIsDesktopOpen: (v: boolean) => void }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavItem = ({ target, icon: Icon, label }: { target: ViewState, icon: any, label: string }) => {
    const isActive = view === target;
    return (
      <button 
        onClick={() => { setView(target); setIsMobileOpen(false); }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 group relative ${isActive ? 'bg-primary text-white font-medium shadow-md shadow-primary/10' : 'text-text-muted hover:bg-background-hover hover:text-white'}`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-muted group-hover:text-white'}`} />
        <span className="text-sm">{label}</span>
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full hidden"></div>}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Header - Fixed */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background-surface border-b border-border-dark">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)} 
            className="p-2.5 bg-background-card rounded-lg border border-border-dark text-white shadow-lg active:scale-95 transition-transform"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-cover bg-center ring-2 ring-border-dark" style={{ backgroundImage: `url(${IMAGES.userAvatar})` }}></div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <h1 className="text-white font-semibold text-xs truncate">Admin User</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Toggle */}
      <div className="hidden lg:block fixed top-4 z-50 transition-all duration-300" style={{ left: isDesktopOpen ? '240px' : '16px' }}>
        <button 
          onClick={() => setIsDesktopOpen(!isDesktopOpen)} 
          className="p-2.5 bg-background-card rounded-lg border border-border-dark text-white shadow-lg hover:bg-background-hover active:scale-95 transition-all"
        >
          {isDesktopOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside className={`fixed z-40 w-64 bg-background-surface border-r border-border-dark transform transition-transform duration-300 ease-in-out top-[73px] bottom-0 lg:top-0 lg:bottom-0 ${isDesktopOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-8">
            {/* User Profile - only visible on desktop */}
            <div className="hidden lg:flex items-center gap-3 px-2 pt-2">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-cover bg-center ring-2 ring-border-dark" style={{ backgroundImage: `url(${IMAGES.userAvatar})` }}></div>
              <div className="flex flex-col overflow-hidden min-w-0">
                <h1 className="text-white font-semibold text-sm truncate">Admin User</h1>
                <p className="text-text-muted text-xs truncate">admin@systemwatch.pro</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Main</p>
              <NavItem target="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem target="reports" icon={BarChart} label="Reports" />
              <NavItem target="system-detail" icon={Monitor} label="System Detail" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Management</p>
              <NavItem target="team" icon={Users} label="Team" />
              <NavItem target="settings" icon={Settings} label="Settings" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1 pt-4 border-t border-border-dark">
            <button onClick={() => setView('login')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-background-hover hover:text-white w-full transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isMobileOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>}
    </>
  );
};

const DashboardView = ({ setView }: { setView: (v: ViewState) => void }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard General</h1>
          <p className="text-text-muted mt-1">Overview of all monitored systems.</p>
        </div>
        <button onClick={() => setView('add-system')} className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-4 h-11 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> <span>Add System</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Systems', value: '12', color: 'text-white' },
          { label: 'Systems Online', value: '11', color: 'text-status-success' },
          { label: 'Systems with Alerts', value: '1', color: 'text-status-warning' },
        ].map((stat, i) => (
          <div key={i} className="bg-background-card border border-border-dark rounded-xl p-6 hover:border-primary/50 transition-colors">
            <p className="text-text-muted font-medium text-sm uppercase tracking-wider mb-2">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-grow relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
          <input type="text" placeholder="Filter by name or URL..." className="w-full bg-background-input border border-border-dark text-white pl-10 pr-4 h-11 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-500" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {['All', 'Up', 'Down', 'Warning'].map((filter, i) => (
            <button key={filter} className={`px-4 h-11 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-primary text-white shadow-md shadow-primary/10' : 'bg-background-hover text-text-muted hover:text-white hover:bg-border-dark'}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SYSTEMS_MOCK.map((system) => (
          <div key={system.id} className="bg-background-card border border-border-dark rounded-xl p-6 hover:border-primary transition-all group cursor-pointer relative overflow-hidden" onClick={() => setView('system-detail')}>
            <div className="flex justify-between items-start mb-4">
              <StatusBadge status={system.status} />
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <button className="p-1.5 hover:bg-background-hover rounded-md text-text-muted hover:text-white transition-colors">
                    {system.status === 'DOWN' ? <PlayCircle className="w-5 h-5"/> : <PauseCircle className="w-5 h-5"/>}
                </button>
                <button className="p-1.5 hover:bg-background-hover rounded-md text-text-muted hover:text-white transition-colors"><Edit className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{system.name}</h3>
                <p className="text-text-muted text-sm truncate">{system.url}</p>
            </div>
            <div className="border-t border-border-dark pt-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Uptime</span>
                <span className="font-medium text-white bg-background-hover px-2 py-0.5 rounded">{system.uptime}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Response Time</span>
                <span className="font-medium text-white">{system.responseTime ? `${system.responseTime}ms` : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Last Checked</span>
                <span className="font-medium text-white">{system.lastChecked}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemDetailView = () => {
    // Generate mock heatmap data for 7 days
    const generateHeatmapData = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = new Date();
        const data = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i)); // Past 6 days + today
            const dayName = days[d.getDay()];
            const hours = [];
            for (let h = 0; h < 24; h++) {
                const rand = Math.random();
                let ms = Math.floor(Math.random() * 150) + 20; // Default normal
                let status: 'normal' | 'slow' | 'critical' = 'normal';
                
                if (rand > 0.96) {
                    ms = Math.floor(Math.random() * 1000) + 500;
                    status = 'critical';
                } else if (rand > 0.85) {
                    ms = Math.floor(Math.random() * 300) + 200;
                    status = 'slow';
                }
                
                hours.push({ hour: h, ms, status });
            }
            data.push({ day: dayName, date: d.toLocaleDateString(), hours });
        }
        return data;
    };
    
    // We use a state/memo in real app, but here constant execution is fine for mock
    const heatmapData = generateHeatmapData();

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-8">
       <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
            <span className="hover:text-white cursor-pointer">Systems</span> 
            <ChevronRight className="w-4 h-4"/> 
            <span className="text-white">Main API</span>
        </div>
        <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Main API</h1>
                <p className="text-text-muted mt-1">Detailed monitoring metrics and performance history.</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-text-muted hidden sm:block">Updated: 32s ago</span>
                <button className="flex items-center gap-2 bg-background-hover hover:bg-border-dark text-white px-4 h-10 rounded-lg font-medium transition-colors border border-border-dark">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>
        </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background-card border border-border-dark p-6 rounded-xl">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Current Status</p>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-3 h-3 rounded-full bg-status-success animate-pulse"></div>
                    <span className="text-2xl font-bold text-white">UP</span>
                </div>
                <p className="text-xs text-text-muted">For 18 hours</p>
            </div>
            <div className="bg-background-card border border-border-dark p-6 rounded-xl">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Availability (24h)</p>
                <span className="text-2xl font-bold text-white">99.98%</span>
                <div className="flex items-center gap-1 text-status-success text-sm font-medium mt-1">
                    <ArrowUp className="w-4 h-4" /> +0.02%
                </div>
            </div>
            <div className="bg-background-card border border-border-dark p-6 rounded-xl">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">Avg Response</p>
                <span className="text-2xl font-bold text-white">120ms</span>
                <div className="flex items-center gap-1 text-status-success text-sm font-medium mt-1">
                    <ArrowDown className="w-4 h-4" /> -5.2%
                </div>
            </div>
            <div className="bg-background-card border border-border-dark p-6 rounded-xl">
                <p className="text-text-muted text-sm font-medium uppercase tracking-wider mb-2">CPU Peak (24h)</p>
                <span className="text-2xl font-bold text-white">85%</span>
                <p className="text-xs text-text-muted mt-1">Memory Peak: 72%</p>
            </div>
       </div>

       <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Status History (24 Hours)</h2>
            <div className="bg-background-card border border-border-dark p-6 rounded-xl">
                <div className="h-8 w-full rounded-lg overflow-hidden flex shadow-inner bg-background-input">
                    <div className="bg-status-success w-[50%] h-full hover:opacity-90 transition-opacity" title="UP"></div>
                    <div className="bg-status-warning w-[5%] h-full hover:opacity-90 transition-opacity" title="DEGRADED"></div>
                    <div className="bg-status-danger w-[2%] h-full hover:opacity-90 transition-opacity" title="DOWN"></div>
                    <div className="bg-status-success w-[43%] h-full hover:opacity-90 transition-opacity" title="UP"></div>
                </div>
                <div className="flex justify-between text-xs text-text-muted mt-3 font-medium">
                    <span>24h ago</span>
                    <span>12h ago</span>
                    <span>Now</span>
                </div>
                <div className="flex gap-6 mt-6 text-sm border-t border-border-dark pt-4">
                    {['UP', 'DOWN', 'DEGRADED'].map(status => (
                        <div key={status} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${status === 'UP' ? 'bg-status-success' : status === 'DOWN' ? 'bg-status-danger' : 'bg-status-warning'}`}></div>
                            <span className="text-text-muted font-medium">{status}</span>
                        </div>
                    ))}
                </div>
            </div>
       </div>

        {/* 7-DAY HEATMAP REPLACEMENT */}
       <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                <h2 className="text-xl font-bold text-white">Response Time History (Last 7 Days)</h2>
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <div className="w-3 h-3 rounded-sm bg-status-success"></div> Normal
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <div className="w-3 h-3 rounded-sm bg-status-warning"></div> Slow
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                        <div className="w-3 h-3 rounded-sm bg-status-danger"></div> Critical
                    </div>
                </div>
            </div>
            
            <div className="bg-background-card border border-border-dark p-6 rounded-xl overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Header Hours */}
                    <div className="flex mb-2">
                         <div className="w-16 shrink-0"></div>
                         <div className="flex flex-1 justify-between px-1">
                             {[0, 6, 12, 18, 23].map(h => (
                                 <span key={h} className="text-xs text-text-muted font-medium w-6 text-center">{h}:00</span>
                             ))}
                         </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        {heatmapData.map((day, dIndex) => (
                            <div key={dIndex} className="flex items-center gap-2">
                                <div className="w-16 shrink-0 text-xs font-medium text-text-muted truncate text-right pr-2">
                                    {day.day.slice(0, 3)}
                                </div>
                                <div className="flex-1 flex gap-1">
                                    {day.hours.map((hour, hIndex) => (
                                        <div 
                                            key={hIndex}
                                            className={`
                                                flex-1 h-6 min-w-[10px] rounded-sm transition-all hover:ring-1 hover:ring-white/50 cursor-pointer relative group
                                                ${hour.status === 'normal' ? 'bg-status-success/80 hover:bg-status-success' : 
                                                  hour.status === 'slow' ? 'bg-status-warning hover:bg-status-warning/90' : 'bg-status-danger hover:bg-status-danger/90'}
                                            `}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                                                <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-3 border border-gray-700 shadow-xl whitespace-nowrap">
                                                    <p className="font-bold mb-0.5">{day.date} • {hour.hour}:00</p>
                                                    <p className={`capitalize ${hour.status === 'normal' ? 'text-green-400' : hour.status === 'slow' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {hour.status} • {hour.ms}ms
                                                    </p>
                                                </div>
                                                <div className="w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
       </div>

       <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-background-card border border-border-dark p-6 rounded-xl h-[400px]">
                <h3 className="mb-6 font-bold text-text-muted uppercase text-sm tracking-wider">Response Time (ms)</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={CHART_DATA_RESPONSE}>
                        <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#135bec" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#135bec" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#232f48" vertical={false} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#181F2D', border: '1px solid #324467', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                            itemStyle={{color: '#fff'}} 
                        />
                        <Area type="monotone" dataKey="value" stroke="#135bec" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-background-card border border-border-dark p-6 rounded-xl h-[400px]">
                <h3 className="mb-6 font-bold text-text-muted uppercase text-sm tracking-wider">CPU Usage (%)</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={CHART_DATA_CPU}>
                        <XAxis dataKey="time" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#232f48" vertical={false} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#181F2D', border: '1px solid #324467', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                            itemStyle={{color: '#fff'}} 
                        />
                        <Line type="monotone" dataKey="value" stroke="#dc3545" strokeWidth={2} dot={false} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
       </div>
    </div>
  );
};

const AddSystemView = ({ onCancel }: { onCancel: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Add New System</h1>
        <div className="bg-background-card border border-border-dark rounded-xl p-8 space-y-8 shadow-xl">
            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-border-dark">
                    <Monitor className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-semibold text-white">System Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-text-muted">System Name</span>
                        <input type="text" placeholder="e.g. Production API" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder-gray-500" />
                        <span className="text-xs text-text-muted">Descriptive alias for identification.</span>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-text-muted">URL to Monitor</span>
                        <input type="text" placeholder="https://example.com" className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 text-white focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all placeholder-gray-500" />
                        <span className="text-xs text-text-muted">Full URL endpoint to check.</span>
                    </label>
                </div>
            </div>

            <div className="space-y-6">
                 <div className="flex items-center gap-3 pb-2 border-b border-border-dark">
                    <Settings className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-semibold text-white">Monitoring Configuration</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-text-muted">Interval</span>
                        <div className="flex bg-background-input p-1.5 rounded-lg border border-border-dark">
                            {['1 min', '3 min', '5 min'].map((opt, i) => (
                                <button key={opt} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${i===1 ? 'bg-background-card text-white shadow ring-1 ring-border-dark' : 'text-text-muted hover:text-white'}`}>{opt}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-text-muted">Internal Network</span>
                        <label className="flex items-center cursor-pointer h-11 p-3 border border-border-dark rounded-lg bg-background-input hover:border-primary/50 transition-colors">
                             <div className="relative">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-300">Enable internal monitoring</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border-dark">
                <button onClick={onCancel} className="px-6 h-11 rounded-lg border border-border-dark hover:bg-background-hover text-text-muted hover:text-white transition-colors font-medium">Cancel</button>
                <button onClick={onCancel} className="px-6 h-11 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95">Add System</button>
            </div>
        </div>
    </div>
  );
};

const SettingsView = () => {
    const ChannelCard = ({ name, desc, logo, beta, defaultChecked }: any) => (
        <div className="bg-background-card border border-border-dark rounded-xl p-6 flex items-center gap-5 hover:border-primary/50 transition-colors group">
            <div className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0 shadow-md ring-1 ring-border-dark" style={{backgroundImage: `url(${logo})`}}></div>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">{name}</h3>
                    {beta && <span className="bg-yellow-900/40 text-yellow-200 border border-yellow-700/50 text-xs px-2 py-0.5 rounded-full font-medium">Beta</span>}
                </div>
                <p className="text-sm text-text-muted mt-0.5">{desc}</p>
            </div>
            <div className="relative">
                <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary cursor-pointer"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-white">Notification Settings</h1>
                <p className="text-text-muted">Connect preferred channels for real-time alerts.</p>
            </div>
            <div className="space-y-4">
                <ChannelCard name="Slack" desc="Instant notifications in your Slack channels." logo={IMAGES.slack} defaultChecked={true} />
                <ChannelCard name="Telegram" desc="Send alerts directly to a bot or channel." logo={IMAGES.telegram} defaultChecked={false} />
                <ChannelCard name="WhatsApp" desc="Connect with WhatsApp API for alert messages." logo={IMAGES.whatsapp} beta={true} defaultChecked={false} />
            </div>
            <div className="mt-8 flex justify-end border-t border-border-dark pt-6">
                <button className="bg-primary hover:bg-primary-hover px-6 h-11 rounded-lg font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95">Save Changes</button>
            </div>
        </div>
    );
};

const TeamView = () => {
    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-white">Team Management</h1>
                <p className="text-text-muted">Invite, manage roles, and remove team members.</p>
            </div>
            
            <div className="bg-background-card border border-border-dark rounded-xl p-4 mb-6 flex flex-wrap gap-4 justify-between items-center shadow-sm">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5"/>
                        <input type="text" placeholder="Search by name or email..." className="w-full bg-background-input border border-border-dark rounded-lg pl-10 pr-4 h-11 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-white placeholder-gray-500 transition-all" />
                    </div>
                    <div className="relative hidden sm:block">
                        <select className="bg-background-input border border-border-dark rounded-lg px-4 h-11 appearance-none pr-10 focus:outline-none focus:ring-1 focus:ring-primary text-text-muted hover:text-white cursor-pointer transition-colors">
                            <option>Filter by Role</option>
                            <option>Admin</option>
                            <option>Member</option>
                            <option>Viewer</option>
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white px-5 h-11 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95">
                    <Plus className="w-5 h-5"/> Invite User
                </button>
            </div>

            <div className="bg-background-card border border-border-dark rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-background-surface border-b border-border-dark">
                            <tr>
                                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded bg-background-input border-gray-600 text-primary focus:ring-0 cursor-pointer" /></th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Join Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {TEAM_MOCK.map(member => (
                                <tr key={member.id} className="hover:bg-background-hover/50 transition-colors group">
                                    <td className="px-6 py-4"><input type="checkbox" className="rounded bg-background-input border-gray-600 text-primary focus:ring-0 cursor-pointer" /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full ring-2 ring-border-dark group-hover:ring-primary/50 transition-all" />
                                            <div>
                                                <div className="font-medium text-white">{member.name}</div>
                                                <div className="text-sm text-text-muted">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                            member.role === 'Admin' ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700/50' :
                                            member.role === 'Member' ? 'bg-sky-900/30 text-sky-300 border-sky-700/50' :
                                            'bg-gray-800 text-gray-300 border-gray-600'
                                        }`}>{member.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted text-sm">{member.joinDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1.5 ${
                                            member.status === 'Active' ? 'bg-status-success/10 text-status-success' : 'bg-status-warning/10 text-status-warning'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-status-success' : 'bg-status-warning'}`}></div>
                                            {member.status === 'Pending' ? 'Invite Pending' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-text-muted hover:text-white p-1 rounded hover:bg-background-hover transition-colors"><MoreVertical className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 px-4">
                <p className="text-sm text-text-muted">Showing 1 to 4 of 97 results</p>
                <div className="flex gap-1">
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background-hover text-text-muted transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary text-white font-bold shadow-md shadow-primary/20">1</button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background-hover text-text-muted transition-colors">2</button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background-hover text-text-muted transition-colors">3</button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-background-hover text-text-muted transition-colors"><ChevronRight className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    );
}

const ReportsView = () => {
    return (
        <div className="flex h-full overflow-hidden">
             {/* Main Content Area */}
             <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
                <header className="p-6 lg:p-8 border-b border-border-dark sticky top-0 bg-background/90 backdrop-blur z-10 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">Advanced Reports</h1>
                    <button className="lg:hidden text-text-muted"><Menu /></button>
                </header>
                <div className="flex-1 p-6 lg:p-8 flex items-center justify-center min-h-[500px]">
                    <div className="text-center p-12 bg-background-card border border-border-dark rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="w-20 h-20 bg-background-hover rounded-full flex items-center justify-center mx-auto mb-6">
                            <BarChart className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white">Generate your first report</h2>
                        <p className="text-text-muted mb-8">Select filters from the configuration panel on the right and press "Generate Report" to visualize data.</p>
                        <button className="w-full bg-background-hover hover:bg-border-dark text-white font-medium py-3 rounded-lg transition-colors border border-border-dark">View Documentation</button>
                    </div>
                </div>
             </div>

             {/* Right Sidebar */}
             <div className="w-80 bg-background-surface border-l border-border-dark p-6 flex flex-col h-full overflow-y-auto shrink-0 hidden lg:flex shadow-2xl">
                <h3 className="font-bold text-lg mb-6 text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Report Config
                </h3>
                <div className="space-y-8 flex-1">
                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Date Range</label>
                        <div className="bg-background-card border border-border-dark rounded-xl p-4 shadow-inner">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border-dark">
                                <button className="hover:text-white text-text-muted transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                                <span className="font-bold text-white">December 2023</span>
                                <button className="hover:text-white text-text-muted transition-colors"><ChevronRight className="w-5 h-5"/></button>
                            </div>
                            <div className="grid grid-cols-7 text-center text-xs text-text-muted mb-2 gap-y-3 font-medium">
                                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                {/* Mock Calendar Days */}
                                {Array.from({length: 31}).map((_, i) => (
                                    <button key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${i === 4 || i === 10 ? 'bg-primary text-white font-bold shadow-lg shadow-primary/30' : (i > 4 && i < 10) ? 'bg-primary/10 text-primary' : 'hover:bg-background-hover text-gray-400 hover:text-white'}`}>
                                        {i+1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Target System</label>
                         <div className="relative">
                            <select className="w-full bg-background-input border border-border-dark rounded-lg h-11 px-4 focus:ring-1 focus:ring-primary focus:outline-none text-white appearance-none cursor-pointer hover:border-primary/50 transition-colors">
                                <option>All Systems</option>
                                <option>Main API</option>
                                <option>Corporate Website</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none w-4 h-4" />
                         </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">Metrics</label>
                        <div className="space-y-2.5">
                            {['Availability', 'Response Time', 'Resource Usage (CPU/Mem)'].map((m, i) => (
                                <label key={i} className="flex items-center gap-3 p-3.5 bg-background-input border border-border-dark rounded-lg cursor-pointer hover:border-primary/50 transition-all group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" defaultChecked={i < 2} className="peer sr-only" />
                                        <div className="w-5 h-5 border-2 border-gray-600 rounded bg-background transition-colors peer-checked:bg-primary peer-checked:border-primary"></div>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-auto">
                    <button className="w-full bg-primary hover:bg-primary-hover py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 text-white">
                        <BarChart className="w-5 h-5" /> Generate Report
                    </button>
                </div>
             </div>
        </div>
    );
};

// --- HELPERS ---

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
)

// --- MAIN APP COMPONENT ---

function App() {
  const [view, setView] = useState<ViewState>('login');
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // Handle simple auth simulation
  const handleLogin = () => setView('dashboard');
  
  if (view === 'login') return <LoginView onLogin={handleLogin} onRegister={() => setView('register')} />;
  if (view === 'register') return <RegisterView onLogin={() => setView('login')} />;

  return (
    <div className="flex h-screen bg-background text-text-main font-sans overflow-hidden selection:bg-primary/30 selection:text-white">
      <Sidebar view={view} setView={setView} isDesktopOpen={isDesktopSidebarOpen} setIsDesktopOpen={setIsDesktopSidebarOpen} />
      {/* 
          Main Layout: 
          - No padding on 'main' element to allow full-bleed views like ReportsView.
          - Individual views (Dashboard, etc.) handle their own padding.
          - Desktop sidebar is collapsible, main adjusts accordingly
          - Mobile: main has top padding to account for fixed header
      */}
      <main className={`flex-1 overflow-y-auto h-full relative scroll-smooth transition-all duration-300 pt-[73px] lg:pt-0 ${isDesktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {view === 'dashboard' && <DashboardView setView={setView} />}
        {view === 'system-detail' && <SystemDetailView />}
        {view === 'add-system' && <AddSystemView onCancel={() => setView('dashboard')} />}
        {view === 'settings' && <SettingsView />}
        {view === 'team' && <TeamView />}
        {view === 'reports' && <ReportsView />}
      </main>
    </div>
  );
}

export default App;
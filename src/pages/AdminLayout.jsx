import { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { LayoutDashboard, Upload, LogOut, ShieldAlert } from 'lucide-react';

export default function AdminLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Premium Dark Sidebar */}
      <div className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl relative z-20">
        <div className="h-20 flex items-center px-8 border-b border-white/10 bg-slate-950/50">
          <ShieldAlert className="text-blue-500 mr-3" size={28} />
          <h1 className="text-2xl font-bold text-white font-display tracking-wide">MCDSS</h1>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</p>
          
          <Link 
            to="/admin/dashboard" 
            className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
              location.pathname === '/admin/dashboard' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard size={22} className={location.pathname === '/admin/dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Overview</span>
          </Link>
          
          <div className="pt-4 pb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Data Tables</p>
          </div>

          {[
            { path: 'universities', label: 'Universities' },
            { path: 'program_options', label: 'Program Options' },
            { path: 'country_recognitions', label: 'Recognitions' },
            { path: 'student_leads', label: 'Student Leads' }
          ].map((item) => (
            <Link 
              key={item.path}
              to={`/admin/data/${item.path}`}
              className={`flex items-center space-x-4 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                location.pathname === `/admin/data/${item.path}`
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === `/admin/data/${item.path}` ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-slate-600'}`}></div>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}

          <div className="pt-4 pb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">System</p>
          </div>

          <Link 
            to="/admin/import" 
            className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
              location.pathname === '/admin/import' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Upload size={22} className={location.pathname === '/admin/import' ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
            <span className="font-medium">Data Import</span>
          </Link>
        </nav>
        
        <div className="p-6 border-t border-white/10 bg-slate-950/30">
          <div className="flex items-center mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {session.user.email[0].toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{session.user.email}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 text-slate-400 w-full px-4 py-3 rounded-xl hover:bg-white/10 hover:text-red-400 transition-all group"
          >
            <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
            <span className="font-medium">Secure Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 z-10 sticky top-0">
          <h2 className="text-xl font-bold text-slate-800 font-display capitalize">
            {location.pathname.split('/').pop()}
          </h2>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              System Online
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

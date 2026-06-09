import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Building2, BookOpen, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ universities: 0, programs: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { count: uniCount } = await supabase.from('universities').select('*', { count: 'exact', head: true });
      const { count: progCount } = await supabase.from('program_options').select('*', { count: 'exact', head: true });
      const { count: leadCount } = await supabase.from('student_leads').select('*', { count: 'exact', head: true });
      
      setStats({
        universities: uniCount || 0,
        programs: progCount || 0,
        leads: leadCount || 0
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-pulse h-40"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-display">System Overview</h2>
          <p className="text-slate-500 mt-2">Real-time metrics for your decision support system.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Universities Stat Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-50 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Universities</h3>
              <p className="text-5xl font-extrabold text-slate-900 font-display">{stats.universities}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-2xl text-blue-600">
              <Building2 size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm text-green-600 font-medium">
            <TrendingUp size={16} className="mr-1" /> Configured & Ready
          </div>
        </div>

        {/* Programs Stat Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-indigo-50 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Program Options</h3>
              <p className="text-5xl font-extrabold text-slate-900 font-display">{stats.programs}</p>
            </div>
            <div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600">
              <BookOpen size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm text-indigo-600 font-medium">
            Database Populated
          </div>
        </div>

        {/* Leads Stat Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-emerald-50 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Student Leads</h3>
              <p className="text-5xl font-extrabold text-slate-900 font-display">{stats.leads}</p>
            </div>
            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
              <Users size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center text-sm text-emerald-600 font-medium">
            Captured Recommendations
          </div>
        </div>

      </div>
    </div>
  );
}

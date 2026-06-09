import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ArrowRight, Sparkles, GraduationCap, MapPin, Search, ChevronLeft, Award } from 'lucide-react';

export default function StudentApp() {
  const [formData, setFormData] = useState({
    email: '',
    country: 'Iraq',
    desired_program: '',
    budget: 5000,
    language_preference: 'English',
    priority_profile: 'Balanced Option'
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);

  useEffect(() => {
    async function fetchPrograms() {
      const { data, error } = await supabase.from('program_options').select('program_name');
      if (data && !error) {
        const uniquePrograms = [...new Set(data.map(p => p.program_name))].sort();
        setAvailablePrograms(uniquePrograms);
      }
    }
    fetchPrograms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('recommendation_engine', {
        body: formData
      });

      if (error) throw error;
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const isOther = formData.country === 'Other';

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col justify-center">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-6 border border-blue-50">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight font-display mb-4">
            Find Your <span className="text-gradient">Perfect Path</span>
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto font-light">
            Multi-criteria university recommendations tailored to your budget, language, recognition, and ranking preferences.
          </p>
        </div>

        {!results ? (
          <div className="glass-panel rounded-3xl p-8 md:p-12 transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                     Email Address
                  </label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="student@example.com" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" /> Home Country
                  </label>
                  <select value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer">
                    <option value="Iraq">Iraq</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Search size={16} className="text-blue-500" /> Desired Program
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.desired_program} 
                    onChange={e => {
                      setFormData({...formData, desired_program: e.target.value});
                      setShowProgramDropdown(true);
                    }}
                    onFocus={() => setShowProgramDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProgramDropdown(false), 200)}
                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all relative z-20" 
                    placeholder="e.g. Computer Engineering" 
                  />
                  {/* Custom Autocomplete Dropdown */}
                  {showProgramDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto top-[76px]">
                      {availablePrograms
                        .filter(p => p.toLowerCase().includes(formData.desired_program.toLowerCase()))
                        .map(p => (
                          <div 
                            key={p} 
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-slate-700 font-medium transition-colors border-b border-slate-50 last:border-0"
                            onClick={() => {
                              setFormData({...formData, desired_program: p});
                              setShowProgramDropdown(false);
                            }}
                          >
                            {p}
                          </div>
                      ))}
                      {availablePrograms.filter(p => p.toLowerCase().includes(formData.desired_program.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-slate-500 text-sm">No exact matches found. You can still search for this term.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                     Maximum Tuition Budget (USD)
                  </label>
                  <input type="number" required min="0" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                     Language Preference
                  </label>
                  <select value={formData.language_preference} onChange={e => setFormData({...formData, language_preference: e.target.value})} className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer">
                    <option value="English">English</option>
                    <option value="Turkish">Turkish</option>
                    <option value="No Preference">No Preference</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                     Priority Profile
                  </label>
                  <select value={formData.priority_profile} onChange={e => setFormData({...formData, priority_profile: e.target.value})} className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer">
                    {isOther ? (
                      <>
                        <option value="Balanced Option">Balanced Option</option>
                        <option value="Affordable Option">Affordable Option</option>
                        <option value="Ranked Option">Ranked Option</option>
                      </>
                    ) : (
                      <>
                        <option value="Balanced Option">Balanced Option</option>
                        <option value="Affordable Option">Affordable Option</option>
                        <option value="Recognized & Ranked Option">Recognized & Ranked Option</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {error && <div className="p-4 bg-red-50/80 text-red-700 rounded-xl border border-red-200 backdrop-blur-sm">{error}</div>}

              <button type="submit" disabled={loading} className="w-full group relative flex justify-center items-center gap-3 py-4 px-4 rounded-xl shadow-lg shadow-blue-500/30 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing Options...
                  </span>
                ) : (
                  <>
                    Get Recommendations
                    <Sparkles className="w-5 h-5 group-hover:text-yellow-200 transition-colors" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <button onClick={() => setResults(null)} className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200 hover:bg-white">
              <ChevronLeft size={18} /> Start Over
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-100 group relative flex flex-col">
                  {/* Card Header Tag */}
                  <div className={`p-4 flex items-center justify-between ${idx === 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-b border-slate-100 text-slate-800'}`}>
                    <h3 className="font-bold text-lg font-display flex items-center gap-2">
                      {idx === 0 && <Award size={20} className="text-yellow-300" />}
                      {result.label}
                    </h3>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${idx === 0 ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                      {result.scores.finalScore.toFixed(1)}% Match
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-6">
                      <h4 className="text-2xl font-bold text-slate-900 font-display leading-tight">{result.university.name}</h4>
                      <p className="text-blue-600 font-semibold mt-1 flex items-center gap-2">
                        {result.program.program_name} 
                        <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-700 border border-blue-100">{result.program.language}</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm mt-auto">
                      <div>
                        <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Tuition (Cash)</span>
                        <span className="font-bold text-slate-900 text-lg">${result.program.cash_payment_tuition_usd}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Webometrics</span>
                        <span className="font-bold text-slate-900">{result.university.webometrics_rank}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Ranking Tier</span>
                        <span className="font-medium inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200">
                          {result.university.ranking_tier}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Recognition</span>
                        {result.recognition_status === 'needs_manual_verification' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            Needs Verification
                          </span>
                        ) : result.recognition_status === 'N/A' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                            N/A
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 capitalize">
                            {result.recognition_status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <details className="group mt-6 border-t border-slate-100 pt-4">
                      <summary className="text-sm font-semibold text-blue-600 cursor-pointer list-none flex items-center gap-1 hover:text-blue-700 transition-colors">
                        View Score Breakdown
                        <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </summary>
                      <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-mono space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Budget Score</span> <span className="font-medium text-slate-700">{result.scores.budgetScore.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Language Score</span> <span className="font-medium text-slate-700">{result.scores.langScore.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Recognition Score</span> <span className="font-medium text-slate-700">{result.scores.recogScore === 'N/A' ? 'N/A' : result.scores.recogScore.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Ranking Score</span> <span className="font-medium text-slate-700">{result.scores.rankScore.toFixed(1)}</span></div>
                        <div className="border-t border-slate-200 my-2 pt-2 flex justify-between font-bold text-slate-700">
                          <span>Applied Weights</span>
                          <span>B:{result.scores.weights?.w_budget} L:{result.scores.weights?.w_lang} Rec:{result.scores.weights?.w_recog} Rnk:{result.scores.weights?.w_rank}</span>
                        </div>
                        <div className="flex justify-between font-extrabold text-blue-700 mt-1">
                          <span>Final Score</span>
                          <span>{result.scores.finalScore.toFixed(1)}%</span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
              <p className="text-sm text-slate-500 font-medium">
                Note: Recommendations are decision-support results and should be verified with official university and recognition sources before final registration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

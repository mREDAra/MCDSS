import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../services/supabase';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ImportTool() {
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('universities');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const normalizeUniversityName = (name) => {
    if (!name) return '';
    let n = name.toLowerCase();
    const charMap = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'c': 'c', 'g': 'g', 'i': 'i', 'o': 'o', 's': 's', 'u': 'u'
    };
    n = n.replace(/[çğıöşü]/g, match => charMap[match]);
    n = n.replace('university', '').replace('universitesi', '');
    return n.replace(/[^a-z]/g, '');
  };

  const cleanTuition = (val) => {
    if (!val) return 0;
    const cleaned = String(val).replace(/USD/g, '').replace(/,/g, '').trim();
    return parseFloat(cleaned) || 0;
  };

  const normalizeCountry = (country) => {
    const map = {
      'KSA': 'Saudi Arabia',
      'IQ': 'Iraq',
      'JO': 'Jordan'
    };
    return map[country] || country;
  };

  const cleanLanguage = (lang) => {
    if (!lang) return 'English';
    const l = lang.trim();
    return l; 
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data;
          let successCount = 0;

          if (importType === 'universities') {
            const { error } = await supabase.from('universities').insert(data);
            if (error) throw error;
            successCount = data.length;
          } 
          else if (importType === 'program_options') {
            const { data: unis, error: uniError } = await supabase.from('universities').select('id, name');
            if (uniError) throw uniError;

            const uniMap = {};
            unis.forEach(u => {
              uniMap[normalizeUniversityName(u.name)] = u.id;
            });

            const programsToInsert = data.map(row => {
              const uName = normalizeUniversityName(row.university_name || '');
              const uniId = uniMap[uName];
              
              if (!uniId) {
                console.warn(`Could not find university for: ${row.university_name}`);
                return null;
              }

              return {
                university_id: uniId,
                program_name: row.program_name?.trim() || 'Unknown Program',
                language: cleanLanguage(row.language),
                tuition_before_discount_usd: cleanTuition(row.tuition_before_discount_usd),
                tuition_after_discount_usd: cleanTuition(row.tuition_after_discount_usd),
                cash_payment_tuition_usd: cleanTuition(row.cash_payment_tuition_usd)
              };
            }).filter(p => p !== null);

            if (programsToInsert.length > 0) {
              const { error } = await supabase.from('program_options').insert(programsToInsert);
              if (error) throw error;
              successCount = programsToInsert.length;
            }
          }
          else if (importType === 'country_recognitions') {
            const { data: unis, error: uniError } = await supabase.from('universities').select('id, name');
            if (uniError) throw uniError;

            const uniMap = {};
            unis.forEach(u => {
              uniMap[normalizeUniversityName(u.name)] = u.id;
            });

            const recognitionsToInsert = data.map(row => {
              const uName = normalizeUniversityName(row.university_name || '');
              const uniId = uniMap[uName];
              
              if (!uniId) return null;

              return {
                university_id: uniId,
                country_name: normalizeCountry(row.country),
                recognition_status: row.recognition_status,
                official_source_url: row.official_source_url
              };
            }).filter(r => r !== null);

            if (recognitionsToInsert.length > 0) {
              const { error } = await supabase.from('country_recognitions').insert(recognitionsToInsert);
              if (error) throw error;
              successCount = recognitionsToInsert.length;
            }
          }

          setMessage({ type: 'success', text: `Successfully processed and imported ${successCount} records.` });
        } catch (err) {
          console.error(err);
          setMessage({ type: 'error', text: err.message || 'Error importing data.' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 font-display">Data Integration Hub</h2>
        <p className="text-slate-500 mt-2">Upload your Google Sheets CSV files to populate the decision support database.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        
        {/* Header Area */}
        <div className="bg-slate-50 border-b border-slate-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">CSV Import Tool</h3>
              <p className="text-sm text-slate-500">Automatic mapping & normalization</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {message && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'} animate-in fade-in zoom-in-95`}>
              {message.type === 'error' ? <AlertCircle className="mt-0.5 shrink-0" size={20} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">1. Select Target Table</label>
              <div className="relative">
                <select 
                  value={importType} 
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer font-medium text-slate-800"
                >
                  <option value="universities">1. Universities Data</option>
                  <option value="program_options">2. Program Options</option>
                  <option value="country_recognitions">3. Country Recognitions</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <p className="text-xs text-amber-600 font-medium bg-amber-50 inline-block px-3 py-1.5 rounded-lg border border-amber-100 mt-2">
                Note: You MUST import Universities first.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">2. Choose CSV File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="mb-1 text-sm text-slate-500 font-medium">
                      {file ? <span className="text-blue-600 font-bold">{file.name}</span> : <span><span className="text-blue-600 font-bold">Click to browse</span> or drag and drop</span>}
                    </p>
                    <p className="text-xs text-slate-400">CSV files only</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full md:w-auto md:min-w-[240px] group relative flex justify-center items-center gap-2 py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/30 text-white font-bold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing Data...
                </>
              ) : (
                <>
                  Start Import Process
                  <UploadCloud className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

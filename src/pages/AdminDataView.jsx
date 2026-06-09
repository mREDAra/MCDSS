import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Database, Loader2, Copy, Check } from 'lucide-react';

export default function AdminDataView() {
  const { table } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from(table).select('*').limit(100);
        
        // If we need university names instead of just IDs
        if (table === 'program_options' || table === 'country_recognitions') {
          query = supabase.from(table).select('*, universities(name)').limit(100);
        }

        const { data: result, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        let transformedData = (result || []).map(row => {
          const newRow = { ...row };
          
          // Format timestamps to remove milliseconds/timezone (e.g. .452426+00:00)
          if (newRow.created_at) {
            newRow.created_at = newRow.created_at.split('.')[0];
          }

          // Handle table-specific columns formatting
          if (table === 'universities') {
            return {
              name: newRow.name,
              ranking_score: newRow.ranking_score,
              website_url: newRow.website_url,
              rank_source: newRow.rank_source
            };
          }
          else if (table === 'program_options') {
            return {
              university_name: newRow.universities?.name || '',
              program_name: newRow.program_name,
              language: newRow.language,
              tuition_before_discount_usd: newRow.tuition_before_discount_usd,
              tuition_after_discount_usd: newRow.tuition_after_discount_usd,
              cash_payment_tuition_usd: newRow.cash_payment_tuition_usd
            };
          }
          else if (table === 'country_recognitions') {
            return {
              university_name: newRow.universities?.name || '',
              country_name: newRow.country_name,
              recognition_status: newRow.recognition_status,
              official_source_url: newRow.official_source_url
            };
          }
          
          return newRow;
        });
        
        setData(transformedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (table) fetchData();
  }, [table]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatHeader = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderCell = (key, value, rowIdx) => {
    if (value === null || value === undefined) return <span className="text-slate-400 italic">null</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    
    const strVal = String(value);
    const isCopyable = (table === 'universities' && (key === 'website_url' || key === 'rank_source')) || 
                       (table === 'student_leads' && key === 'id');
                       
    if (isCopyable) {
       const cellId = `${rowIdx}-${key}`;
       return (
         <div 
           className="flex items-center gap-2 group cursor-pointer hover:text-blue-600 transition-colors" 
           onClick={() => handleCopy(strVal, cellId)}
           title="Click to copy"
         >
           <span className="truncate max-w-[200px]">{strVal}</span>
           {copiedId === cellId ? (
             <Check size={14} className="text-green-500 shrink-0" />
           ) : (
             <Copy size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
           )}
         </div>
       );
    }
    
    return <span className="truncate block max-w-[300px]" title={strVal}>{strVal}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-blue-600">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-display">
            {table.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </h2>
          <p className="text-slate-500 mt-1">Read-only view of the first 100 records in the database.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100">
          Error loading data: {error}
        </div>
      ) : data.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500">
          No records found in this table.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-6 py-4 font-bold whitespace-nowrap">
                      {formatHeader(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    {Object.entries(row).map(([key, val], colIdx) => (
                      <td key={colIdx} className="px-6 py-4 text-slate-700 font-medium">
                        {renderCell(key, val, idx)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

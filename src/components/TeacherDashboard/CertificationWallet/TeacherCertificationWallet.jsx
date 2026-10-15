import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function TeacherCertificationWallet() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Degree');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [credentialUrl, setCredentialUrl] = useState('');

  // 1. Fetch current teacher and their dynamic certifications from Supabase
  useEffect(() => {
    fetchCertifications();
  }, []);

  async function fetchCertifications() {
    try {
      setLoading(true);

      // Determine logged-in teacher identity
      let teacherId = null;
      let teacherEmail = null;

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        teacherId = authData.user.id;
        teacherEmail = authData.user.email;
      } else {
        const cachedUser = typeof window !== 'undefined' ? 
          JSON.parse(localStorage.getItem('ssgmce_user') || sessionStorage.getItem('ssgmce_user') || '{}') : {};
        teacherId = cachedUser.id || cachedUser.user_id;
        teacherEmail = cachedUser.email;
      }

      let teacherRow = null;
      if (teacherId) {
        const { data: u } = await supabase.from('users').select('*').eq('id', teacherId).maybeSingle();
        teacherRow = u;
      }
      if (!teacherRow && teacherEmail) {
        const { data: u } = await supabase.from('users').select('*').eq('email', teacherEmail).maybeSingle();
        teacherRow = u;
      }
      if (!teacherRow) {
        const { data: anyT } = await supabase.from('users').select('*').eq('role', 'teacher').limit(1).maybeSingle();
        teacherRow = anyT;
      }

      setTeacher(teacherRow);

      if (!teacherRow) {
        setCertifications([]);
        return;
      }

      // Query teacher_certifications strictly for this teacher (enforced by RLS)
      const { data: certs, error: certErr } = await supabase
        .from('teacher_certifications')
        .select('*')
        .eq('teacher_id', teacherRow.id)
        .order('year', { ascending: false });

      if (certErr) throw certErr;

      setCertifications(certs || []);
    } catch (err) {
      console.error('Error fetching teacher certifications:', err);
      showToast(err.message || 'Failed to load certifications.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // 2. Add New Certification to Supabase
  async function handleAddCertification(e) {
    e.preventDefault();

    if (!title.trim() || !issuingOrg.trim() || !year) {
      showToast('Please fill in all required certification fields.', 'warning');
      return;
    }

    if (!teacher?.id) {
      showToast('Authentication error: Teacher profile not found.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        teacher_id: teacher.id,
        title: title.trim(),
        type: type,
        issuing_organization: issuingOrg.trim(),
        year: parseInt(year, 10),
        credential_url: credentialUrl.trim() || null
      };

      const { data: inserted, error: insError } = await supabase
        .from('teacher_certifications')
        .insert([payload])
        .select()
        .single();

      if (insError) throw insError;

      setCertifications(prev => [inserted, ...prev]);
      showToast('Certification added successfully to your wallet.', 'success');
      
      // Reset form
      setTitle('');
      setType('Degree');
      setIssuingOrg('');
      setYear(new Date().getFullYear());
      setCredentialUrl('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding certification:', err);
      showToast('Error saving certification: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // 3. Delete Certification from Supabase
  async function handleDeleteCertification(certId) {
    if (!window.confirm('Are you sure you want to remove this credential from your wallet?')) {
      return;
    }

    try {
      const { error: delError } = await supabase
        .from('teacher_certifications')
        .delete()
        .eq('id', certId)
        .eq('teacher_id', teacher.id); // Enforce ownership

      if (delError) throw delError;

      setCertifications(prev => prev.filter(c => c.id !== certId));
      showToast('Certification removed from wallet.', 'success');
    } catch (err) {
      console.error('Error deleting certification:', err);
      showToast('Could not delete certification: ' + err.message, 'error');
    }
  }

  function showToast(msg, type = 'info') {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  }

  const getTypeBadgeStyle = (t) => {
    switch (t) {
      case 'Degree':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Course':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Research Paper':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Workshop':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toastMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          toastMessage.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-600 tracking-wider">
            Academic Credentials & Verified Accreditations
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Teacher Certification Wallet</h2>
          <p className="text-sm text-slate-500 mt-1">
            Faculty: <span className="font-semibold text-slate-700">{teacher?.full_name || 'Faculty Profile'}</span> &bull; 
            Verified Credentials: <span className="font-semibold text-blue-600">{certifications.length} Registered</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-[#1565C0] hover:bg-[#0B5CAD] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Certification</span>
        </button>
      </div>

      {/* Credentials List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 h-44 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : certifications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 text-slate-300">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No records found</h3>
          <p className="text-sm text-slate-500 mt-1">
            You haven't uploaded any verified certifications to your wallet yet.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Add Your First Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map(cert => (
            <div
              key={cert.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeBadgeStyle(cert.type)}`}>
                    {cert.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Year: {cert.year}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-lg leading-snug">
                  {cert.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {cert.issuing_organization}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                {cert.credential_url ? (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <span>View Credential</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className="text-slate-400">Institutional Archive</span>
                )}

                <button
                  onClick={() => handleDeleteCertification(cert.id)}
                  className="text-red-600 hover:text-red-800 font-semibold p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete Credential"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD CERTIFICATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add Academic Credential</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddCertification} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Credential Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master of Technology in AI, AWS Certified Solutions Architect"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Credential Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Degree">Degree</option>
                    <option value="Course">Course</option>
                    <option value="Research Paper">Research Paper</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Year of Completion *
                  </label>
                  <input
                    type="number"
                    required
                    min="1950"
                    max="2100"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Issuing Organization *
                </label>
                <input
                  type="text"
                  required
                  value={issuingOrg}
                  onChange={(e) => setIssuingOrg(e.target.value)}
                  placeholder="e.g. IIT Bombay, Coursera, IEEE, University"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Credential URL / Certificate Link
                </label>
                <input
                  type="url"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#1565C0] hover:bg-[#0B5CAD] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving to Supabase...' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


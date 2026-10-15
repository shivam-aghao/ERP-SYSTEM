import React, { useState } from 'react';
import { useFacultyInfo } from '../../../context/FacultyInfoContext';

/**
 * YearlyReportTab.jsx
 * Compiles a comprehensive yearly faculty performance, appraisal,
 * and academic activities report ready for HOD, Principal, and NAAC/NBA submission.
 */
export default function YearlyReportTab() {
  const { generateReport } = useFacultyInfo();
  const [selectedYear, setSelectedYear] = useState('2026');
  const [reportData, setReportData] = useState(() => generateReport('2026'));

  const handleGenerate = () => {
    const data = generateReport(selectedYear);
    setReportData(data);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/HTML report download
    const reportHtml = document.getElementById('yearly-report-printable-area')?.innerHTML || '';
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SSGMCE_Faculty_Appraisal_Report_${selectedYear}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0F172A; }
          .report-header { text-align: center; border-bottom: 2px solid #0B1F3A; padding-bottom: 15px; margin-bottom: 20px; }
          .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #E0F2FE; color: #0369A1; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #F8FAFC; }
          h3, h4 { color: #0B1F3A; }
        </style>
      </head>
      <body>
        ${reportHtml}
      </body>
      </html>
    `], { type: 'text/html;charset=utf-8' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SSGMCE_Faculty_Report_${reportData?.faculty?.facultyId || 'Faculty'}_${selectedYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const r = reportData;
  const fac = r?.faculty || {};

  return (
    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
      {/* Top Controls Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '16px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B1F3A' }}>
            Yearly Faculty Appraisal &amp; Performance Report
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
            Auto-compiled institutional record of achievements, sessions, publications, and qualifications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{
                padding: '7px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#0B1F3A',
                background: '#F8FAFC'
              }}
            >
              <option value="2026">2026 (Active Session)</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            style={{
              background: '#0B5CAD',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ⚡ Generate Report
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#F8FAFC',
              color: '#334155',
              border: '1px solid #CBD5E1',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🖨️ Print
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            📥 Download Report
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div
        id="yearly-report-printable-area"
        style={{
          background: '#ffffff',
          border: '1px solid #CBD5E1',
          borderRadius: '10px',
          padding: '36px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          maxWidth: '850px',
          margin: '0 auto'
        }}
      >
        {/* Institutional Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0B1F3A', paddingBottom: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
            Shri Sant Gajanan Maharaj College of Engineering, Shegaon
          </div>
          <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '900', color: '#0B1F3A' }}>
            Faculty Annual Academic Performance &amp; Activity Report
          </h2>
          <div style={{ fontSize: '13px', color: '#0B5CAD', fontWeight: '700' }}>
            Academic Year {r?.academicYear || `${selectedYear}-${Number(selectedYear)+1}`} • Autonomous Curriculum
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
            Compiled on: {r?.generatedAt || new Date().toDateString()}
          </div>
        </div>

        {/* Faculty Identity Details Box */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '12.5px'
        }}>
          <div><strong>Faculty Name:</strong> {fac.name}</div>
          <div><strong>Employee ID:</strong> {fac.facultyId}</div>
          <div><strong>Department:</strong> {fac.department}</div>
          <div><strong>Designation:</strong> {fac.designation}</div>
          <div><strong>Email:</strong> {fac.email}</div>
          <div><strong>Contact:</strong> {fac.phone}</div>
        </div>

        {/* KPI Score Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '26px'
        }}>
          <div style={scoreBoxStyle}>
            <div style={scoreNumStyle}>{r?.statistics?.achievementsCount || 0}</div>
            <div style={scoreLabelStyle}>Awards &amp; Honors</div>
          </div>
          <div style={scoreBoxStyle}>
            <div style={scoreNumStyle}>{r?.statistics?.conductedCount || 0}</div>
            <div style={scoreLabelStyle}>Sessions Conducted</div>
          </div>
          <div style={scoreBoxStyle}>
            <div style={scoreNumStyle}>{r?.statistics?.attendedCount || 0}</div>
            <div style={scoreLabelStyle}>FDPs Attended</div>
          </div>
          <div style={scoreBoxStyle}>
            <div style={scoreNumStyle}>{r?.statistics?.publicationsCount || 0}</div>
            <div style={scoreLabelStyle}>Publications</div>
          </div>
          <div style={scoreBoxStyle}>
            <div style={{ ...scoreNumStyle, color: '#0B5CAD' }}>{r?.statistics?.totalActivityScore || 0}</div>
            <div style={scoreLabelStyle}>Appraisal Points</div>
          </div>
        </div>

        {/* SECTION 1: QUALIFICATIONS SUMMARY */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={sectionHeaderStyle}>1. Academic Qualifications &amp; Degrees</h4>
          {(r?.educationSummary || []).length === 0 ? (
            <p style={emptyStyle}>No degrees recorded.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>Degree</th>
                  <th>Specialization</th>
                  <th>University / Board</th>
                  <th>Year</th>
                  <th>Division / CGPA</th>
                </tr>
              </thead>
              <tbody>
                {r.educationSummary.map(edu => (
                  <tr key={edu.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={tdStyle}><strong>{edu.degree}</strong></td>
                    <td style={tdStyle}>{edu.specialization}</td>
                    <td style={tdStyle}>{edu.university}</td>
                    <td style={tdStyle}>{edu.yearOfPassing}</td>
                    <td style={tdStyle}>{edu.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SECTION 2: ACHIEVEMENTS FOR YEAR */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={sectionHeaderStyle}>2. Honors, Awards &amp; Recognitions ({selectedYear})</h4>
          {(r?.achievements || []).length === 0 ? (
            <p style={emptyStyle}>No awards or honors recorded for calendar year {selectedYear}.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {r.achievements.map((ach, idx) => (
                <div key={ach.id} style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                  <strong>{idx + 1}. {ach.title}</strong> — {ach.awardingBody} ({ach.year})
                  {ach.description && <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>{ach.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: SESSIONS CONDUCTED FOR YEAR */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={sectionHeaderStyle}>3. Workshops, FDPs &amp; Seminars Conducted ({selectedYear})</h4>
          {(r?.sessionsConducted || []).length === 0 ? (
            <p style={emptyStyle}>No conducted sessions recorded for calendar year {selectedYear}.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Role</th>
                  <th>Organized By</th>
                  <th>Date</th>
                  <th>Attendees</th>
                </tr>
              </thead>
              <tbody>
                {r.sessionsConducted.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={tdStyle}><strong>{s.title}</strong></td>
                    <td style={tdStyle}>{s.type}</td>
                    <td style={tdStyle}>{s.role}</td>
                    <td style={tdStyle}>{s.organizedBy}</td>
                    <td style={tdStyle}>{s.date}</td>
                    <td style={tdStyle}>{s.participants || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SECTION 4: SESSIONS ATTENDED FOR YEAR */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={sectionHeaderStyle}>4. Professional Development Programs Attended ({selectedYear})</h4>
          {(r?.sessionsAttended || []).length === 0 ? (
            <p style={emptyStyle}>No attended training programs recorded for calendar year {selectedYear}.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>Program Title</th>
                  <th>Type</th>
                  <th>Host Institution</th>
                  <th>Date</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {r.sessionsAttended.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={tdStyle}><strong>{s.title}</strong></td>
                    <td style={tdStyle}>{s.type}</td>
                    <td style={tdStyle}>{s.organizedBy}</td>
                    <td style={tdStyle}>{s.date}</td>
                    <td style={tdStyle}>{s.duration || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SECTION 5: PUBLICATIONS */}
        {r?.publications && r.publications.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={sectionHeaderStyle}>5. Research Publications ({selectedYear})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {r.publications.map((p, idx) => (
                <div key={p.id} style={{ padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                  <strong>{idx + 1}. "{p.title}"</strong>, <em>{p.journal}</em>, {p.year}. {p.doi && `(DOI: ${p.doi})`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification & Signature Block */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #CBD5E1', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px', color: '#475569' }}>
          <div>
            <div><strong>Digitally Certified:</strong> Yes</div>
            <div><strong>Supporting Proofs in Vault:</strong> {r?.totalDocuments || 0} Documents</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '35px' }}></div>
            <div style={{ borderTop: '1px solid #0B1F3A', width: '180px', paddingTop: '4px', fontWeight: '700', color: '#0B1F3A' }}>
              Signature of Faculty Member
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '35px' }}></div>
            <div style={{ borderTop: '1px solid #0B1F3A', width: '180px', paddingTop: '4px', fontWeight: '700', color: '#0B1F3A' }}>
              Head of Department (CSE)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const scoreBoxStyle = {
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  padding: '12px',
  textAlign: 'center'
};

const scoreNumStyle = {
  fontSize: '22px',
  fontWeight: '800',
  color: '#0B1F3A'
};

const scoreLabelStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#64748B',
  marginTop: '2px'
};

const sectionHeaderStyle = {
  margin: '0 0 10px 0',
  fontSize: '14.5px',
  fontWeight: '800',
  color: '#0B1F3A',
  borderBottom: '1px solid #E2E8F0',
  paddingBottom: '6px'
};

const emptyStyle = {
  fontSize: '12.5px',
  color: '#94A3B8',
  fontStyle: 'italic',
  margin: '6px 0'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12.5px'
};

const tableHeaderStyle = {
  background: '#F1F5F9',
  borderBottom: '1.5px solid #CBD5E1',
  textAlign: 'left'
};

const tdStyle = {
  padding: '8px 10px',
  color: '#334155'
};


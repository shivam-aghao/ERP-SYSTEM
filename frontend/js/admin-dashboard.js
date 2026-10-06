/**
 * SSGMCE College ERP — Admin Dashboard Controller
 */
document.addEventListener('DOMContentLoaded', async function () {
  if (window.ERP_AUTH) {
    window.ERP_AUTH.requireAuth('admin');
  }

  // Load stats
  try {
    const statsRes = await AdminApi.getStats();
    if (statsRes && statsRes.data) {
      const d = statsRes.data;
      if (document.getElementById('statStudents')) document.getElementById('statStudents').textContent = d.total_students || 0;
      if (document.getElementById('statTeachers')) document.getElementById('statTeachers').textContent = d.total_teachers || 0;
      if (document.getElementById('statClasses')) document.getElementById('statClasses').textContent = d.total_classes || 0;
      if (document.getElementById('statQuizzes')) document.getElementById('statQuizzes').textContent = d.total_quizzes || 0;
    }
  } catch (err) {
    console.error('Error loading admin stats:', err);
  }

  // Load classes table
  try {
    const classesRes = await AdminApi.getClasses();
    const tbody = document.getElementById('classesTableBody');
    if (tbody && classesRes && classesRes.data) {
      tbody.innerHTML = classesRes.data.map(c => `
        <tr>
          <td><strong>${c.class_name}</strong></td>
          <td>${c.class_code || '-'}</td>
          <td>${c.academic_year || '-'}</td>
          <td>Sem ${c.semester || '-'}</td>
          <td>${c.division || '1'}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading classes:', err);
  }
});

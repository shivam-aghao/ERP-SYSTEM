/**
 * Test: Verify that Attendance Portal frontend scripts execute end-to-end without throwing exceptions
 * against live backend API data.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Fetch live attendance data from local backend
function fetchBackend(pathUrl) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8000${pathUrl}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTest() {
  console.log('--- SSGMCE ATTENDANCE PORTAL SIMULATION TEST ---');

  // Load calculations script
  const calcFile = fs.readFileSync(path.join(__dirname, '../frontend/js/attendanceCalculations.js'), 'utf8');
  const serviceFile = fs.readFileSync(path.join(__dirname, '../frontend/js/attendanceService.js'), 'utf8');

  // Create simulated window/global environment
  const simulatedGlobal = {
    location: { origin: 'http://localhost:8000', protocol: 'http:', hostname: 'localhost', port: '8000' },
    localStorage: {
      getItem: (k) => JSON.stringify({
        fullName: 'Aghao Shivam Sanjay',
        studentCode: '308637',
        rollNo: '3R71',
        className: '3R'
      })
    },
    document: {
      getElementById: (id) => ({
        id,
        textContent: '',
        innerHTML: '',
        style: {},
        value: '',
        addEventListener: () => {},
        querySelectorAll: () => []
      }),
      querySelectorAll: (sel) => []
    },
    fetch: async (url) => {
      const cleanUrl = url.replace('http://localhost:8000', '');
      const data = await fetchBackend(cleanUrl);
      return {
        ok: true,
        json: async () => data
      };
    }
  };

  // Evaluate scripts in this sandbox context
  const evalInContext = (code) => {
    const fn = new Function('window', 'global', 'globalThis', 'fetch', 'document', 'localStorage', code);
    fn(simulatedGlobal, simulatedGlobal, simulatedGlobal, simulatedGlobal.fetch, simulatedGlobal.document, simulatedGlobal.localStorage);
  };

  evalInContext(calcFile);
  evalInContext(serviceFile);

  const calc = simulatedGlobal.AttendanceCalculations;
  const service = simulatedGlobal.AttendanceService;

  if (!calc) throw new Error('AttendanceCalculations not initialized on global');
  if (!service) throw new Error('AttendanceService not initialized on global');

  console.log('✓ AttendanceCalculations & AttendanceService evaluated cleanly');

  // Test profile fetching
  const profileRes = await service.getStudentProfile();
  console.log('✓ Profile loaded:', profileRes.data.fullName, `(Roll: ${profileRes.data.rollNo})`);
  if (!profileRes.data.fullName) throw new Error('Profile missing fullName');

  // Test attendance list fetching from live API
  const listRes = await service.getAttendanceList();
  console.log(`✓ Subject attendance loaded: ${listRes.data.length} subjects found`);
  if (listRes.data.length !== 6) {
    throw new Error(`Expected 6 subjects from backend, got ${listRes.data.length}`);
  }

  // Verify properties on each subject
  for (const s of listRes.data) {
    if (!s.subject) throw new Error(`Subject missing .subject property: ${JSON.stringify(s)}`);
    if (typeof s.percentage !== 'number' || isNaN(s.percentage)) throw new Error(`Invalid percentage on subject: ${JSON.stringify(s)}`);
    console.log(`   - [${s.code}] ${s.subject} (${s.type}): ${s.present}/${s.total} = ${s.percentage}%`);
  }

  // Test summary cards computation
  const summaryRes = await service.getSummaryCards();
  const summary = summaryRes.data;
  console.log('✓ Summary Cards computed:');
  console.log(`   - Overall: ${summary.overall.percentage}% (${summary.overall.present}/${summary.overall.total})`);
  console.log(`   - Theory: ${summary.theory.percentage}% (${summary.theory.present}/${summary.theory.total})`);
  console.log(`   - Practical: ${summary.practical.percentage}% (${summary.practical.present}/${summary.practical.total})`);

  if (summary.overall.percentage !== 85.19) {
    throw new Error(`Expected overall attendance 85.19%, got ${summary.overall.percentage}%`);
  }

  // Test insights computation
  const insightsRes = await service.getInsights();
  const ins = insightsRes.data;
  console.log('✓ Insights computed:');
  console.log(`   - Total Attended: ${ins.totalAttended}`);
  console.log(`   - Total Missed: ${ins.totalMissed}`);
  console.log(`   - Below 75% Count: ${ins.below75Count}`);
  console.log(`   - Highest Subject: ${ins.highestSubject?.subject} (${ins.highestSubject?.percentage}%)`);
  console.log(`   - Lowest Subject: ${ins.lowestSubject?.subject} (${ins.lowestSubject?.percentage}%)`);

  if (!ins.highestSubject || !ins.lowestSubject) {
    throw new Error('Insights failed to compute highest/lowest subject');
  }

  // Test string operations that previously threw TypeError
  const highestSplit = (ins.highestSubject.subject || '').split('-')[0].trim();
  const lowestSplit = (ins.lowestSubject.subject || '').split('-')[0].trim();
  console.log(`✓ Safe string split tested: "${highestSplit}" and "${lowestSplit}"`);

  // Test target calculator logic
  const calc75 = calc.calculateConsecutiveNeeded(summary.overall.present, summary.overall.total, 75);
  console.log(`✓ Target 75% calculation: isMet=${calc75.isMet}, canMiss=${calc75.canMiss}`);

  console.log('\n>>> ALL ATTENDANCE PORTAL FRONTEND TESTS PASSED SUCCESSFULLY! <<<\n');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});


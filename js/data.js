/* TalentHub demo data layer: constants, date helpers and the seeded sample season.
   Everything here is synthetic. In production this module is replaced by API calls
   to a FastAPI + SQLAlchemy backend. */
const DB_KEY = 'talenthub_demo_v2';
const DB_VERSION = 2;
const BRANCHES = ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'CE', 'BT'];
const BRANCH_NAMES = { CSE: 'Computer Science', ISE: 'Information Science', ECE: 'Electronics & Communication', EEE: 'Electrical & Electronics', ME: 'Mechanical', CE: 'Civil', BT: 'Biotechnology' };
const BRANCH_CODE = { CSE: 'CS', ISE: 'IS', ECE: 'EC', EEE: 'EE', ME: 'ME', CE: 'CV', BT: 'BT' };
const STAGES = ['Applied', 'Shortlisted', 'Interview Scheduled', 'Interviewed', 'Offered', 'Accepted'];
const TERMINAL = ['Rejected', 'Closed'];
const ALL_STATUSES = STAGES.concat(TERMINAL);
const CATEGORIES = ['Engineering', 'Data & AI', 'Embedded', 'Product', 'Support'];
const DEMO_PASSWORD = 'Demo@1234';

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = () => iso(new Date());
const parseD = s => new Date(s + 'T00:00:00');
const addDays = (n, base) => { const d = base ? parseD(base) : new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parseD(a) - parseD(b)) / 864e5);
const fmtDate = s => s ? parseD(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtShort = s => s ? parseD(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
const fmtDay = s => s ? parseD(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';
const fmtTs = s => { const d = new Date(s); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); };
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'h' + h.toString(36); };
const uid = p => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const byId = (arr, id) => arr.find(x => x.id === id);
const pkgLabel = j => j.type === 'Internship' ? `₹${Math.round(j.package * 100 / 12)}k/mo` : `${j.package} LPA`;
const initials = n => n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const DEFAULT_PREFS = { saved: [], checklist: {}, reminders: { h24: true, h1: true, inApp: true, email: false }, prep: {} };

function seedDb() {
  let seed = 11;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const t = TODAY();

  const companies = [
    { id: 'c1', name: 'Northwind Labs', sector: 'Cloud & developer tools', color: '#3B2FD6', hq: 'Bengaluru', size: '1,200 people', website: 'northwind-labs.example', active: true, about: 'Northwind Labs builds deployment and monitoring tools for engineering teams. Campus hires join one of three product squads and ship code in their first month.' },
    { id: 'c2', name: 'Lumen Systems', sector: 'Enterprise analytics', color: '#0F766E', hq: 'Hyderabad', size: '3,400 people', website: 'lumen-systems.example', active: true, about: 'Lumen Systems turns operational data into dashboards for retailers and logistics firms. The graduate programme rotates analysts through three client teams.' },
    { id: 'c3', name: 'Kestrel Analytics', sector: 'Applied AI', color: '#C2410C', hq: 'Pune', size: '650 people', website: 'kestrel-analytics.example', active: true, about: 'Kestrel Analytics ships forecasting and vision models for manufacturers. New engineers own a model from data audit to deployment within a year.' },
    { id: 'c4', name: 'Orbit Fintech', sector: 'Payments & risk', color: '#1D4ED8', hq: 'Mumbai', size: '900 people', website: 'orbit-fintech.example', active: true, about: 'Orbit Fintech runs payment rails and fraud scoring for mid-sized banks. Engineers rotate between the ledger, risk and developer-API teams.' },
    { id: 'c5', name: 'Verdant Energy', sector: 'Clean energy hardware', color: '#15803D', hq: 'Chennai', size: '2,100 people', website: 'verdant-energy.example', active: true, about: 'Verdant Energy designs inverters and battery controllers for rooftop solar. The embedded team works directly with the test lab on every release.' },
    { id: 'c6', name: 'Helix Health', sector: 'Digital health', color: '#BE185D', hq: 'Bengaluru', size: '780 people', website: 'helix-health.example', active: true, about: 'Helix Health builds record and scheduling software for diagnostic labs. Data and product teams sit together and release every two weeks.' },
    { id: 'c7', name: 'Quanta Mobility', sector: 'Autonomous vehicles', color: '#334155', hq: 'Bengaluru', size: '1,500 people', website: 'quanta-mobility.example', active: true, about: 'Quanta Mobility develops perception and planning software for low-speed autonomous shuttles used on campuses and industrial parks.' },
    { id: 'c8', name: 'Pinewood Retail Tech', sector: 'Commerce platforms', color: '#A16207', hq: 'Remote-first', size: '420 people', website: 'pinewood-retail.example', active: true, about: 'Pinewood builds storefront and checkout tooling for independent retailers, with a fully remote engineering team.' }
  ];

  const BEN = {
    'Full-time': ['Relocation support up to ₹60,000', 'Health cover for you and your dependents', 'Dedicated mentor for the first year', 'Annual learning budget of ₹40,000'],
    'Internship': ['Monthly stipend paid on the 1st', 'Pre-placement offer track for strong performers', 'Mentor with weekly reviews', 'Completion certificate']
  };
  const mk = (id, companyId, title, type, category, pkg, location, mode, minCgpa, branches, posted, deadline, status, skills, summary, resp) => ({
    id, companyId, title, type, category, package: pkg, location, mode, minCgpa, maxBacklogs: 0, branches,
    postedOn: addDays(posted), deadline: addDays(deadline), status, skills, summary, responsibilities: resp, benefits: BEN[type]
  });
  const jobs = [
    mk('j1', 'c1', 'Software Development Engineer I', 'Full-time', 'Engineering', 16, 'Bengaluru', 'Hybrid', 7.5, ['CSE', 'ISE', 'ECE'], -10, 12, 'Open', ['React', 'TypeScript', 'Node.js', 'Data Structures', 'REST APIs'], 'Join the console squad that builds the dashboards engineers use to deploy and monitor cloud workloads.', ['Build and ship features in the deployment console', 'Write tested, reviewed TypeScript and Node.js services', 'Join design reviews and a shared on-call rotation after three months']),
    mk('j2', 'c1', 'Platform Engineering Intern', 'Internship', 'Engineering', 6, 'Bengaluru', 'Hybrid', 7.0, [], -8, 9, 'Open', ['Linux', 'Docker', 'Python', 'Git'], 'A six-month internship on the team that owns build and release tooling for every Northwind product.', ['Automate flaky release steps with Python and shell', 'Containerise internal tools and document them', 'Present one improvement to the platform team each month']),
    mk('j13', 'c1', 'QA Automation Engineer', 'Full-time', 'Engineering', 9, 'Bengaluru', 'On-site', 7.0, ['CSE', 'ISE', 'ECE', 'EEE'], -1, 25, 'Draft', ['Python', 'Git', 'REST APIs'], 'Own the automated regression suite that gates every Northwind release.', ['Write API and UI tests that run on every pull request', 'Triage failures and work with developers on fixes', 'Track test coverage and flakiness over time']),
    mk('j14', 'c1', 'Support Engineer', 'Full-time', 'Support', 7, 'Bengaluru', 'On-site', 6.5, [], -40, -12, 'Closed', ['Linux', 'SQL', 'Git'], 'First-line technical support for enterprise customers running Northwind tooling.', ['Reproduce customer issues in a sandbox', 'Write knowledge-base articles from solved tickets', 'Escalate defects with clear logs to engineering']),
    mk('j3', 'c2', 'Data Analyst', 'Full-time', 'Data & AI', 9.5, 'Hyderabad', 'On-site', 7.0, [], -28, 5, 'Open', ['SQL', 'Excel', 'Power BI', 'Statistics'], 'Analyse retail and logistics data for client teams and present findings to operations leads.', ['Build weekly KPI dashboards in Power BI', 'Write SQL to answer questions from client managers', 'Document metric definitions so teams read numbers the same way']),
    mk('j10', 'c2', 'Cloud Support Engineer', 'Full-time', 'Support', 7.2, 'Hyderabad', 'Hybrid', 6.5, [], -6, 15, 'Open', ['Linux', 'AWS', 'Python'], 'Keep client analytics workloads healthy on cloud infrastructure and automate the fixes you repeat.', ['Monitor pipelines and resolve incidents', 'Automate recurring fixes with Python', 'Write short post-incident summaries']),
    mk('j5', 'c3', 'Machine Learning Engineer', 'Full-time', 'Data & AI', 12, 'Pune', 'Hybrid', 7.8, ['CSE', 'ISE', 'ECE'], -25, 7, 'Open', ['Python', 'Machine Learning', 'Statistics', 'SQL'], 'Train and deploy demand-forecasting models used by manufacturing clients.', ['Audit and clean client data before modelling', 'Train, evaluate and version forecasting models', 'Ship models behind monitored APIs']),
    mk('j4', 'c4', 'Backend Engineer', 'Full-time', 'Engineering', 12, 'Mumbai', 'Hybrid', 8.2, ['CSE', 'ISE'], -5, 9, 'Open', ['Java', 'SQL', 'REST APIs', 'Data Structures'], 'Build ledger and settlement services that move money between banks reliably.', ['Design idempotent payment APIs in Java', 'Optimise SQL queries on large ledger tables', 'Add monitoring to every service you ship']),
    mk('j12', 'c4', 'Quantitative Analyst Intern', 'Internship', 'Data & AI', 7.2, 'Mumbai', 'On-site', 8.0, ['CSE', 'ISE', 'ECE', 'EEE'], -4, 18, 'Open', ['Python', 'Statistics', 'Excel'], 'Support the risk team with back-tests of fraud-scoring rules over a six-month internship.', ['Back-test scoring rules on historic transactions', 'Summarise false-positive trends for the risk lead', 'Prototype one new feature in Python']),
    mk('j6', 'c5', 'Embedded Systems Engineer', 'Full-time', 'Embedded', 8, 'Chennai', 'On-site', 7.0, ['ECE', 'EEE', 'ME'], -7, 10, 'Open', ['Embedded C', 'MATLAB', 'Linux'], 'Write firmware for solar inverters and battery controllers, and test it on the lab bench.', ['Develop and debug firmware in embedded C', 'Model control loops in MATLAB before coding them', 'Run hardware-in-the-loop tests with the test lab']),
    mk('j11', 'c6', 'Clinical Data Engineer', 'Full-time', 'Data & AI', 11, 'Bengaluru', 'Hybrid', 7.5, ['CSE', 'ISE', 'ECE'], -9, 11, 'Open', ['Python', 'SQL', 'AWS', 'Docker'], 'Build data pipelines that move lab results into secure, query-ready stores for clinicians.', ['Build and monitor ETL jobs on AWS', 'Validate lab data against clinical schemas', 'Containerise and document every pipeline']),
    mk('j7', 'c6', 'Product Analyst Intern', 'Internship', 'Product', 5.4, 'Remote', 'Remote', 7.0, [], -3, 20, 'Open', ['SQL', 'Figma', 'Excel', 'Statistics'], 'Work with product managers to measure how lab staff use new scheduling features.', ['Pull usage data with SQL and chart it in Excel', 'Run small usability studies and note findings in Figma', 'Present a recommendation at the end of the internship']),
    mk('j8', 'c7', 'Autonomy Software Engineer', 'Full-time', 'Engineering', 22, 'Bengaluru', 'On-site', 8.5, ['CSE', 'ECE', 'ME'], -2, 21, 'Open', ['C++', 'Python', 'Data Structures', 'Linux'], 'Work on perception and path-planning code that runs on shuttles in real traffic.', ['Implement planning modules in modern C++', 'Replay logged drives to reproduce and fix edge cases', 'Review sensor-fusion changes with senior engineers']),
    mk('j9', 'c8', 'Frontend Engineer', 'Full-time', 'Engineering', 10, 'Remote', 'Remote', 7.0, [], -45, -3, 'Closed', ['React', 'TypeScript', 'Figma'], 'Build checkout and storefront interfaces for independent retailers.', ['Ship accessible React components', 'Work from Figma specs and flag gaps early', 'Measure and improve page speed'])
  ];

  const FIRST = ['Aanya', 'Rohan', 'Meghna', 'Karthik', 'Ishita', 'Vivaan', 'Sneha', 'Arjun', 'Diya', 'Harsh', 'Nisha', 'Pranav', 'Tara', 'Aditya', 'Kavya', 'Rahul', 'Ananya', 'Siddharth', 'Pooja', 'Manish', 'Riya', 'Dev', 'Shreya', 'Nikhil', 'Lakshmi', 'Varun', 'Zoya', 'Kabir'];
  const LAST = ['Rao', 'Menon', 'Kulkarni', 'Shetty', 'Bhat', 'Patil', 'Naik', 'Hegde', 'Joshi', 'Gowda', 'Reddy', 'Desai', 'Pai', 'Kamath', 'Nair', 'Iyer', 'Sharma', 'Verma', 'Das', 'Ghosh', 'Jain', 'Kapoor', 'Mishra', 'Singh', 'Prabhu', 'Acharya'];
  const HW = ['Embedded C', 'MATLAB', 'C++', 'Linux'];
  const SW = ['React', 'Python', 'SQL', 'Java', 'Node.js', 'Data Structures', 'Machine Learning', 'Docker', 'AWS', 'TypeScript'];
  const students = [];
  for (let i = 0; i < 28; i++) {
    const br = i === 0 ? 'CSE' : ['CSE', 'CSE', 'ISE', 'ECE', 'ECE', 'EEE', 'ME', 'CE', 'BT'][i % 9];
    const first = FIRST[i % FIRST.length], last = i === 0 ? 'Rao' : LAST[(i * 7 + 3) % LAST.length];
    const name = first + ' ' + last;
    const themed = ['ECE', 'EEE', 'ME'].includes(br) ? HW : SW;
    const pool = themed.concat(['Git', 'Excel', 'Statistics']);
    const skills = []; while (skills.length < 5) { const s = pick(pool); if (!skills.includes(s)) skills.push(s); }
    const st = {
      id: 's' + (i + 1), name, email: (i === 0 ? 'aanya.rao' : `${first}.${last}${i}`).toLowerCase() + '@campus-demo.edu',
      usn: `1TH22${BRANCH_CODE[br]}${String(i + 1).padStart(3, '0')}`, branch: br, gradYear: 2027,
      cgpa: i === 0 ? 8.2 : Math.round((6.2 + ((i * 37) % 330) / 100) * 100) / 100,
      activeBacklogs: i === 0 ? 0 : (i % 7 === 3 ? 1 : 0), clearedBacklogs: i === 0 ? 1 : (i % 5 === 1 ? 1 : 0),
      phone: '+91 90000 ' + String(10000 + i * 37).slice(0, 5), city: 'Bengaluru', about: '', skills,
      projects: [], certs: [], internships: [], achievements: [],
      resume: i % 3 !== 2 ? { name: `${first}_${last}_Resume.pdf`, size: 150000 + i * 7311, uploadedOn: addDays(-20 - i) } : null,
      visibility: { contact: i % 4 !== 0, searchable: true, resume: true },
      acceptedOfferId: null, pw: hash(DEMO_PASSWORD)
    };
    students.push(st);
  }
  Object.assign(students[0], {
    skills: ['React', 'TypeScript', 'Python', 'SQL', 'Data Structures', 'Git', 'REST APIs', 'Node.js'],
    about: 'Final-year computer science student who likes turning messy campus problems into small, usable products. Looking for a product-engineering role.',
    projects: [{ title: 'CampusConnect', detail: 'Event discovery app for 3,000 students, built with React and Node.js.' }, { title: 'Placement Predictor', detail: 'Logistic regression model that estimates shortlist chances from CGPA and skills.' }],
    certs: [{ title: 'AWS Cloud Practitioner', detail: 'Amazon Web Services, 2025' }],
    internships: [{ title: 'Frontend Intern, Brightline Studio', detail: '8 weeks. Built an accessible component library.' }],
    achievements: [{ title: 'Finalist, inter-college hackathon 2025', detail: 'Top 5 of 120 teams' }],
    resume: { name: 'Aanya_Rao_Resume.pdf', size: 184320, uploadedOn: addDays(-12) },
    visibility: { contact: true, searchable: true, resume: true }
  });

  const applications = [], interviews = [], offers = [];
  const NOTES = { Applied: 'Application submitted', Shortlisted: 'Shortlisted by the recruiter', 'Interview Scheduled': 'Interview scheduled', Interviewed: 'Interview stage completed', Offered: 'Offer issued', Accepted: 'Offer accepted' };
  const TIMES = ['10:00', '11:30', '14:00', '15:30'];
  const mkApp = (st, job, status, opt = {}) => {
    const n = Math.max(0, STAGES.indexOf(status));
    const applied = opt.applied || addDays(-(4 + Math.floor(rnd() * 20)));
    const dates = []; for (let k = 0; k <= 5; k++) { let d = opt.dates ? opt.dates[k] : addDays(k * 2, applied); if (!d || d > t) d = t; dates.push(d); }
    const hist = []; for (let k = 0; k <= n; k++) hist.push({ status: STAGES[k], date: dates[k], note: NOTES[STAGES[k]] });
    let reason = null;
    if (status === 'Rejected') { hist.push({ status: 'Rejected', date: opt.rejectedOn || dates[1], note: 'Not selected' }); reason = opt.reason || pick(['Profile did not match the shortlist criteria for this role.', 'Skill assessment score was below the cut-off.', 'Other candidates matched the required project experience more closely.']); }
    const app = { id: 'a' + (applications.length + 1), studentId: st.id, jobId: job.id, companyId: job.companyId, status, appliedOn: applied, updatedOn: hist[hist.length - 1].date, history: hist, reason };
    applications.push(app);
    const slug = job.id + '-' + st.id;
    const online = rnd() > 0.4;
    const mkIv = (round, date, time, istatus, result) => interviews.push({ id: 'i' + (interviews.length + 1), appId: app.id, studentId: st.id, companyId: job.companyId, jobId: job.id, round, date, time, mode: online ? 'Online' : 'On-campus', venue: online ? `https://meet.example/${slug}` : 'Placement Cell, Seminar Hall B', notes: 'Bring a photo ID. Be ready to walk through one project and solve two short problems.', status: istatus, result, feedback: result === 'Passed' ? 'Clear explanations and solid fundamentals.' : '' });
    if (opt.extraIv) opt.extraIv.forEach(x => mkIv(x.round, x.date, x.time, 'Completed', 'Passed'));
    if (status === 'Interview Scheduled') mkIv(opt.round || 'Technical Interview', opt.ivDate || addDays(1 + Math.floor(rnd() * 7)), opt.ivTime || pick(TIMES), 'Scheduled', null);
    else if (n >= 3) mkIv('Technical Interview', dates[2], pick(TIMES), 'Completed', 'Passed');
    if (n >= 4) {
      const o = { id: 'o' + (offers.length + 1), appId: app.id, studentId: st.id, companyId: job.companyId, jobId: job.id, package: job.package, date: dates[4], respondBy: addDays(10, dates[4]), joiningDate: '2027-07-01', status: status === 'Accepted' ? 'Accepted' : 'Issued' };
      offers.push(o); if (status === 'Accepted') st.acceptedOfferId = o.id;
    }
    return app;
  };

  students.forEach((st, i) => {
    if (i === 0) return;
    const ok = j => j.status !== 'Draft' && Math.round(st.cgpa * 100) >= Math.round(j.minCgpa * 100) && st.activeBacklogs <= j.maxBacklogs && (!j.branches.length || j.branches.includes(st.branch));
    let pool = jobs.filter(ok).sort(() => rnd() - 0.5);
    if (i % 3 !== 0) pool = pool.filter(j => j.companyId === 'c1').concat(pool.filter(j => j.companyId !== 'c1'));
    const k = 1 + Math.floor(rnd() * 3), chosen = [];
    pool.forEach(j => { if (chosen.length < k && !chosen.some(c => c.companyId === j.companyId)) chosen.push(j); });
    chosen.forEach(job => {
      const r = rnd();
      let status = r < .28 ? 'Applied' : r < .5 ? 'Shortlisted' : r < .62 ? 'Interview Scheduled' : r < .72 ? 'Interviewed' : r < .8 ? 'Offered' : r < .84 ? 'Accepted' : 'Rejected';
      if (status === 'Accepted' && (chosen.length > 1 || st.acceptedOfferId)) status = 'Offered';
      mkApp(st, job, status);
    });
  });

  const s1 = students[0], J = id => byId(jobs, id);
  mkApp(s1, J('j1'), 'Interview Scheduled', { applied: addDays(-9), dates: [addDays(-9), addDays(-6), addDays(-2)], ivDate: addDays(2), ivTime: '11:00', round: 'Technical Interview', extraIv: [{ round: 'Online Assessment', date: addDays(-3), time: '10:00' }] });
  mkApp(s1, J('j3'), 'Offered', { applied: addDays(-26), dates: [addDays(-26), addDays(-21), addDays(-14), addDays(-10), addDays(-6)] });
  mkApp(s1, J('j5'), 'Offered', { applied: addDays(-22), dates: [addDays(-22), addDays(-17), addDays(-9), addDays(-6), addDays(-3)] });
  mkApp(s1, J('j11'), 'Shortlisted', { applied: addDays(-5), dates: [addDays(-5), addDays(-2)] });
  mkApp(s1, J('j9'), 'Rejected', { applied: addDays(-35), rejectedOn: addDays(-20), reason: 'The role needed two years of React Native work, which is outside your current profile. Your web projects were noted for future openings.' });

  const ago = n => new Date(Date.now() - n * 864e5).toISOString();
  const notifications = [
    { id: 'n1', to: 's1', text: 'Kestrel Analytics issued you an offer for Machine Learning Engineer.', ts: ago(3), read: false },
    { id: 'n2', to: 's1', text: 'Northwind Labs scheduled your technical interview.', ts: ago(2), read: false },
    { id: 'n3', to: 's1', text: 'Helix Health shortlisted your application for Clinical Data Engineer.', ts: ago(2), read: true },
    { id: 'n4', to: 'r1', text: 'Three new applications arrived for Software Development Engineer I.', ts: ago(1), read: false },
    { id: 'n5', to: 'p1', text: 'Quanta Mobility published a new drive: Autonomy Software Engineer.', ts: ago(2), read: false }
  ];
  const audit = [
    { id: 'l1', ts: ago(6), actor: 'Dr. Suresh Kulkarni', role: 'coordinator', action: 'Season opened', detail: 'Placement season 2026–27 opened for registrations.' },
    { id: 'l2', ts: ago(5), actor: 'Dr. Suresh Kulkarni', role: 'coordinator', action: 'Company approved', detail: 'Quanta Mobility approved to recruit this season.' },
    { id: 'l3', ts: ago(4), actor: 'Meera Iyer', role: 'recruiter', action: 'Listing published', detail: 'Northwind Labs published Software Development Engineer I.' },
    { id: 'l4', ts: ago(3), actor: 'Dr. Suresh Kulkarni', role: 'coordinator', action: 'Criteria updated', detail: 'Orbit Fintech Backend Engineer: minimum CGPA set to 8.20.' },
    { id: 'l5', ts: ago(2), actor: 'Meera Iyer', role: 'recruiter', action: 'Interview scheduled', detail: 'Northwind Labs scheduled interviews for 4 candidates.' }
  ];

  return {
    v: DB_VERSION, season: '2026–27', session: null, students, companies, jobs, applications, interviews, offers, notifications, audit,
    recruiters: [{ id: 'r1', name: 'Meera Iyer', title: 'Campus Hiring Lead', email: 'meera.iyer@northwind-demo.com', companyId: 'c1', pw: hash(DEMO_PASSWORD) }],
    coordinators: [{ id: 'p1', name: 'Dr. Suresh Kulkarni', title: 'Placement Coordinator', email: 'placement@campus-demo.edu', pw: hash(DEMO_PASSWORD) }],
    prefs: { s1: { saved: ['j4', 'j8'], checklist: { research: true }, reminders: { h24: true, h1: true, inApp: true, email: false }, prep: { p1: true } } }
  };
}

/* Pages 4-7: Student Dashboard, Profile & Resume, Explore Jobs, Job Details. */
const cmpIv = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
const deadlineChip = job => {
  const left = diffDays(job.deadline, TODAY());
  if (job.status === 'Closed' || left < 0) return html`<${Chip} tone="neutral" icon="lock">Closed<//>`;
  if (left === 0) return html`<${Chip} tone="warn" icon="clock">Closes today<//>`;
  return html`<${Chip} tone=${left <= 3 ? 'warn' : 'neutral'} icon="clock">${left} day${left > 1 ? 's' : ''} left<//>`;
};
const eligSummary = job => `CGPA ${job.minCgpa.toFixed(1)}+ · ${job.branches.length ? job.branches.join(', ') : 'All branches'} · ${job.maxBacklogs === 0 ? 'No active backlogs' : 'Up to ' + job.maxBacklogs + ' backlogs'}`;
const eligChip = (ev, job) => ev.existing && ev.existing.jobId === job.id ? html`<${Chip} tone="good" icon="check">Applied<//>` : ev.existing ? html`<${Chip} tone="neutral" icon="lock">Company already applied<//>` : ev.closed ? html`<${Chip} tone="neutral" icon="lock">Closed<//>` : ev.eligible ? html`<${Chip} tone="good" icon="shield">Eligible<//>` : html`<${Chip} tone="bad" icon="x">Not eligible: ${ev.checks.find(c => !c.pass).title}<//>`;

function JobCard({ job, ev, saved, onSave, onOpen }) {
  const { db } = useApp(); const co = byId(db.companies, job.companyId);
  return html`<article className="card jobcard">
    <div className="jobcard-top"><${CompanyLogo} co=${co} /><div className="grow"><h3><button className="link-plain" onClick=${onOpen}>${job.title}</button></h3><p className="muted">${co.name} · ${job.type}</p></div>
      <button className=${cx('icon-btn', saved && 'on')} onClick=${onSave} aria-pressed=${saved} aria-label=${saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}><${Icon} n="bookmark" size=${18} className=${saved ? 'filled' : ''} /></button></div>
    <div className="jobcard-meta"><span className="pkg">${pkgLabel(job)}</span><span><${Icon} n="pin" size=${14} />${job.location}</span><span><${Icon} n="building" size=${14} />${job.mode}</span></div>
    <p className="elig-line">${eligSummary(job)}</p>
    <div className="jobcard-foot"><div className="chips">${deadlineChip(job)}${eligChip(ev, job)}</div><${Btn} variant="outline" size="sm" iconRight="right" onClick=${onOpen}>Details<//></div></article>`;
}

/* ---------------- Page 4: Dashboard ---------------- */
function Dashboard() {
  const { db, user, go, mutate } = useApp();
  const t = TODAY();
  const apps = db.applications.filter(a => a.studentId === user.id);
  const evals = db.jobs.filter(j => j.status === 'Open' && j.deadline >= t).map(j => ({ j, ev: evalEligibility(db, user, j) }));
  const eligible = evals.filter(x => x.ev.canApply);
  const rec = eligible.slice().sort((a, b) => skillMatch(user, b.j) - skillMatch(user, a.j) || b.j.package - a.j.package).slice(0, 3);
  const ivs = db.interviews.filter(i => i.studentId === user.id && i.status === 'Scheduled').sort(cmpIv);
  const offers = db.offers.filter(o => o.studentId === user.id && (o.status === 'Issued' || o.status === 'Accepted'));
  const sc = profileScore(user), pf = prefsOf(db, user.id);
  const activity = apps.flatMap(a => a.history.map(h => ({ ...h, app: a }))).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);
  const list = [
    { key: 'profile', label: 'Bring your profile to 80% or more', done: sc.pct >= 80, to: 'profile' },
    { key: 'resume', label: 'Upload your resume', done: !!user.resume, to: 'profile' },
    { key: 'apply3', label: 'Apply to at least three drives', done: apps.length >= 3, to: 'jobs' },
    { key: 'research', label: 'Research the companies you applied to', manual: true },
    { key: 'mock', label: 'Complete one mock interview', manual: true },
    { key: 'docs', label: 'Keep ID and marksheets ready for rounds', manual: true }
  ].map(i => i.manual ? { ...i, done: !!pf.checklist[i.key] } : i);
  const doneN = list.filter(i => i.done).length;
  const toggle = key => mutate(d => { const p = getPrefs(d, user.id); p.checklist[key] = !p.checklist[key]; });
  const cards = [['briefcase', eligible.length, 'Eligible opportunities', 'jobs'], ['file', apps.length, 'Applications submitted', 'applications'], ['calendar', ivs.length, 'Interviews scheduled', 'interviews'], ['award', offers.length, 'Offers received', 'offers']];
  const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return html`<div className="page">
    <${PageHeader} eyebrow=${`${user.branch} · ${user.usn} · Season ${db.season}`} title=${`${greet}, ${user.name.split(' ')[0]}`} sub=${user.acceptedOfferId ? 'You accepted an offer this season. Other drives are closed to you under the placement rules.' : `You are eligible for ${eligible.length} open drive${eligible.length === 1 ? '' : 's'} right now.`}
      actions=${html`<${Btn} icon="search" onClick=${() => go('jobs')}>Browse jobs<//><${Btn} variant="outline" icon="user" onClick=${() => go('profile')}>Update profile<//><${Btn} variant="outline" icon="file" onClick=${() => go('applications')}>View applications<//>`} />
    <div className="grid-4">${cards.map(c => html`<button key=${c[2]} className="card stat" onClick=${() => go(c[3])}><span className="stat-ic"><${Icon} n=${c[0]} size=${19} /></span><b>${c[1]}</b><span>${c[2]}</span></button>`)}</div>
    <div className="grid-main">
      <div className="stack">
        <section className="card"><div className="card-head"><h2>Recommended for you</h2><button className="link" onClick=${() => go('jobs')}>See all drives</button></div>
          ${rec.length ? html`<ul className="rows">${rec.map(({ j }) => { const co = byId(db.companies, j.companyId); const m = j.skills.filter(s => user.skills.includes(s)); return html`<li key=${j.id} className="row-job"><${CompanyLogo} co=${co} size=${40} /><div className="grow"><b>${j.title}</b><p className="muted">${co.name} · ${pkgLabel(j)} · ${j.location}</p><div className="chips">${m.length ? m.slice(0, 3).map(s => html`<${Chip} key=${s} tone="violet">${s}<//>`) : html`<${Chip}>Open to all skills<//>`}</div></div><${Btn} variant="outline" size="sm" onClick=${() => go('job-' + j.id)}>View<//></li>`; })}</ul>` : html`<${Empty} icon="briefcase" title="No open drives match you right now" body=${user.acceptedOfferId ? 'Accepting an offer closes other drives for the season.' : 'Check back soon, or raise your profile so new drives rank for you.'} />`}
          <p className="fine">Ranked by skills you share with each listing, then package. Only drives you can apply to are shown.</p></section>
        <section className="card"><div className="card-head"><h2>Recent application activity</h2><button className="link" onClick=${() => go('applications')}>All applications</button></div>
          ${activity.length ? html`<ol className="activity">${activity.map((a, i) => { const j = byId(db.jobs, a.app.jobId), co = byId(db.companies, a.app.companyId); return html`<li key=${i}><span className="act-dot"></span><div><b>${co.name}</b> · ${j.title}<p className="muted">${a.note} · ${fmtDate(a.date)}</p></div><${StatusChip} s=${a.status} /></li>`; })}</ol>` : html`<${Empty} icon="file" title="No applications yet" body="Apply to a drive and its activity will appear here." action=${html`<${Btn} onClick=${() => go('jobs')}>Explore opportunities<//>`} />`}</section>
      </div>
      <div className="stack">
        <section className="card profile-card"><${Ring} value=${sc.pct} label="Profile completion" /><div><h2>Profile ${sc.pct}% complete</h2>${sc.missing.length ? html`<p className="muted">Next: ${sc.missing[0].toLowerCase()}.</p>` : html`<p className="muted">Your profile is complete.</p>`}<${Btn} variant="outline" size="sm" onClick=${() => go('profile')}>Open profile<//></div></section>
        <section className="card"><div className="card-head"><h2>Upcoming interviews</h2><button className="link" onClick=${() => go('interviews')}>Calendar</button></div>
          ${ivs.length ? html`<ul className="rows">${ivs.slice(0, 3).map(i => { const co = byId(db.companies, i.companyId), j = byId(db.jobs, i.jobId); return html`<li key=${i.id} className="row-iv"><span className="datebox"><b>${parseD(i.date).getDate()}</b><small>${parseD(i.date).toLocaleDateString('en-IN', { month: 'short' })}</small></span><div className="grow"><b>${co.name}</b><p className="muted">${i.round} · ${i.time} · ${i.mode}</p></div></li>`; })}</ul>` : html`<${Empty} icon="calendar" title="No interviews scheduled" body="Shortlisted applications turn into interviews here." />`}</section>
        <section className="card"><div className="card-head"><h2>Career-readiness</h2><span className="muted">${doneN} of ${list.length}</span></div><${Meter} value=${Math.round(doneN / list.length * 100)} label="Career readiness" />
          <ul className="checklist">${list.map(i => html`<li key=${i.key}>${i.manual ? html`<${Check} id=${'cl-' + i.key} checked=${i.done} onChange=${() => toggle(i.key)}>${i.label}<//>` : html`<span className=${cx('auto-item', i.done && 'done')}><span className="check-box on-static" aria-hidden="true">${i.done ? html`<${Icon} n="check" size=${13} />` : null}</span><span>${i.label}</span>${!i.done ? html`<button className="link" onClick=${() => go(i.to)}>Do it</button>` : null}</span>`}</li>`)}</ul></section>
      </div></div></div>`;
}

/* ---------------- Page 5: Profile & Resume ---------------- */
function ListEditor({ id, label, items, onChange, titleLabel, detailLabel }) {
  const upd = (i, k, v) => onChange(items.map((x, n) => n === i ? { ...x, [k]: v } : x));
  return html`<fieldset className="listed"><legend>${label}</legend>
    ${items.length === 0 ? html`<p className="muted">Nothing added yet.</p>` : null}
    ${items.map((it, i) => html`<div key=${i} className="listed-row"><${TextField} id=${`${id}-t-${i}`} label=${titleLabel} value=${it.title} onChange=${v => upd(i, 'title', v)} /><${TextField} id=${`${id}-d-${i}`} label=${detailLabel} value=${it.detail} onChange=${v => upd(i, 'detail', v)} /><button type="button" className="icon-btn" onClick=${() => onChange(items.filter((_, n) => n !== i))} aria-label=${`Remove ${label.toLowerCase()} item ${i + 1}`}><${Icon} n="trash" size=${17} /></button></div>`)}
    <${Btn} variant="outline" size="sm" icon="plus" onClick=${() => onChange(items.concat({ title: '', detail: '' }))}>Add ${label.toLowerCase().replace(/s$/, '')}<//></fieldset>`;
}
function Profile() {
  const { db, user, mutate, toast } = useApp();
  const base = useMemo(() => ({ name: user.name, phone: user.phone, city: user.city, about: user.about, branch: user.branch, gradYear: String(user.gradYear), cgpa: String(user.cgpa), activeBacklogs: String(user.activeBacklogs), clearedBacklogs: String(user.clearedBacklogs), skills: user.skills, projects: user.projects, certs: user.certs, internships: user.internships, achievements: user.achievements, resume: user.resume, visibility: user.visibility }), [user]);
  const [f, setF] = useState(base); const [errs, setErrs] = useState({}); const [skill, setSkill] = useState(''); const [fileErr, setFileErr] = useState('');
  useEffect(() => { setF(base); }, [base]);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(base);
  const live = { ...user, name: f.name, phone: f.phone, about: f.about, skills: f.skills, projects: f.projects.filter(x => x.title.trim()), certs: f.certs.filter(x => x.title.trim()), internships: f.internships.filter(x => x.title.trim()), achievements: f.achievements.filter(x => x.title.trim()), resume: f.resume, cgpa: parseFloat(f.cgpa) || 0 };
  const sc = profileScore(live);
  const addSkill = () => { const s = skill.trim(); if (!s) return; if (f.skills.some(x => x.toLowerCase() === s.toLowerCase())) { toast(`${s} is already in your skills.`, 'info'); return; } set('skills', f.skills.concat(s)); setSkill(''); };
  const onFile = e => {
    const file = e.target.files[0]; if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) { setFileErr('Upload a PDF, DOC or DOCX file.'); e.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { setFileErr(`This file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 2 MB.`); e.target.value = ''; return; }
    setFileErr(''); set('resume', { name: file.name, size: file.size, uploadedOn: TODAY() }); toast('Resume attached. Press Save changes to keep it.', 'info');
  };
  const save = () => {
    const e = {};
    if (f.name.trim().length < 3) e.name = 'Enter your full name.';
    if (f.phone && !/^\+?[\d\s-]{8,16}$/.test(f.phone)) e.phone = 'Use digits, spaces or dashes, for example +91 90000 12345.';
    const c = parseFloat(f.cgpa); if (isNaN(c) || c < 0 || c > 10) e.cgpa = 'CGPA must be between 0 and 10.';
    if (!/^\d+$/.test(f.activeBacklogs)) e.activeBacklogs = 'Enter a whole number, 0 or more.';
    if (!/^\d+$/.test(f.clearedBacklogs)) e.clearedBacklogs = 'Enter a whole number, 0 or more.';
    if (f.about.length > 300) e.about = `Keep the summary under 300 characters (now ${f.about.length}).`;
    setErrs(e); if (Object.keys(e).length) { toast('Fix the highlighted fields before saving.', 'bad'); return; }
    mutate(d => { const s = byId(d.students, user.id); Object.assign(s, { name: f.name.trim(), phone: f.phone, city: f.city, about: f.about, branch: f.branch, gradYear: +f.gradYear, cgpa: Math.round(c * 100) / 100, activeBacklogs: +f.activeBacklogs, clearedBacklogs: +f.clearedBacklogs, skills: f.skills, projects: live.projects, certs: live.certs, internships: live.internships, achievements: live.achievements, resume: f.resume, visibility: f.visibility }); });
    toast('Profile saved. Your eligibility on every listing was rechecked.');
  };
  const vis = (k, v) => set('visibility', { ...f.visibility, [k]: v });
  return html`<div className="page"><${PageHeader} eyebrow="Student profile" title="Profile and resume" sub="Recruiters see what you choose to share. CGPA and backlogs are editable here so you can test eligibility rules in the demo; a production build reads them from college records." />
    <div className="grid-profile"><div className="stack">
      <section className="card"><h2>Personal details</h2><div className="form-grid">
        <${TextField} id="pf-name" label="Full name" value=${f.name} onChange=${v => set('name', v)} error=${errs.name} />
        <${TextField} id="pf-email" label="College email" value=${user.email} onChange=${() => { }} readOnly hint="Set at registration." />
        <${TextField} id="pf-phone" label="Phone" value=${f.phone} onChange=${v => set('phone', v)} error=${errs.phone} placeholder="+91 90000 12345" />
        <${TextField} id="pf-city" label="City" value=${f.city} onChange=${v => set('city', v)} />
        <${TextArea} id="pf-about" label="Summary" value=${f.about} onChange=${v => set('about', v)} error=${errs.about} hint=${`${f.about.length}/300 characters. Two sentences on what you want to build.`} className="span2" /></div></section>
      <section className="card"><h2>Academic details</h2><div className="form-grid">
        <${TextField} id="pf-usn" label="USN" value=${user.usn} onChange=${() => { }} readOnly />
        <${SelectField} id="pf-branch" label="Branch" value=${f.branch} onChange=${v => set('branch', v)} options=${BRANCHES.map(b => ({ value: b, label: `${b} · ${BRANCH_NAMES[b]}` }))} />
        <${SelectField} id="pf-year" label="Graduation year" value=${f.gradYear} onChange=${v => set('gradYear', v)} options=${['2026', '2027', '2028', '2029']} />
        <${TextField} id="pf-cgpa" label="CGPA" type="number" step="0.01" min="0" max="10" value=${f.cgpa} onChange=${v => set('cgpa', v)} error=${errs.cgpa} />
        <${TextField} id="pf-ab" label="Active backlogs" type="number" min="0" value=${f.activeBacklogs} onChange=${v => set('activeBacklogs', v)} error=${errs.activeBacklogs} hint="Only active backlogs affect eligibility." />
        <${TextField} id="pf-cb" label="Cleared backlogs" type="number" min="0" value=${f.clearedBacklogs} onChange=${v => set('clearedBacklogs', v)} error=${errs.clearedBacklogs} hint="Cleared backlogs never block you." /></div></section>
      <section className="card"><h2>Skills</h2><div className="chips chips-lg">${f.skills.map(s => html`<span key=${s} className="skill">${s}<button type="button" onClick=${() => set('skills', f.skills.filter(x => x !== s))} aria-label=${`Remove skill ${s}`}><${Icon} n="x" size=${13} /></button></span>`)}${f.skills.length === 0 ? html`<span className="muted">No skills yet.</span>` : null}</div>
        <div className="inline-add"><${TextField} id="pf-skill" label="Add a skill" value=${skill} onChange=${setSkill} onKeyDown=${e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="For example, Docker" /><${Btn} variant="outline" icon="plus" onClick=${addSkill}>Add<//></div></section>
      <section className="card stack-sm"><h2>Experience</h2>
        <${ListEditor} id="pj" label="Projects" items=${f.projects} onChange=${v => set('projects', v)} titleLabel="Project name" detailLabel="What it does" />
        <${ListEditor} id="in" label="Internships" items=${f.internships} onChange=${v => set('internships', v)} titleLabel="Role and company" detailLabel="Duration and outcome" />
        <${ListEditor} id="ce" label="Certifications" items=${f.certs} onChange=${v => set('certs', v)} titleLabel="Certification" detailLabel="Issuer and year" />
        <${ListEditor} id="ac" label="Achievements" items=${f.achievements} onChange=${v => set('achievements', v)} titleLabel="Achievement" detailLabel="Context" /></section>
    </div>
    <aside className="stack sticky-col">
      <section className="card"><div className="card-head"><h2>Completion</h2><b>${sc.pct}%</b></div><${Meter} value=${sc.pct} label="Profile completion" />${sc.missing.length ? html`<ul className="todo">${sc.missing.slice(0, 4).map(m => html`<li key=${m}><${Icon} n="plus" size=${14} />${m}</li>`)}</ul>` : html`<p className="muted">Every section is filled in.</p>`}</section>
      <section className="card"><h2>Resume</h2>
        ${f.resume ? html`<div className="file"><span className="file-ic"><${Icon} n="file" size=${20} /></span><div className="grow"><b>${f.resume.name}</b><p className="muted">${Math.round(f.resume.size / 1024)} KB · added ${fmtDate(f.resume.uploadedOn)}</p></div><button className="icon-btn" onClick=${() => set('resume', null)} aria-label="Remove resume"><${Icon} n="trash" size=${17} /></button></div>` : html`<p className="muted">No resume attached.</p>`}
        <label className="dropzone" htmlFor="pf-file"><${Icon} n="upload" size=${20} /><span><b>Choose a file</b> PDF, DOC or DOCX, up to 2 MB</span><input id="pf-file" type="file" accept=".pdf,.doc,.docx" onChange=${onFile} /></label>
        ${fileErr ? html`<p className="err" role="alert"><${Icon} n="alert" size=${14} />${fileErr}</p>` : null}
        <p className="fine">Simulated. The file is checked here but not uploaded anywhere; only its name and size are kept in this browser.</p></section>
      <section className="card"><h2>Resume preview</h2><div className="resume-prev"><b>${f.name || 'Your name'}</b><small>${f.branch} · CGPA ${parseFloat(f.cgpa) ? parseFloat(f.cgpa).toFixed(2) : '—'} · ${user.usn}</small>${f.about ? html`<p>${f.about}</p>` : null}<span className="rp-h">Skills</span><p>${f.skills.slice(0, 8).join(' · ') || '—'}</p>${live.projects[0] ? html`<span className="rp-h">Project</span><p>${live.projects[0].title}${live.projects[0].detail ? ': ' + live.projects[0].detail : ''}</p>` : null}</div></section>
      <section className="card"><h2>Visibility</h2><div className="stack-sm">
        <${Toggle} id="v1" checked=${f.visibility.contact} onChange=${v => vis('contact', v)} label="Share contact details" hint="Recruiters see your email and phone." />
        <${Toggle} id="v2" checked=${f.visibility.resume} onChange=${v => vis('resume', v)} label="Share resume" hint="Recruiters can open your resume card." />
        <${Toggle} id="v3" checked=${f.visibility.searchable} onChange=${v => vis('searchable', v)} label="Appear in candidate search" hint="Recruiters can find you by skill." /></div></section>
    </aside></div>
    <div className="savebar" role="region" aria-label="Save changes"><span className="muted">${dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span><div><${Btn} variant="ghost" disabled=${!dirty} onClick=${() => { setF(base); setErrs({}); setFileErr(''); }}>Cancel<//><${Btn} disabled=${!dirty} onClick=${save}>Save changes<//></div></div></div>`;
}

/* ---------------- Page 6: Explore Jobs ---------------- */
const DEFAULT_F = { q: '', company: '', category: '', type: '', location: '', pkg: '0', mode: '', branch: '', cgpa: '', dl: '' };
function Jobs() {
  const { db, user, go, mutate, toast, ui, setUi } = useApp();
  const [f, setF] = useState({ ...DEFAULT_F, q: ui.q || '' }); const [tab, setTab] = useState('all'); const [sort, setSort] = useState('relevance');
  const [loading, setLoading] = useState(true); const [showF, setShowF] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 450); if (ui.q) setUi(u => ({ ...u, q: '' })); return () => clearTimeout(t); }, []);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const saved = prefsOf(db, user.id).saved, t = TODAY();
  const all = useMemo(() => db.jobs.filter(j => j.status !== 'Draft').map(j => ({ j, ev: evalEligibility(db, user, j) })), [db, user]);
  const locs = [...new Set(db.jobs.filter(j => j.status !== 'Draft').map(j => j.location))].sort();
  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    let r = all.filter(({ j, ev }) => {
      const co = byId(db.companies, j.companyId);
      if (q && !(`${j.title} ${co.name} ${j.skills.join(' ')} ${j.location} ${j.category}`.toLowerCase().includes(q))) return false;
      if (f.company && j.companyId !== f.company) return false;
      if (f.category && j.category !== f.category) return false;
      if (f.type && j.type !== f.type) return false;
      if (f.location && j.location !== f.location) return false;
      if (f.mode && j.mode !== f.mode) return false;
      if (+f.pkg && j.package < +f.pkg) return false;
      if (f.branch && j.branches.length && !j.branches.includes(f.branch)) return false;
      if (f.cgpa && j.minCgpa > +f.cgpa) return false;
      if (f.dl) { const left = diffDays(j.deadline, t); if (left < 0 || left > +f.dl) return false; }
      if (tab === 'eligible' && !(ev.eligible && !ev.closed)) return false;
      if (tab === 'saved' && !saved.includes(j.id)) return false;
      return true;
    });
    const score = ({ j, ev }) => (ev.canApply ? 60 : ev.eligible && !ev.closed ? 40 : 0) + skillMatch(user, j) * 8 + (saved.includes(j.id) ? 6 : 0) + Math.min(10, j.package / 3);
    if (sort === 'relevance') r = r.sort((a, b) => score(b) - score(a));
    if (sort === 'newest') r = r.sort((a, b) => b.j.postedOn.localeCompare(a.j.postedOn));
    if (sort === 'deadline') r = r.sort((a, b) => (a.ev.closed - b.ev.closed) || a.j.deadline.localeCompare(b.j.deadline));
    return r;
  }, [all, f, tab, sort, saved]);
  const activeN = Object.keys(DEFAULT_F).filter(k => String(f[k]) !== String(DEFAULT_F[k])).length;
  const reset = () => { setF(DEFAULT_F); setLoading(true); setTimeout(() => setLoading(false), 300); };
  const counts = { all: all.length, eligible: all.filter(x => x.ev.eligible && !x.ev.closed).length, saved: all.filter(x => saved.includes(x.j.id)).length };
  const open = id => { setUi(u => ({ ...u, lastJob: id })); go('job-' + id); };
  const save = j => { const r = mutate(d => toggleSave(d, user.id, j.id)); toast(r.saved ? `Saved ${j.title}.` : `Removed ${j.title} from saved jobs.`, 'info'); };
  const filters = html`<div className="filters">
    <${TextField} id="jf-q" label="Search" type="search" value=${f.q} onChange=${v => set('q', v)} placeholder="Role, company or skill" />
    <${SelectField} id="jf-co" label="Company" value=${f.company} onChange=${v => set('company', v)} options=${[{ value: '', label: 'All companies' }].concat(db.companies.map(c => ({ value: c.id, label: c.name })))} />
    <${SelectField} id="jf-cat" label="Role" value=${f.category} onChange=${v => set('category', v)} options=${[{ value: '', label: 'All roles' }].concat(CATEGORIES)} />
    <${SelectField} id="jf-type" label="Type" value=${f.type} onChange=${v => set('type', v)} options=${[{ value: '', label: 'Jobs and internships' }, 'Full-time', 'Internship']} />
    <${SelectField} id="jf-loc" label="Location" value=${f.location} onChange=${v => set('location', v)} options=${[{ value: '', label: 'Anywhere' }].concat(locs)} />
    <${SelectField} id="jf-pkg" label="Package" value=${f.pkg} onChange=${v => set('pkg', v)} options=${[{ value: '0', label: 'Any package' }, { value: '6', label: '6 LPA or more' }, { value: '9', label: '9 LPA or more' }, { value: '12', label: '12 LPA or more' }, { value: '16', label: '16 LPA or more' }]} hint="Internships compare on annualised stipend." />
    <${SelectField} id="jf-mode" label="Work mode" value=${f.mode} onChange=${v => set('mode', v)} options=${[{ value: '', label: 'Any mode' }, 'On-site', 'Hybrid', 'Remote']} />
    <${SelectField} id="jf-br" label="Branch" value=${f.branch} onChange=${v => set('branch', v)} options=${[{ value: '', label: 'Any branch' }].concat(BRANCHES)} />
    <${SelectField} id="jf-cg" label="Minimum CGPA required" value=${f.cgpa} onChange=${v => set('cgpa', v)} options=${[{ value: '', label: 'Any cut-off' }, { value: '7', label: 'Up to 7.0' }, { value: '7.5', label: 'Up to 7.5' }, { value: '8', label: 'Up to 8.0' }, { value: '8.5', label: 'Up to 8.5' }]} />
    <${SelectField} id="jf-dl" label="Application deadline" value=${f.dl} onChange=${v => set('dl', v)} options=${[{ value: '', label: 'Any date' }, { value: '7', label: 'Within 7 days' }, { value: '14', label: 'Within 14 days' }, { value: '30', label: 'Within 30 days' }]} />
    <${Btn} variant="ghost" icon="refresh" onClick=${reset} disabled=${!activeN}>Reset filters${activeN ? ` (${activeN})` : ''}<//></div>`;
  return html`<div className="page"><${PageHeader} eyebrow=${`${all.length} listings · Season ${db.season}`} title="Explore opportunities" sub="Every card shows whether you can apply today. Open one to see the full eligibility check." />
    <div className="jobs-layout"><aside className="card filter-card"><button className="filter-toggle" onClick=${() => setShowF(!showF)} aria-expanded=${showF}><${Icon} n="sliders" size=${17} />Filters${activeN ? html`<span className="tab-n">${activeN}</span>` : null}<${Icon} n=${showF ? 'down' : 'right'} size=${16} /></button><div className=${cx('filter-body', showF && 'show')}>${filters}</div></aside>
      <div className="stack"><div className="toolbar"><${Tabs} label="Opportunity groups" value=${tab} onChange=${setTab} items=${[{ id: 'all', label: 'All opportunities', count: counts.all }, { id: 'eligible', label: 'Eligible for me', count: counts.eligible }, { id: 'saved', label: 'Saved jobs', count: counts.saved }]} />
        <${SelectField} id="jf-sort" label="Sort by" value=${sort} onChange=${setSort} options=${[{ value: 'relevance', label: 'Relevance' }, { value: 'newest', label: 'Newest' }, { value: 'deadline', label: 'Deadline' }]} className="sort" /></div>
        <p className="muted" role="status">${loading ? 'Loading listings…' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}</p>
        ${loading ? html`<div className="job-grid"><${CardSkeleton} /><${CardSkeleton} /><${CardSkeleton} /><${CardSkeleton} /></div>` : filtered.length === 0 ? html`<${Empty} icon=${tab === 'saved' ? 'bookmark' : 'search'} title=${tab === 'saved' && !activeN ? 'No saved jobs yet' : 'No listings match'} body=${tab === 'saved' && !activeN ? 'Tap the bookmark on any card to keep it here.' : tab === 'eligible' && !activeN ? 'No open listing passes every eligibility rule for you right now.' : 'Try fewer filters or a different search term.'} action=${activeN || tab !== 'all' ? html`<div className="row-gap">${activeN ? html`<${Btn} onClick=${reset}>Reset filters<//>` : null}${tab !== 'all' ? html`<${Btn} variant="outline" onClick=${() => setTab('all')}>Show all opportunities<//>` : null}</div>` : null} />` : html`<div className="job-grid">${filtered.map(({ j, ev }) => html`<${JobCard} key=${j.id} job=${j} ev=${ev} saved=${saved.includes(j.id)} onSave=${() => save(j)} onOpen=${() => open(j.id)} />`)}</div>`}
      </div></div></div>`;
}

/* ---------------- Page 7: Job Details & Eligibility ---------------- */
function JobDetail({ param }) {
  const { db, user, go, mutate, toast, ui, setUi } = useApp();
  const jid = param || ui.lastJob || (db.jobs.find(j => j.status === 'Open') || {}).id;
  const job = byId(db.jobs, jid);
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false);
  if (!job || job.status === 'Draft') return html`<div className="page"><${Empty} icon="briefcase" title="Listing not found" body="This listing was removed or has not been published." action=${html`<${Btn} onClick=${() => go('jobs')}>Back to opportunities<//>`} /></div>`;
  const co = byId(db.companies, job.companyId), ev = evalEligibility(db, user, job);
  const saved = prefsOf(db, user.id).saved.includes(job.id);
  const apply = () => { setBusy(true); setTimeout(() => { const r = mutate(d => applyToJob(d, user.id, job.id)); setBusy(false); setConfirm(false); toast(r.msg, r.ok ? 'ok' : 'bad'); }, 550); };
  const dl = job.deadline, t = TODAY();
  const tl = [['Applications open', job.postedOn], ['Applications close', dl], ['Shortlist announced', addDays(3, dl)], ['Interview rounds', addDays(5, dl)], ['Offers released', addDays(14, dl)]];
  const sameJob = !!ev.existing && ev.existing.jobId === job.id;
  const closedB = ev.blockers.find(b => b.key === 'closed');
  const reason = sameJob ? (closedB ? closedB.msg : '') : ev.blockers[0] ? ev.blockers[0].msg : '';
  return html`<div className="page"><button className="link back" onClick=${() => go('jobs')}><${Icon} n="left" size=${15} />All opportunities</button>
    <header className="job-hero card"><${CompanyLogo} co=${co} size=${64} /><div className="grow"><p className="eyebrow">${co.name} · ${job.category} · ${job.type}</p><h1>${job.title}</h1><div className="jobcard-meta"><span className="pkg">${pkgLabel(job)}</span><span><${Icon} n="pin" size=${14} />${job.location}</span><span><${Icon} n="building" size=${14} />${job.mode}</span><span><${Icon} n="clock" size=${14} />Apply by ${fmtDate(job.deadline)}</span></div></div><div className="chips">${deadlineChip(job)}${eligChip(ev, job)}</div></header>
    <div className="grid-detail"><div className="stack">
      <section className="card"><h2>About the role</h2><p>${job.summary}</p><h3>Responsibilities</h3><ul className="bullets">${job.responsibilities.map(r => html`<li key=${r}>${r}</li>`)}</ul><h3>Skills they look for</h3><div className="chips">${job.skills.map(s => html`<${Chip} key=${s} tone=${user.skills.includes(s) ? 'good' : 'neutral'} icon=${user.skills.includes(s) ? 'check' : undefined}>${s}<//>`)}</div><p className="fine">Green skills are already on your profile.</p><h3>Benefits</h3><ul className="bullets">${job.benefits.map(r => html`<li key=${r}>${r}</li>`)}</ul></section>
      <section className="card"><h2>Recruitment timeline</h2><ol className="timeline">${tl.map((x, i) => html`<li key=${x[0]} className=${x[1] <= t ? 'done' : ''}><span className="tl-dot"></span><div><b>${x[0]}</b><p className="muted">${i === 3 ? `${fmtDate(x[1])} onward` : fmtDate(x[1])}${x[1] <= t ? ' · done' : ''}</p></div></li>`)}</ol><p className="fine">Dates after the deadline are the company's planned schedule and may shift.</p></section>
      <section className="card"><div className="card-head"><h2>About ${co.name}</h2></div><p>${co.about}</p><dl className="facts"><div><dt>Sector</dt><dd>${co.sector}</dd></div><div><dt>Headquarters</dt><dd>${co.hq}</dd></div><div><dt>Size</dt><dd>${co.size}</dd></div><div><dt>Website</dt><dd>${co.website}</dd></div></dl></section>
    </div>
    <aside className="stack sticky-col">
      <section className="card"><div className="card-head"><h2>Your eligibility</h2>${ev.eligible ? html`<${Chip} tone="good" icon="shield">All rules met<//>` : html`<${Chip} tone="bad" icon="x">${ev.checks.filter(c => !c.pass).length} rule${ev.checks.filter(c => !c.pass).length > 1 ? 's' : ''} not met<//>`}</div>
        <ul className="elig">${ev.checks.map(c => html`<li key=${c.key} className=${c.pass ? 'ok' : 'no'}><span className="elig-ic"><${Icon} n=${c.pass ? 'check' : 'x'} size=${14} /></span><div><b>${c.title}</b><small>Required: ${c.req}</small><p>${c.detail}</p></div></li>`)}</ul></section>
      <section className="card apply-card">
        ${sameJob ? html`<${Btn} size="lg" className="w-full" disabled icon="check">Applied · ${ev.existing.status}<//><button className="link" onClick=${() => go('applications')}>Track this application</button>` : html`<${Btn} size="lg" className="w-full" disabled=${!ev.canApply} onClick=${() => setConfirm(true)}>Apply now<//>`}
        ${!ev.canApply && reason ? html`<p className="blocked" role="status"><${Icon} n="info" size=${15} />${reason}</p>` : null}
        <${Btn} variant="outline" className="w-full" icon="bookmark" onClick=${() => { const r = mutate(d => toggleSave(d, user.id, job.id)); toast(r.saved ? 'Job saved.' : 'Removed from saved jobs.', 'info'); }} aria-pressed=${saved}>${saved ? 'Saved' : 'Save job'}<//>
      </section></aside></div>
    ${confirm ? html`<${Confirm} title="Submit your application?" confirmLabel="Submit application" onConfirm=${apply} onClose=${() => setConfirm(false)} loading=${busy}><p>You are applying for <b>${job.title}</b> at <b>${co.name}</b>.</p><ul className="bullets"><li>This counts as your one application to ${co.name} this season.</li><li>Your profile, CGPA and resume card are shared with the recruiter.</li><li>You cannot move this application backwards or reapply to ${co.name} later.</li></ul><p className="fine">Simulated in the demo: no email is sent.</p><//>` : null}</div>`;
}

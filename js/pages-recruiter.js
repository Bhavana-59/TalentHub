/* Page 11: Recruiter Workspace. Every query is scoped to the signed-in recruiter's company. */
const REC_TABS = [{ id: 'overview', label: 'Overview' }, { id: 'listings', label: 'Listings' }, { id: 'applicants', label: 'Applicants' }, { id: 'company', label: 'Company' }];
const ROUNDS = ['Online Assessment', 'Technical Interview', 'Managerial Round', 'HR Interview'];
const REJECT_REASONS = ['Skills do not match the role', 'Did not meet the selection criteria', 'Position filled by another candidate', 'Assessment score below cut-off'];

function Metric({ icon, value, label, tone }) {
  return html`<div className=${cx('card', 'metric', tone && 'metric-' + tone)}><span className="stat-ic"><${Icon} n=${icon} size=${19} /></span><b>${value}</b><span>${label}</span></div>`;
}

function JobForm({ job, companyId, onClose }) {
  const { mutate, toast, user } = useApp();
  const editing = !!job;
  const [f, setF] = useState(() => job ? { title: job.title, type: job.type, category: job.category, package: String(job.package), location: job.location, mode: job.mode, minCgpa: String(job.minCgpa), maxBacklogs: String(job.maxBacklogs), branches: job.branches, deadline: job.deadline, skills: job.skills.join(', '), summary: job.summary, resp: job.responsibilities.join('\n') } : { title: '', type: 'Full-time', category: 'Engineering', package: '', location: '', mode: 'Hybrid', minCgpa: '7.0', maxBacklogs: '0', branches: [], deadline: addDays(14), skills: '', summary: '', resp: '' });
  const [errs, setErrs] = useState({});
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const validate = publish => {
    const e = {};
    if (f.title.trim().length < 3) e.title = 'Give the role a title of at least 3 characters.';
    if (!(parseFloat(f.package) > 0)) e.package = 'Enter the package in LPA, for example 12.';
    if (!f.location.trim()) e.location = 'Enter a city or Remote.';
    const c = parseFloat(f.minCgpa); if (isNaN(c) || c < 0 || c > 10) e.minCgpa = 'Minimum CGPA must be between 0 and 10.';
    if (!/^\d+$/.test(f.maxBacklogs)) e.maxBacklogs = 'Enter a whole number, 0 or more.';
    if (!f.skills.split(',').some(s => s.trim())) e.skills = 'List at least one skill, separated by commas.';
    if (f.summary.trim().length < 20) e.summary = 'Describe the role in at least 20 characters.';
    if (!f.deadline) e.deadline = 'Choose an application deadline.'; else if (publish && f.deadline < TODAY()) e.deadline = 'The deadline must be today or later to publish.';
    setErrs(e); return Object.keys(e).length === 0;
  };
  const save = status => {
    if (!validate(status === 'Open')) { toast('Fix the highlighted fields first.', 'bad'); return; }
    const t = f.type;
    const obj = { id: job ? job.id : uid('j'), companyId, title: f.title.trim(), type: t, category: f.category, package: parseFloat(f.package), location: f.location.trim(), mode: f.mode, minCgpa: Math.round(parseFloat(f.minCgpa) * 100) / 100, maxBacklogs: +f.maxBacklogs, branches: f.branches, postedOn: job ? job.postedOn : TODAY(), deadline: f.deadline, status: status || job.status, skills: f.skills.split(',').map(s => s.trim()).filter(Boolean), summary: f.summary.trim(), responsibilities: f.resp.split('\n').map(s => s.trim()).filter(Boolean), benefits: job ? job.benefits : (t === 'Internship' ? ['Monthly stipend paid on the 1st', 'Pre-placement offer track', 'Mentor with weekly reviews', 'Completion certificate'] : ['Health cover', 'Dedicated mentor', 'Annual learning budget', 'Relocation support']) };
    if (!obj.responsibilities.length) obj.responsibilities = ['Responsibilities will be shared in the first interview round.'];
    mutate(d => saveJob(d, obj, { name: user.name, role: 'recruiter' }));
    toast(status === 'Open' ? `${obj.title} is published.` : editing ? 'Listing updated.' : 'Draft saved. Publish it when you are ready.'); onClose();
  };
  const isOpen = job && job.status === 'Open';
  return html`<${Modal} title=${editing ? 'Edit listing' : 'Create listing'} wide onClose=${onClose} footer=${html`<${Btn} variant="ghost" onClick=${onClose}>Cancel<//>${editing && isOpen ? html`<${Btn} onClick=${() => save('Open')}>Save changes<//>` : html`<${Btn} variant="outline" onClick=${() => save('Draft')}>${editing ? 'Save as draft' : 'Save draft'}<//><${Btn} onClick=${() => save('Open')}>Publish listing<//>`}`}>
    <div className="form-grid">
      <${TextField} id="jl-title" label="Role title" value=${f.title} onChange=${v => set('title', v)} error=${errs.title} className="span2" />
      <${SelectField} id="jl-type" label="Type" value=${f.type} onChange=${v => set('type', v)} options=${['Full-time', 'Internship']} />
      <${SelectField} id="jl-cat" label="Role family" value=${f.category} onChange=${v => set('category', v)} options=${CATEGORIES} />
      <${TextField} id="jl-pkg" label="Package (LPA)" type="number" step="0.1" min="0" value=${f.package} onChange=${v => set('package', v)} error=${errs.package} hint="For internships, enter the annualised stipend." />
      <${TextField} id="jl-loc" label="Location" value=${f.location} onChange=${v => set('location', v)} error=${errs.location} />
      <${SelectField} id="jl-mode" label="Work mode" value=${f.mode} onChange=${v => set('mode', v)} options=${['On-site', 'Hybrid', 'Remote']} />
      <${TextField} id="jl-dl" label="Application deadline" type="date" value=${f.deadline} onChange=${v => set('deadline', v)} error=${errs.deadline} />
      <${TextField} id="jl-cg" label="Minimum CGPA" type="number" step="0.01" min="0" max="10" value=${f.minCgpa} onChange=${v => set('minCgpa', v)} error=${errs.minCgpa} hint="Students at exactly this CGPA qualify." />
      <${TextField} id="jl-bl" label="Active backlogs allowed" type="number" min="0" value=${f.maxBacklogs} onChange=${v => set('maxBacklogs', v)} error=${errs.maxBacklogs} hint="Cleared backlogs never count." />
      <div className="field span2"><span className="lbl">Allowed branches</span><${BranchPicker} value=${f.branches} onChange=${v => set('branches', v)} /><p className="hint">${f.branches.length ? `Open to ${f.branches.join(', ')}.` : 'None selected means the drive is open to every branch.'}</p></div>
      <${TextField} id="jl-sk" label="Required skills" value=${f.skills} onChange=${v => set('skills', v)} error=${errs.skills} hint="Comma separated, for example Python, SQL." className="span2" />
      <${TextArea} id="jl-sum" label="About the role" value=${f.summary} onChange=${v => set('summary', v)} error=${errs.summary} className="span2" />
      <${TextArea} id="jl-resp" label="Responsibilities" value=${f.resp} onChange=${v => set('resp', v)} hint="One responsibility per line." rows=${3} className="span2" /></div><//>`;
}

function Recruiter({ param }) {
  const { db, user, go, mutate, toast, ui, setUi } = useApp();
  const tab = REC_TABS.some(t => t.id === param) ? param : 'overview';
  const co = byId(db.companies, user.companyId);
  const actor = { name: user.name, role: 'recruiter' };
  const jobs = db.jobs.filter(j => j.companyId === co.id);
  const apps = db.applications.filter(a => a.companyId === co.id);
  const ivs = db.interviews.filter(i => i.companyId === co.id);
  const offers = db.offers.filter(o => o.companyId === co.id);
  const [form, setForm] = useState(null), [closing, setClosing] = useState(null), [act, setAct] = useState(null);
  const [q, setQ] = useState(ui.q || ''), [jf, setJf] = useState(ui.jobFilter || ''), [sf, setSf] = useState(''), [ef, setEf] = useState(''), [page, setPage] = useState(1);
  useEffect(() => { if (ui.q || ui.jobFilter) setUi(u => ({ ...u, q: '', jobFilter: '' })); }, []);
  useEffect(() => setPage(1), [q, jf, sf, ef]);
  const [cf, setCf] = useState({ about: co.about, website: co.website, hq: co.hq, size: co.size, rname: user.name, rtitle: user.title });
  const guard = app => { if (!app || app.companyId !== co.id) { toast('You can only manage candidates for your own company.', 'bad'); return false; } return true; };
  const run = (fn, ok) => { const r = mutate(fn); toast(r.msg || ok || 'Done.', r.ok ? 'ok' : 'bad'); return r; };

  const rows = useMemo(() => apps.map(a => { const st = byId(db.students, a.studentId), job = byId(db.jobs, a.jobId); return { a, st, job, ev: evalEligibility(db, st, job) }; }), [db]);
  const filtered = rows.filter(({ a, st, job, ev }) => {
    const s = q.trim().toLowerCase();
    if (s && !(`${st.name} ${st.usn} ${st.branch} ${st.skills.join(' ')}`.toLowerCase().includes(s))) return false;
    if (jf && a.jobId !== jf) return false; if (sf && a.status !== sf) return false;
    if (ef === 'yes' && !ev.eligible) return false; if (ef === 'no' && ev.eligible) return false; return true;
  }).sort((x, y) => y.a.updatedOn.localeCompare(x.a.updatedOn));
  const SIZE = 8, pages = Math.max(1, Math.ceil(filtered.length / SIZE)), view = filtered.slice((page - 1) * SIZE, page * SIZE);

  const metrics = [['briefcase', jobs.filter(j => j.status === 'Open').length, 'Open listings'], ['users', apps.length, 'Applicants'], ['check', apps.filter(a => a.status === 'Shortlisted').length, 'Awaiting interview'], ['calendar', ivs.filter(i => i.status === 'Scheduled').length, 'Interviews scheduled'], ['award', offers.length, 'Offers issued']];
  const pipe = ALL_STATUSES.map(s => ({ label: s, value: apps.filter(a => a.status === s).length, tone: STATUS_META[s][0] }));

  const body = tab === 'overview' ? html`<div className="stack"><div className="grid-5">${metrics.map(m => html`<${Metric} key=${m[2]} icon=${m[0]} value=${m[1]} label=${m[2]} tone="rec" />`)}</div>
      <div className="grid-main"><section className="card"><h2>Pipeline by stage</h2><${BarList} data=${pipe} /></section>
        <section className="card"><div className="card-head"><h2>Next interviews</h2><button className="link" onClick=${() => go('recruiter-applicants')}>Open applicants</button></div>${ivs.filter(i => i.status === 'Scheduled').length ? html`<ul className="rows">${ivs.filter(i => i.status === 'Scheduled').sort(cmpIv).slice(0, 5).map(i => { const st = byId(db.students, i.studentId); return html`<li key=${i.id} className="row-iv"><span className="datebox"><b>${parseD(i.date).getDate()}</b><small>${parseD(i.date).toLocaleDateString('en-IN', { month: 'short' })}</small></span><div className="grow"><b>${st.name}</b><p className="muted">${i.round} · ${i.time}</p></div></li>`; })}</ul>` : html`<${Empty} icon="calendar" title="No interviews booked" body="Schedule interviews from the Applicants tab." />`}</section></div>
      <section className="card"><div className="card-head"><h2>Newest applicants</h2><button className="link" onClick=${() => go('recruiter-applicants')}>See all</button></div>${rows.length ? html`<ul className="rows">${rows.slice().sort((x, y) => y.a.appliedOn.localeCompare(x.a.appliedOn)).slice(0, 5).map(({ a, st, job }) => html`<li key=${a.id} className="row-job"><${Avatar} name=${st.name} /><div className="grow"><b>${st.name}</b><p className="muted">${st.branch} · CGPA ${st.cgpa.toFixed(2)} · ${job.title}</p></div><${StatusChip} s=${a.status} /></li>`)}</ul>` : html`<p className="muted">No applicants yet.</p>`}</section></div>`
    : tab === 'listings' ? html`<section className="card"><div className="card-head"><h2>Your listings</h2><${Btn} icon="plus" onClick=${() => setForm({})}>Create listing<//></div>
      ${jobs.length ? html`<div className="tablewrap"><table className="table"><thead><tr><th>Role</th><th>Package</th><th>Criteria</th><th>Deadline</th><th>Applicants</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead><tbody>${jobs.map(j => { const n = apps.filter(a => a.jobId === j.id).length; return html`<tr key=${j.id}><td><b>${j.title}</b><small>${j.type} · ${j.location}</small></td><td>${pkgLabel(j)}</td><td><small className="nowrap-no">${eligSummary(j)}</small></td><td>${fmtDate(j.deadline)}</td><td>${n ? html`<button className="link" onClick=${() => { setUi(u => ({ ...u, jobFilter: j.id })); go('recruiter-applicants'); }}>${n}</button>` : 0}</td><td><${StatusChip} s=${j.status} /></td><td className="actions"><${Btn} variant="ghost" size="sm" icon="edit" onClick=${() => setForm(j)}>Edit<//>${j.status === 'Draft' ? html`<${Btn} size="sm" onClick=${() => run(d => setJobStatus(d, j.id, 'Open', actor))}>Publish<//>` : j.status === 'Open' ? html`<${Btn} variant="outline" size="sm" onClick=${() => setClosing(j)}>Close<//>` : null}</td></tr>`; })}</tbody></table></div>` : html`<${Empty} icon="briefcase" title="No listings yet" body="Create your first listing to start receiving applications." action=${html`<${Btn} onClick=${() => setForm({})}>Create listing<//>`} />`}
      <p className="fine">Closed listings stop accepting applications. Closing never removes existing applicants.</p></section>`
      : tab === 'applicants' ? html`<section className="card"><h2>Applicants</h2>
        <div className="form-row"><${TextField} id="rc-q" label="Search" type="search" value=${q} onChange=${setQ} placeholder="Name, USN, skill or branch" className="grow" />
          <${SelectField} id="rc-j" label="Listing" value=${jf} onChange=${setJf} options=${[{ value: '', label: 'All listings' }].concat(jobs.filter(j => j.status !== 'Draft').map(j => ({ value: j.id, label: j.title })))} />
          <${SelectField} id="rc-s" label="Stage" value=${sf} onChange=${setSf} options=${[{ value: '', label: 'All stages' }].concat(ALL_STATUSES)} />
          <${SelectField} id="rc-e" label="Eligibility" value=${ef} onChange=${setEf} options=${[{ value: '', label: 'Any' }, { value: 'yes', label: 'Eligible' }, { value: 'no', label: 'Not eligible' }]} /></div>
        ${view.length ? html`<div className="tablewrap"><table className="table"><thead><tr><th>Candidate</th><th>Branch</th><th>CGPA</th><th>Skills</th><th>Eligibility</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead><tbody>${view.map(({ a, st, job, ev }) => { const bad = ev.checks.find(c => !c.pass); return html`<tr key=${a.id}><td><div className="who"><${Avatar} name=${st.name} size=${32} /><div><b>${st.name}</b><small>${st.usn} · ${job.title}</small>${st.visibility.contact ? html`<small>${st.email}</small>` : html`<small className="dim">Contact hidden by student</small>`}</div></div></td><td>${st.branch}</td><td className="num">${st.cgpa.toFixed(2)}</td><td><div className="chips">${st.skills.slice(0, 3).map(s => html`<${Chip} key=${s}>${s}<//>`)}${st.skills.length > 3 ? html`<span className="muted">+${st.skills.length - 3}</span>` : null}</div></td><td>${ev.eligible ? html`<${Chip} tone="good" icon="shield">Eligible<//>` : html`<${Chip} tone="bad" icon="x">${bad.title}<//>`}</td><td><${StatusChip} s=${a.status} /></td><td className="actions">${a.status === 'Applied' ? html`<${Btn} size="sm" onClick=${() => setAct({ type: 'shortlist', a, st, job })}>Shortlist<//>` : a.status === 'Shortlisted' ? html`<${Btn} size="sm" onClick=${() => setAct({ type: 'schedule', a, st, job })}>Schedule<//>` : a.status === 'Interview Scheduled' ? html`<${Btn} size="sm" onClick=${() => setAct({ type: 'outcome', a, st, job })}>Record outcome<//>` : a.status === 'Interviewed' ? html`<${Btn} size="sm" variant="lime" onClick=${() => setAct({ type: 'offer', a, st, job })}>Issue offer<//>` : html`<span className="muted">${a.status === 'Offered' ? 'Offer sent' : a.status === 'Accepted' ? 'Accepted' : 'Closed'}</span>`}${isActive(a) && a.status !== 'Offered' ? html`<${Btn} variant="ghost" size="sm" onClick=${() => setAct({ type: 'reject', a, st, job })}>Reject<//>` : null}</td></tr>`; })}</tbody></table></div><${Pager} page=${page} pages=${pages} onPage=${setPage} total=${filtered.length} size=${SIZE} />`
          : html`<${Empty} title=${rows.length ? 'No applicants match' : 'No applicants yet'} body=${rows.length ? 'Clear a filter or search for a different name.' : 'Applicants appear here once students apply to your listings.'} action=${rows.length ? html`<${Btn} variant="outline" onClick=${() => { setQ(''); setJf(''); setSf(''); setEf(''); }}>Clear filters<//>` : null} />`}
        <p className="fine">Showing candidate records for ${co.name} only. Names and records are synthetic demo data.</p></section>`
        : html`<div className="grid-2"><section className="card"><h2>Company profile</h2><div className="form-stack"><${TextField} id="cp-name" label="Company" value=${co.name} onChange=${() => { }} readOnly hint="Managed by the placement office." /><${TextField} id="cp-hq" label="Headquarters" value=${cf.hq} onChange=${v => setCf(p => ({ ...p, hq: v }))} /><${TextField} id="cp-size" label="Company size" value=${cf.size} onChange=${v => setCf(p => ({ ...p, size: v }))} /><${TextField} id="cp-web" label="Website" value=${cf.website} onChange=${v => setCf(p => ({ ...p, website: v }))} /><${TextArea} id="cp-about" label="About" value=${cf.about} onChange=${v => setCf(p => ({ ...p, about: v }))} rows=${4} /></div></section>
          <section className="card"><h2>Recruiter details</h2><div className="form-stack"><${TextField} id="rd-name" label="Name" value=${cf.rname} onChange=${v => setCf(p => ({ ...p, rname: v }))} /><${TextField} id="rd-title" label="Title" value=${cf.rtitle} onChange=${v => setCf(p => ({ ...p, rtitle: v }))} /><${TextField} id="rd-mail" label="Email" value=${user.email} onChange=${() => { }} readOnly /></div>
            <div className="row-gap"><${Btn} onClick=${() => { if (cf.rname.trim().length < 2 || cf.about.trim().length < 10) { toast('Add a recruiter name and a company description of at least 10 characters.', 'bad'); return; } mutate(d => { const c = byId(d.companies, co.id); Object.assign(c, { about: cf.about, website: cf.website, hq: cf.hq, size: cf.size }); const r = byId(d.recruiters, user.id); r.name = cf.rname.trim(); r.title = cf.rtitle; logAudit(d, cf.rname, 'recruiter', 'Company profile updated', `${c.name} profile edited.`); }); toast('Company profile saved.'); }}>Save profile<//></div>
            <p className="fine">Access is limited to ${co.name}. Other companies' listings and candidates are never loaded in this workspace.</p></section></div>`;

  const closeJob = () => { run(d => setJobStatus(d, closing.id, 'Closed', actor)); setClosing(null); };
  return html`<div className="page"><${PageHeader} eyebrow=${`Recruiter workspace · ${co.name}`} title=${{ overview: 'Hiring overview', listings: 'Listings', applicants: 'Applicants', company: 'Company and recruiter profile' }[tab]} sub=${`Signed in as ${user.name}, ${user.title}.`} />
    <${Tabs} label="Recruiter sections" value=${tab} onChange=${t => go('recruiter-' + t)} items=${REC_TABS} />
    ${body}
    ${form ? html`<${JobForm} job=${form.id ? form : null} companyId=${co.id} onClose=${() => setForm(null)} />` : null}
    ${closing ? html`<${Confirm} title="Close this listing?" tone="danger" confirmLabel="Close listing" onConfirm=${closeJob} onClose=${() => setClosing(null)}><p><b>${closing.title}</b> will stop accepting applications immediately. Existing applicants stay in your pipeline.</p><//>` : null}
    ${act ? html`<${ActionDialog} act=${act} guard=${guard} run=${run} actor=${actor} onClose=${() => setAct(null)} />` : null}</div>`;
}

function ActionDialog({ act, guard, run, actor, onClose }) {
  const { db } = useApp(); const { a, st, job, type } = act;
  const iv = db.interviews.find(i => i.appId === a.id && i.status === 'Scheduled');
  const [s, setS] = useState({ round: 'Technical Interview', date: addDays(3), time: '11:00', mode: 'Online', venue: '', notes: '' });
  const [o, setO] = useState({ pass: 'pass', final: true, fb: '' }), [pkg, setPkg] = useState(String(job.package)), [rs, setRs] = useState(REJECT_REASONS[0]), [rn, setRn] = useState('');
  const [errs, setErrs] = useState({});
  const go2 = () => {
    if (!guard(a)) return;
    if (type === 'shortlist') { run(d => shortlistApp(d, a.id, actor)); onClose(); }
    if (type === 'schedule') {
      const e = {}; if (!s.venue.trim()) e.venue = s.mode === 'Online' ? 'Add the meeting link.' : 'Add the venue.'; if (!s.date || s.date < TODAY()) e.date = 'Pick today or a future date.'; if (!s.time) e.time = 'Choose a time.';
      setErrs(e); if (Object.keys(e).length) return;
      const r = run(d => scheduleInterview(d, a.id, s, actor)); if (r.ok) onClose(); else setErrs({ form: r.msg });
    }
    if (type === 'outcome') { run(d => recordOutcome(d, iv.id, o.pass === 'pass', o.final, o.fb, actor)); onClose(); }
    if (type === 'offer') { const r = run(d => issueOffer(d, a.id, parseFloat(pkg), actor)); if (r.ok) onClose(); else setErrs({ form: r.msg }); }
    if (type === 'reject') { run(d => rejectApp(d, a.id, rs + (rn.trim() ? '. ' + rn.trim() : '') + '.', actor)); onClose(); }
  };
  const titles = { shortlist: 'Shortlist candidate', schedule: 'Schedule interview', outcome: 'Record interview outcome', offer: 'Issue offer', reject: 'Reject application' };
  const label = { shortlist: 'Shortlist', schedule: 'Schedule interview', outcome: 'Save outcome', offer: 'Issue offer', reject: 'Reject application' }[type];
  return html`<${Confirm} title=${titles[type]} confirmLabel=${label} tone=${type === 'reject' ? 'danger' : 'primary'} onConfirm=${go2} onClose=${onClose}>
    <p className="muted"><b>${st.name}</b> · ${st.branch} · CGPA ${st.cgpa.toFixed(2)} · ${job.title}</p>
    ${errs.form ? html`<div className="notice notice-bad" role="alert"><${Icon} n="alert" size=${16} />${errs.form}</div>` : null}
    ${type === 'shortlist' ? html`<p>${st.name} moves to <b>Shortlisted</b> and is notified. You can schedule interviews next.</p>` : null}
    ${type === 'schedule' ? html`<div className="form-grid"><${SelectField} id="sc-round" label="Round" value=${s.round} onChange=${v => setS(p => ({ ...p, round: v }))} options=${ROUNDS} /><${SelectField} id="sc-mode" label="Mode" value=${s.mode} onChange=${v => setS(p => ({ ...p, mode: v }))} options=${['Online', 'On-campus']} /><${TextField} id="sc-date" label="Date" type="date" value=${s.date} onChange=${v => setS(p => ({ ...p, date: v }))} error=${errs.date} /><${TextField} id="sc-time" label="Time" type="time" value=${s.time} onChange=${v => setS(p => ({ ...p, time: v }))} error=${errs.time} /><${TextField} id="sc-venue" label=${s.mode === 'Online' ? 'Meeting link' : 'Venue'} value=${s.venue} onChange=${v => setS(p => ({ ...p, venue: v }))} error=${errs.venue} className="span2" placeholder=${s.mode === 'Online' ? 'https://meet.example/your-room' : 'Placement Cell, Seminar Hall B'} /><${TextArea} id="sc-notes" label="Preparation notes for the student" value=${s.notes} onChange=${v => setS(p => ({ ...p, notes: v }))} className="span2" rows=${2} /></div>` : null}
    ${type === 'outcome' ? (iv ? html`<p><b>${iv.round}</b> on ${fmtDate(iv.date)} at ${iv.time}.</p><div className="form-stack"><fieldset className="radios"><legend>Result</legend><label><input type="radio" name="res" checked=${o.pass === 'pass'} onChange=${() => setO(p => ({ ...p, pass: 'pass' }))} />Passed</label><label><input type="radio" name="res" checked=${o.pass === 'fail'} onChange=${() => setO(p => ({ ...p, pass: 'fail' }))} />Not selected</label></fieldset>${o.pass === 'pass' ? html`<${Check} id="oc-final" checked=${o.final} onChange=${v => setO(p => ({ ...p, final: v }))}>This was the final round. Mark the interview stage complete so an offer can be issued.<//>` : null}<${TextArea} id="oc-fb" label="Feedback (visible to the student)" value=${o.fb} onChange=${v => setO(p => ({ ...p, fb: v }))} rows=${2} /></div>` : html`<p>No scheduled round to record.</p>`) : null}
    ${type === 'offer' ? html`<div className="form-stack"><p>An offer can be issued only after the interview stage is complete, and an application can have one offer.</p><${TextField} id="of-pkg" label="Package (LPA)" type="number" step="0.1" min="0" value=${pkg} onChange=${setPkg} /></div>` : null}
    ${type === 'reject' ? html`<div className="form-stack"><${SelectField} id="rj-r" label="Reason shown to the student" value=${rs} onChange=${setRs} options=${REJECT_REASONS} /><${TextArea} id="rj-n" label="Extra note (optional)" value=${rn} onChange=${setRn} rows=${2} /></div>` : null}
  <//>`;
}

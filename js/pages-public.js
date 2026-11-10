/* Pages 1-3: Landing, Sign In, Student Registration (plus the access-denied screen). */
const ROLE_OF = { dashboard: 'student', profile: 'student', jobs: 'student', job: 'student', applications: 'student', interviews: 'student', offers: 'student', recruiter: 'recruiter', coordinator: 'coordinator' };
const homeOf = role => role === 'student' ? 'dashboard' : role === 'recruiter' ? 'recruiter-overview' : 'coordinator-overview';
const ROLE_LABEL = { student: 'Student', recruiter: 'Recruiter', coordinator: 'Placement coordinator' };

function HeroArt() {
  const bars = [[40, 300, 70, 190], [128, 240, 70, 250], [216, 170, 70, 320], [304, 100, 70, 390], [392, 40, 70, 450]];
  const labels = ['Profile', 'Apply', 'Shortlist', 'Interview', 'Offer'];
  return html`<svg className="hero-svg" viewBox="0 0 500 540" role="img" aria-label="Five rising columns labelled Profile, Apply, Shortlist, Interview and Offer, joined by a climbing line">
    <defs><linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8B6BFF"/><stop offset="1" stopColor="#4A22D9"/></linearGradient></defs>
    ${[120, 220, 320, 420].map(y => html`<line key=${y} x1="20" x2="480" y1=${y} y2=${y} stroke="#FFFFFF" strokeOpacity="0.07"/>`)}
    ${bars.map((b, i) => html`<g key=${i}><rect x=${b[0]} y=${b[1] + 50} width=${b[2]} height=${b[3]} rx="18" fill=${i === 4 ? '#C8F23A' : 'url(#gv)'} opacity=${i === 4 ? 1 : 0.55 + i * 0.1}/><text x=${b[0] + 35} y="520" textAnchor="middle" fill="#B9BEE8" fontSize="12" fontFamily="JetBrains Mono, monospace">${labels[i]}</text></g>`)}
    <path d="M75 330 L163 270 L251 205 L339 140 L427 82" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 9"/>
    ${[[75, 330], [163, 270], [251, 205], [339, 140]].map((p, i) => html`<circle key=${i} cx=${p[0]} cy=${p[1]} r="9" fill="#0B1030" stroke="#FFFFFF" strokeWidth="3"/>`)}
    <circle cx="427" cy="82" r="14" fill="#C8F23A" stroke="#0B1030" strokeWidth="4"/>
    <path d="M419 82l5 5 10-11" fill="none" stroke="#0B1030" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>`;
}

function Landing() {
  const { db, go, user, setUi } = useApp();
  const t = TODAY();
  const open = db.jobs.filter(j => j.status === 'Open' && j.deadline >= t);
  const top = Math.max(...db.jobs.filter(j => j.type === 'Full-time').map(j => j.package));
  const stats = [[db.students.length, 'Students registered'], [db.companies.length, 'Hiring partners'], [open.length, 'Open listings'], [db.offers.length, 'Offers issued'], [top + ' LPA', 'Highest package listed']];
  const scroll = id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const company = co => { setUi(u => ({ ...u, q: co.name })); go('jobs'); };
  const benefits = [
    ['shield', 'Eligibility you can read', 'Every listing shows CGPA, backlog, branch and offer rules, and tells you exactly why you do or do not qualify.'],
    ['layers', 'One timeline per application', 'Applied to accepted, each application has a single timeline that recruiters and students both see.'],
    ['calendar', 'Interview calendar', 'Rounds, venues, meeting links and preparation notes sit in one agenda with clash checks.'],
    ['award', 'Offers with clear rules', 'Compare offers side by side. Accepting one closes other drives, and the app says so before you confirm.'],
    ['users', 'Recruiter pipeline', 'Shortlist, schedule, record outcomes and issue offers from a single applicant table scoped to your company.'],
    ['chart', 'Coordinator oversight', 'Season metrics, a shortlisting simulator and an audit log keep every drive transparent.']
  ];
  const steps = [['Build your profile', 'Add skills, projects and a resume so recommendations fit you.'], ['Check eligibility', 'Open any listing to see which rules you pass before you apply.'], ['Apply and track', 'Submit once per company and watch the status move stage by stage.'], ['Interview and decide', 'Attend rounds from your calendar, compare offers and accept one.']];
  const quotes = [
    ['I knew why I was shortlisted for one drive and not another. That clarity alone calmed my whole final year.', 'Priya N.', 'CSE, class of 2027'],
    ['Our team moved 40 candidates from shortlist to interview in an afternoon without a single spreadsheet.', 'Arvind K.', 'Campus hiring, a fictional analytics firm'],
    ['The simulator showed me how a CGPA cut-off would change the pool before I published the drive.', 'Dr. Lata S.', 'Placement office, a fictional college']
  ];
  return html`<div className="landing">
    <header className="lnav"><div className="wrap lnav-in"><${Logo} />
      <nav aria-label="Primary" className="lnav-links"><button onClick=${() => scroll('entry')}>Who it is for</button><button onClick=${() => scroll('how')}>How it works</button><button onClick=${() => scroll('partners')}>Partners</button></nav>
      <div className="lnav-cta">${user ? html`<${Btn} onClick=${() => go(homeOf(user.role))} iconRight="arrow">Open workspace<//>` : html`<${Btn} variant="ghost" onClick=${() => go('signin')}>Sign in<//><${Btn} onClick=${() => go('register')}>Join TalentHub<//>`}</div></div></header>
    <section className="hero"><div className="hero-left"><div className="hero-copy">
      <p className="kicker"><span className="dot"></span>Season ${db.season} · demo platform</p>
      <h1>Your Next <span className="hl">Opportunity</span> Starts Here.</h1>
      <p className="tagline">Discover Your Potential. Launch Your Career.</p>
      <p className="lede">TalentHub connects student talent with campus recruiters in one place. Check eligibility before you apply, follow every application, and decide between offers with the placement rules in plain view.</p>
      <div className="hero-cta"><${Btn} size="lg" iconRight="arrow" onClick=${() => go('jobs')}>Explore Opportunities<//><${Btn} variant="outline" size="lg" onClick=${() => go('register')}>Join TalentHub<//></div>
      <ul className="hero-facts"><li><${Icon} n="check" size=${15} />Eligibility shown before you apply</li><li><${Icon} n="check" size=${15} />One timeline per application</li><li><${Icon} n="check" size=${15} />Fictional companies and sample data</li></ul>
    </div></div>
    <div className="hero-right" aria-hidden=${false}><${HeroArt} />
      <div className="float-card" role="group" aria-label="Preview of the student dashboard, sample data">
        <div className="fc-top"><span className="fc-tag">Sample preview</span><span>Student dashboard</span></div>
        <div className="fc-row"><${Ring} value=${86} size=${64} stroke=${7} label="Profile completion" /><div><b>Welcome back, Aanya</b><small>Profile 86% complete</small></div></div>
        <div className="fc-stats"><div><b>7</b><small>Eligible</small></div><div><b>5</b><small>Applied</small></div><div><b>2</b><small>Offers</small></div></div>
        <div className="fc-app"><${CompanyLogo} co=${db.companies[0]} size=${30} /><div><b>Software Development Engineer I</b><small>Northwind Labs</small></div><${Chip} tone="warn" icon="calendar">Interview<//></div>
      </div></div></section>
    <section className="wrap statsband" aria-label="Sample platform statistics"><dl>${stats.map(s => html`<div key=${s[1]}><dt>${s[1]}</dt><dd>${s[0]}</dd></div>`)}</dl><p className="fine">Sample data from this demo season. These are not real placement figures.</p></section>
    <section id="entry" className="wrap sec"><div className="sec-head"><p className="eyebrow">Three workspaces, one platform</p><h2>Start from where you work</h2></div>
      <div className="entry-grid">
        <article className="entry"><${Icon} n="cap" size=${26} /><h3>Students</h3><ul><li>Find drives you are eligible for</li><li>Apply once and track every stage</li><li>Manage interviews and offers</li></ul><div className="entry-cta"><${Btn} onClick=${() => go('signin-student')}>Student sign in<//><${Btn} variant="ghost" onClick=${() => go('register')}>Create account<//></div></article>
        <article className="entry entry-rec"><${Icon} n="briefcase" size=${26} /><h3>Recruiters</h3><ul><li>Publish and close listings</li><li>Shortlist, schedule and issue offers</li><li>See only your own company's candidates</li></ul><div className="entry-cta"><${Btn} variant="lime" onClick=${() => go('signin-recruiter')}>Recruiter sign in<//></div></article>
        <article className="entry"><${Icon} n="layers" size=${26} /><h3>Placement coordinators</h3><ul><li>Season metrics and drive calendar</li><li>Eligibility rules and shortlisting simulator</li><li>Audit log and CSV exports</li></ul><div className="entry-cta"><${Btn} onClick=${() => go('signin-coordinator')}>Coordinator sign in<//></div></article>
      </div></section>
    <section className="band-soft"><div className="wrap sec"><div className="sec-head"><p className="eyebrow">Why TalentHub</p><h2>Placement season, without the guesswork</h2></div>
      <div className="benefit-grid">${benefits.map(b => html`<article key=${b[1]} className="benefit"><span className="benefit-ic"><${Icon} n=${b[0]} size=${20} /></span><h3>${b[1]}</h3><p>${b[2]}</p></article>`)}</div></div></section>
    <section id="how" className="wrap sec"><div className="sec-head"><p className="eyebrow">How it works</p><h2>Four steps from profile to offer</h2></div>
      <ol className="how">${steps.map((s, i) => html`<li key=${s[0]}><span className="how-n">${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p></li>`)}</ol></section>
    <section id="partners" className="band-soft"><div className="wrap sec"><div className="sec-head"><p className="eyebrow">Featured companies (fictional)</p><h2>Eight partners hiring this season</h2></div>
      <div className="partner-grid">${db.companies.map(co => { const n = open.filter(j => j.companyId === co.id).length; return html`<button key=${co.id} className="partner" onClick=${() => company(co)}><${CompanyLogo} co=${co} size=${46} /><span><b>${co.name}</b><small>${co.sector}</small></span><${Chip} tone=${n ? 'good' : 'neutral'}>${n} open<//></button>`; })}</div></div></section>
    <section className="wrap sec"><div className="sec-head"><p className="eyebrow">Testimonials · fictional examples</p><h2>What the experience should feel like</h2></div>
      <div className="quote-grid">${quotes.map(q => html`<figure key=${q[1]} className="quote"><blockquote>${q[0]}</blockquote><figcaption><${Avatar} name=${q[1]} size=${38} /><span><b>${q[1]}</b><small>${q[2]}</small></span></figcaption><span className="fictional">Fictional example</span></figure>`)}</div></section>
    <section className="wrap"><div className="cta-band"><div><h2>Ready to see your season?</h2><p>Use the demo accounts to explore every workspace. Nothing you do here leaves your browser.</p></div><div className="cta-actions"><${Btn} variant="lime" size="lg" onClick=${() => go('signin')}>Sign in to the demo<//><${Btn} variant="outlineLight" size="lg" onClick=${() => go('register')}>Create a student account<//></div></div></section>
    <footer className="lfoot"><div className="wrap lfoot-in"><div><${Logo} /><p>Discover Your Potential. Launch Your Career.</p><p className="fine">TalentHub is a demonstration product. All companies, students and testimonials are fictional, and no email, upload or database service is connected.</p></div>
      <nav aria-label="Footer"><b>Workspaces</b><button onClick=${() => go('signin-student')}>Students</button><button onClick=${() => go('signin-recruiter')}>Recruiters</button><button onClick=${() => go('signin-coordinator')}>Coordinators</button></nav>
      <nav aria-label="Account"><b>Account</b><button onClick=${() => go('signin')}>Sign in</button><button onClick=${() => go('register')}>Create account</button><button onClick=${() => scroll('how')}>How it works</button></nav></div></footer>
  </div>`;
}

const ROLE_TABS = [{ id: 'student', label: 'Student' }, { id: 'recruiter', label: 'Recruiter' }, { id: 'coordinator', label: 'Coordinator' }];
const DEMO_ACCOUNTS = { student: 'aanya.rao@campus-demo.edu', recruiter: 'meera.iyer@northwind-demo.com', coordinator: 'placement@campus-demo.edu' };

function AuthShell({ children, side }) {
  const { go } = useApp();
  return html`<div className="auth"><div className="auth-main"><button className="auth-brand" onClick=${() => go('landing')} aria-label="Back to the TalentHub home page"><${Logo} /></button>${children}</div>
    <aside className="auth-side"><div><p className="kicker kicker-light"><span className="dot"></span>Demo environment</p>${side}</div></aside></div>`;
}

function SignIn({ param }) {
  const { db, go, mutate, toast, ui, setUi } = useApp();
  const valid = ['student', 'recruiter', 'coordinator'];
  const [role, setRole] = useState(valid.includes(param) ? param : 'student');
  useEffect(() => { if (valid.includes(param)) setRole(param); }, [param]);
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [show, setShow] = useState(false), [remember, setRemember] = useState(true);
  const [err, setErr] = useState({}), [formErr, setFormErr] = useState(''), [loading, setLoading] = useState(false), [forgot, setForgot] = useState(false);
  const fill = r => { setRole(r); setEmail(DEMO_ACCOUNTS[r]); setPw(DEMO_PASSWORD); setErr({}); setFormErr(''); };
  const submit = e => {
    e.preventDefault(); const er = {};
    if (!email.trim()) er.email = 'Enter your email address.'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) er.email = 'This does not look like an email address. Check for a missing @ or domain.';
    if (!pw) er.password = 'Enter your password.';
    setErr(er); setFormErr(''); if (Object.keys(er).length) return;
    setLoading(true);
    setTimeout(() => {
      const res = authenticate(db, role, email, pw); setLoading(false);
      if (!res.ok) { setErr({ [res.field]: res.msg }); setFormErr(res.msg); return; }
      try { sessionStorage.setItem('th_live', '1'); } catch (x) { }
      mutate(d => { d.session = { role, id: res.user.id, remember }; });
      const nextPage = ui.next ? ui.next.split('-')[0] : null;
      const dest = nextPage && ROLE_OF[nextPage] === role ? ui.next : homeOf(role);
      setUi(u => ({ ...u, next: null, notice: null }));
      toast(`Signed in as ${res.user.name}. This is a demo session stored in your browser.`); go(dest);
    }, 650);
  };
  const side = html`<h2>Sign in, then try every part of the season.</h2><p>Use the sample accounts to move between the student, recruiter and coordinator workspaces. Each role sees only what it is allowed to see.</p>
    <div className="demo-accounts"><b>Sample accounts</b>${valid.map(r => html`<button key=${r} type="button" onClick=${() => fill(r)}><span><${Icon} n=${r === 'student' ? 'cap' : r === 'recruiter' ? 'briefcase' : 'layers'} size=${16} />${ROLE_LABEL[r]}</span><small>${DEMO_ACCOUNTS[r]}</small></button>`)}<p className="fine">Password for all three: <code>Demo@1234</code>. Selecting one fills the form.</p></div>`;
  return html`<${AuthShell} side=${side}>
    <div className="auth-card"><h1>Welcome back</h1><p className="muted">Sign in to your TalentHub workspace.</p>
      ${ui.notice ? html`<div className="notice notice-info" role="status"><${Icon} n="info" size=${16} />${ui.notice}</div>` : null}
      <${Tabs} label="Account type" value=${role} onChange=${r => { setRole(r); setErr({}); setFormErr(''); }} items=${ROLE_TABS} />
      ${formErr ? html`<div className="notice notice-bad" role="alert"><${Icon} n="alert" size=${16} />${formErr}</div>` : null}
      <form onSubmit=${submit} noValidate className="form-stack">
        <${TextField} id="si-email" label="Email" type="email" autoComplete="username" value=${email} onChange=${setEmail} error=${err.email} placeholder=${DEMO_ACCOUNTS[role]} />
        <${Field} id="si-pw" label="Password" error=${err.password}><div className="pw"><input id="si-pw" type=${show ? 'text' : 'password'} value=${pw} autoComplete="current-password" onChange=${e => setPw(e.target.value)} aria-invalid=${err.password ? 'true' : undefined} /><button type="button" className="icon-btn" onClick=${() => setShow(!show)} aria-label=${show ? 'Hide password' : 'Show password'} aria-pressed=${show}><${Icon} n=${show ? 'eyeoff' : 'eye'} /></button></div><//>
        <div className="row-between"><${Check} id="si-rem" checked=${remember} onChange=${setRemember}>Remember me<//><button type="button" className="link" onClick=${() => setForgot(true)}>Forgot password?</button></div>
        <${Btn} type="submit" size="lg" loading=${loading} className="w-full">${loading ? 'Signing in…' : 'Sign in as ' + ROLE_LABEL[role].toLowerCase()}<//>
      </form>
      <div className="divider"><span>or</span></div>
      <${Btn} variant="outline" className="w-full" onClick=${() => toast('Google sign-in is a demo control. No Google account is connected here. Use a sample account instead.', 'info')}><span className="g-mark" aria-hidden="true">G</span>Continue with Google (demo only)<//>
      ${role === 'student' ? html`<p className="auth-alt">New to TalentHub? <button className="link" onClick=${() => go('register')}>Create a student account</button></p>` : html`<p className="auth-alt">Recruiter and coordinator accounts are created by the placement office.</p>`}
    </div>
    ${forgot ? html`<${Modal} title="Reset your password" onClose=${() => setForgot(false)} footer=${html`<${Btn} onClick=${() => setForgot(false)}>Got it<//>`}><p>This demo does not send email, so there is no reset link. The sample accounts use <code>Demo@1234</code>. For an account you registered here, create a new one from the registration page.</p><p className="muted">A production build would email a one-time reset link through the college's mail service.</p><//>` : null}
  <//>`;
}

const pwStrength = p => { let s = 0; if (p.length >= 8) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++; return p ? Math.max(1, s) : 0; };
const STRENGTH = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function Register() {
  const { db, go, mutate, toast } = useApp();
  const [f, setF] = useState({ name: '', email: '', usn: '', branch: '', gradYear: '2027', cgpa: '', password: '', confirm: '', consent: false });
  const [touched, setTouched] = useState({}), [loading, setLoading] = useState(false), [srv, setSrv] = useState({});
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setSrv(s => ({ ...s, [k]: undefined })); };
  const errors = useMemo(() => {
    const e = {};
    if (f.name.trim().length < 3) e.name = 'Enter your full name as it appears on college records.';
    if (!/^[^\s@]+@[^\s@]+\.(edu|edu\.in|ac\.in)$/i.test(f.email.trim())) e.email = 'Use your college email. It should end in .edu, .edu.in or .ac.in.';
    if (!/^\d[A-Za-z]{2}\d{2}[A-Za-z]{2,3}\d{3}$/.test(f.usn.trim())) e.usn = 'Enter a USN like 1TH22CS045.';
    if (!f.branch) e.branch = 'Choose your branch.';
    const c = parseFloat(f.cgpa); if (f.cgpa === '' || isNaN(c) || c < 0 || c > 10) e.cgpa = 'Enter a CGPA between 0 and 10, such as 8.25.';
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use at least 8 characters with a letter and a number.';
    if (f.confirm !== f.password || !f.confirm) e.confirm = 'The two passwords do not match.';
    if (!f.consent) e.consent = 'Please agree to share your details with the placement office.';
    return e;
  }, [f]);
  const show = k => (touched[k] ? errors[k] : undefined) || srv[k];
  const strength = pwStrength(f.password);
  const submit = e => {
    e.preventDefault(); setTouched(Object.keys(f).reduce((o, k) => (o[k] = true, o), {}));
    if (Object.keys(errors).length) { toast('Fix the highlighted fields to continue.', 'bad'); const first = document.querySelector('.has-err input,.has-err select'); if (first) first.focus(); return; }
    setLoading(true);
    setTimeout(() => {
      const res = mutate(d => { const r = registerStudent(d, f); if (r.ok) d.session = { role: 'student', id: r.student.id, remember: true }; return r; });
      setLoading(false);
      if (!res.ok) { setSrv({ [res.field]: res.msg }); toast(res.msg, 'bad'); return; }
      try { sessionStorage.setItem('th_live', '1'); } catch (x) { }
      toast('Account created. It lives only in this browser because the demo has no server.'); go('profile');
    }, 700);
  };
  const side = html`<h2>Create a demo student account.</h2><p>Registration takes under a minute. Your CGPA decides which drives open up for you, so enter it as it appears on your college record.</p><ul className="side-list"><li><${Icon} n="check" size=${16} />Use only synthetic details in this demo</li><li><${Icon} n="check" size=${16} />Passwords are never sent anywhere</li><li><${Icon} n="check" size=${16} />Edit your profile and skills after signing up</li></ul>`;
  return html`<${AuthShell} side=${side}><div className="auth-card auth-card-wide"><h1>Create your account</h1><p className="muted">Student registration · use synthetic sample data only.</p>
    <form onSubmit=${submit} noValidate className="form-grid">
      <${TextField} id="rg-name" label="Full name" value=${f.name} onChange=${v => set('name', v)} error=${show('name')} onBlur=${() => setTouched(t => ({ ...t, name: true }))} autoComplete="name" className="span2" />
      <${TextField} id="rg-email" label="College email" type="email" value=${f.email} onChange=${v => set('email', v)} error=${show('email')} onBlur=${() => setTouched(t => ({ ...t, email: true }))} placeholder="name@campus-demo.edu" autoComplete="email" />
      <${TextField} id="rg-usn" label="USN / student ID" value=${f.usn} onChange=${v => set('usn', v)} error=${show('usn')} onBlur=${() => setTouched(t => ({ ...t, usn: true }))} placeholder="1TH22CS045" />
      <${SelectField} id="rg-branch" label="Branch" value=${f.branch} onChange=${v => set('branch', v)} error=${show('branch')} onBlur=${() => setTouched(t => ({ ...t, branch: true }))} options=${[{ value: '', label: 'Select branch' }].concat(BRANCHES.map(b => ({ value: b, label: `${b} · ${BRANCH_NAMES[b]}` })))} />
      <${SelectField} id="rg-year" label="Graduation year" value=${f.gradYear} onChange=${v => set('gradYear', v)} options=${['2026', '2027', '2028', '2029']} />
      <${TextField} id="rg-cgpa" label="CGPA" type="number" step="0.01" min="0" max="10" value=${f.cgpa} onChange=${v => set('cgpa', v)} error=${show('cgpa')} onBlur=${() => setTouched(t => ({ ...t, cgpa: true }))} hint="Out of 10, up to two decimals." placeholder="8.25" />
      <div className="span2 pwblock"><${TextField} id="rg-pw" label="Password" type="password" value=${f.password} onChange=${v => set('password', v)} error=${show('password')} onBlur=${() => setTouched(t => ({ ...t, password: true }))} autoComplete="new-password" />
        <div className="strength" aria-live="polite"><div className=${'strength-bars s' + strength}><i></i><i></i><i></i><i></i></div><small>${f.password ? 'Password strength: ' + STRENGTH[strength] : 'Password strength appears as you type.'}</small></div></div>
      <${TextField} id="rg-confirm" label="Confirm password" type="password" value=${f.confirm} onChange=${v => set('confirm', v)} error=${show('confirm')} onBlur=${() => setTouched(t => ({ ...t, confirm: true }))} autoComplete="new-password" className="span2" />
      <div className="span2"><${Check} id="rg-consent" checked=${f.consent} onChange=${v => { set('consent', v); setTouched(t => ({ ...t, consent: true })); }}>I agree to share my academic details with the placement office and recruiters for this season.<//>${show('consent') ? html`<p className="err" role="alert"><${Icon} n="alert" size=${14} />${show('consent')}</p>` : null}</div>
      <div className="span2"><${Btn} type="submit" size="lg" loading=${loading} className="w-full">${loading ? 'Creating account…' : 'Create account'}<//></div>
    </form>
    <p className="auth-alt">Already registered? <button className="link" onClick=${() => go('signin-student')}>Back to sign in</button></p></div><//>`;
}

function AccessDenied({ need, have }) {
  const { go, signOut } = useApp();
  return html`<div className="denied"><span className="empty-ic"><${Icon} n="lock" size=${28} /></span><h1>This page is for ${ROLE_LABEL[need].toLowerCase()} accounts</h1>
    <p>You are signed in as a ${have ? ROLE_LABEL[have].toLowerCase() : 'guest'}. TalentHub keeps student, recruiter and coordinator data separate, so you cannot open this workspace with the current account.</p>
    <div className="row-gap"><${Btn} onClick=${() => go(homeOf(have))}>Go to my workspace<//><${Btn} variant="outline" onClick=${() => { signOut(); go('signin-' + need); }}>Sign out and switch account<//></div></div>`;
}

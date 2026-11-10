/* App shell, router, state container and boot. */
const PAGES = ['landing', 'signin', 'register', 'dashboard', 'profile', 'jobs', 'job', 'applications', 'interviews', 'offers', 'recruiter', 'coordinator'];
const parseHash = () => {
  const h = (location.hash || '').replace('#', '');
  if (!h) return { page: 'landing', param: '' };
  const i = h.indexOf('-'), page = i < 0 ? h : h.slice(0, i), param = i < 0 ? '' : h.slice(i + 1);
  return PAGES.includes(page) ? { page, param } : { page: 'landing', param: '' };
};
const persist = d => { try { localStorage.setItem(DB_KEY, JSON.stringify(d)); } catch (e) { } };
const loadDb = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) { const o = JSON.parse(raw); if (o && o.v === DB_VERSION) { let live = false; try { live = !!sessionStorage.getItem('th_live'); } catch (e) { } if (o.session && o.session.remember === false && !live) o.session = null; return o; } }
  } catch (e) { }
  const d = seedDb(); persist(d); return d;
};

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidUpdate(prev) { if (prev.k !== this.props.k && this.state.err) this.setState({ err: null }); }
  render() {
    if (this.state.err) return html`<div className="denied"><span className="empty-ic"><${Icon} n="alert" size=${28} /></span><h1>This page hit a problem</h1><p>${String(this.state.err && this.state.err.message || this.state.err)}</p><div className="row-gap"><${Btn} onClick=${() => { this.setState({ err: null }); }}>Try again<//><${Btn} variant="outline" onClick=${() => { try { localStorage.removeItem(DB_KEY); } catch (e) { } location.reload(); }}>Reset demo data<//></div></div>`;
    return this.props.children;
  }
}

function useOutside(ref, on) {
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) on(); }, k = e => { if (e.key === 'Escape') on(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, []);
}
function Dropdown({ label, icon, badge, children, align = 'right', trigger }) {
  const [open, setOpen] = useState(false); const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  return html`<div className="dd" ref=${ref}><button className=${trigger ? 'dd-trigger' : 'icon-btn'} onClick=${() => setOpen(!open)} aria-haspopup="true" aria-expanded=${open} aria-label=${label}>${trigger || html`<${Icon} n=${icon} size=${20} />`}${badge ? html`<span className="badge-n" aria-hidden="true">${badge}</span>` : null}</button>${open ? html`<div className=${'menu menu-' + align} role="menu" onClick=${e => { if (e.target.closest('[data-close]')) setOpen(false); }}>${children}</div>` : null}</div>`;
}

function Shell({ role, route, children }) {
  const { db, user, go, mutate, theme, setTheme, signOut, ui, setUi } = useApp();
  const [collapsed, setCollapsed] = useState(() => lsGet('th_collapsed') === '1'), [open, setOpen] = useState(false), [q, setQ] = useState('');
  useEffect(() => { setOpen(false); }, [route.page, route.param]);
  const toggleCollapse = () => { const n = !collapsed; setCollapsed(n); lsSet('th_collapsed', n ? '1' : '0'); };
  const firstOpen = (db.jobs.find(j => j.status === 'Open' && j.deadline >= TODAY()) || db.jobs[0]).id;
  const nav = role === 'student' ? [['dashboard', 'Dashboard', 'home'], ['jobs', 'Explore jobs', 'briefcase'], ['job-' + (ui.lastJob || firstOpen), 'Job details', 'target', 'job'], ['applications', 'My applications', 'file'], ['interviews', 'Interview center', 'calendar'], ['offers', 'Offers and insights', 'award'], ['profile', 'Profile and resume', 'user']]
    : role === 'recruiter' ? REC_TABS.map(t => ['recruiter-' + t.id, t.label, { overview: 'home', listings: 'briefcase', applicants: 'users', company: 'building' }[t.id], 'recruiter', t.id])
      : CO_TABS.map(t => ['coordinator-' + t.id, t.label, { overview: 'home', students: 'cap', companies: 'building', drives: 'layers', eligibility: 'target', reports: 'chart', audit: 'list' }[t.id], 'coordinator', t.id]);
  const active = n => role === 'student' ? route.page === (n[3] || n[0]) : route.page === n[3] && ((route.param || 'overview') === n[4]);
  const mine = db.notifications.filter(n => n.to === user.id); const unread = mine.filter(n => !n.read).length;
  const markAll = () => mutate(d => { d.notifications.forEach(n => { if (n.to === user.id) n.read = true; }); });
  const search = e => {
    e.preventDefault(); const v = q.trim(); setQ('');
    if (role === 'student') { setUi(u => ({ ...u, q: v })); go('jobs'); }
    else if (role === 'recruiter') { setUi(u => ({ ...u, q: v })); go('recruiter-applicants'); }
    else { go('coordinator-students'); }
  };
  const roleName = ROLE_LABEL[role];
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return html`<div className=${cx('shell', collapsed && 'collapsed', 'role-' + role)}>
    <aside className=${cx('sidebar', open && 'open')} aria-label="Workspace navigation"><div className="side-head"><${Logo} light size=${32} /></div>
      <p className="side-role">${roleName} workspace</p>
      <nav className="side-nav">${nav.map(n => html`<button key=${n[0]} className=${cx('side-item', active(n) && 'on')} onClick=${() => go(n[0])} aria-current=${active(n) ? 'page' : undefined} title=${n[1]}><${Icon} n=${n[2]} size=${19} /><span>${n[1]}</span></button>`)}</nav>
      <div className="side-foot"><p className="side-demo">Demo data. Companies and students are fictional.</p><button className="side-item collapse-btn" onClick=${toggleCollapse} aria-pressed=${collapsed}><${Icon} n="panel" size=${19} /><span>${collapsed ? 'Expand' : 'Collapse'} sidebar</span></button></div></aside>
    ${open ? html`<div className="backdrop" onClick=${() => setOpen(false)}></div>` : null}
    <div className="main"><header className="topbar"><button className="icon-btn menu-btn" onClick=${() => setOpen(!open)} aria-label="Open navigation" aria-expanded=${open}><${Icon} n="menu" size=${22} /></button>
      <form className="search" onSubmit=${search} role="search"><${Icon} n="search" size=${17} /><input type="search" value=${q} onChange=${e => setQ(e.target.value)} placeholder=${role === 'student' ? 'Search jobs, companies, skills' : role === 'recruiter' ? 'Search applicants' : 'Search students'} aria-label="Global search" /></form>
      <div className="top-actions"><button className="icon-btn" onClick=${() => setTheme(dark ? 'light' : 'dark')} aria-label=${dark ? 'Switch to light theme' : 'Switch to dark theme'}><${Icon} n=${dark ? 'sun' : 'moon'} size=${20} /></button>
        <${Dropdown} label=${`Notifications, ${unread} unread`} icon="bell" badge=${unread || null}><div className="menu-head"><b>Notifications</b>${unread ? html`<button className="link" onClick=${markAll}>Mark all read</button>` : null}</div>${mine.length ? html`<ul className="notif">${mine.slice(0, 8).map(n => html`<li key=${n.id} className=${n.read ? '' : 'unread'}><span className="nd"></span><div><p>${n.text}</p><small>${fmtTs(n.ts)}</small></div></li>`)}</ul>` : html`<p className="muted menu-pad">You are all caught up.</p>`}<//>
        <${Dropdown} label="Account menu" trigger=${html`<${Avatar} name=${user.name} size=${34} />`}><div className="menu-head col"><b>${user.name}</b><small>${roleName}${role === 'recruiter' ? ' · ' + byId(db.companies, user.companyId).name : ''}</small><small>${user.email}</small></div>${role === 'student' ? html`<button className="menu-item" data-close onClick=${() => go('profile')}><${Icon} n="user" size=${16} />Profile and resume</button>` : null}<button className="menu-item" data-close onClick=${() => setTheme(dark ? 'light' : 'dark')}><${Icon} n=${dark ? 'sun' : 'moon'} size=${16} />${dark ? 'Light theme' : 'Dark theme'}</button><button className="menu-item" data-close onClick=${() => { mutate(d => { Object.assign(d, seedDb(), { session: d.session }); }); window.scrollTo(0, 0); }}><${Icon} n="refresh" size=${16} />Reset demo data</button><button className="menu-item" data-close onClick=${() => { signOut(); go('landing'); }}><${Icon} n="logout" size=${16} />Sign out</button><//></div></header>
      <main className="content" id="main" tabIndex="-1">${children}</main></div></div>`;
}

function App() {
  const [db, setDb] = useState(loadDb); const dbRef = useRef(db);
  const [route, setRoute] = useState(parseHash);
  const [toasts, setToasts] = useState([]); const [theme, setThemeS] = useState(() => lsGet('th_theme') || 'system');
  const [ui, setUiS] = useState({ q: '', next: null, notice: null, lastJob: null, jobFilter: '' });
  const setUi = useCallback(fn => setUiS(fn), []);
  const mutate = useCallback(fn => { const d = JSON.parse(JSON.stringify(dbRef.current)); const r = fn(d); dbRef.current = d; persist(d); setDb(d); return r; }, []);
  const toast = useCallback((msg, kind = 'ok') => { const id = uid('t'); setToasts(t => t.concat({ id, msg, kind })); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5200); }, []);
  const go = useCallback(target => {
    const i = target.indexOf('-'), page = i < 0 ? target : target.slice(0, i), param = i < 0 ? '' : target.slice(i + 1);
    setRoute({ page, param }); try { location.hash = '#' + target; } catch (e) { } window.scrollTo(0, 0);
  }, []);
  const setTheme = t => { setThemeS(t); lsSet('th_theme', t); };
  const signOut = useCallback(() => { mutate(d => { d.session = null; }); try { sessionStorage.removeItem('th_live'); } catch (e) { } }, []);
  useEffect(() => { const h = () => setRoute(parseHash()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  useEffect(() => { const r = document.documentElement; if (theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', theme); }, [theme]);

  const user = useMemo(() => {
    if (!db.session) return null; const { role, id } = db.session;
    const u = (role === 'student' ? db.students : role === 'recruiter' ? db.recruiters : db.coordinators).find(x => x.id === id);
    return u ? { ...u, role } : null;
  }, [db]);
  const need = ROLE_OF[route.page];
  useEffect(() => {
    if (need && !user) { setUi(u => ({ ...u, next: route.page + (route.param ? '-' + route.param : ''), notice: 'Sign in to continue. The page you chose needs a ' + need + ' account.' })); go('signin-' + need); }
    else if (user && (route.page === 'signin' || route.page === 'register')) go(homeOf(user.role));
  }, [route.page, route.param, user]);
  useEffect(() => { const titles = { landing: 'TalentHub', signin: 'Sign in · TalentHub', register: 'Create account · TalentHub' }; document.title = titles[route.page] || 'TalentHub'; }, [route.page]);

  const ctx = { db, user, mutate, toast, go, route, theme, setTheme, signOut, ui, setUi };
  let content;
  if (need && !user) content = null;
  else if (need && user.role !== need) content = html`<${Shell} role=${user.role} route=${route}><${AccessDenied} need=${need} have=${user.role} /><//>`;
  else if (need) {
    const key = route.page + ':' + route.param;
    const P = { dashboard: Dashboard, profile: Profile, jobs: Jobs, job: JobDetail, applications: Applications, interviews: Interviews, offers: Offers, recruiter: Recruiter, coordinator: Coordinator }[route.page];
    content = html`<${Shell} role=${need} route=${route}><${Boundary} k=${key}><${P} key=${route.page === 'job' ? key : route.page} param=${route.param} /><//><//>`;
  } else if (route.page === 'signin') content = html`<${SignIn} param=${route.param} />`;
  else if (route.page === 'register') content = html`<${Register} />`;
  else content = html`<${Landing} />`;

  return html`<${Ctx.Provider} value=${ctx}><a className="skip" href="#main" onClick=${e => { e.preventDefault(); const m = document.getElementById('main'); if (m) m.focus(); }}>Skip to content</a><${Boundary} k=${route.page}>${content}<//>
    <div className="toasts" role="status" aria-live="polite">${toasts.map(t => html`<div key=${t.id} className=${'toast toast-' + t.kind}><${Icon} n=${t.kind === 'bad' ? 'alert' : t.kind === 'info' ? 'info' : 'check'} size=${17} /><span>${t.msg}</span><button className="icon-btn" onClick=${() => setToasts(x => x.filter(y => y.id !== t.id))} aria-label="Dismiss message"><${Icon} n="x" size=${15} /></button></div>`)}</div><//>`;
}

ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);

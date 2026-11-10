/* TalentHub UI kit: icons, brand mark, form controls, dialogs, charts. */
const { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } = React;
const html = htm.bind(React.createElement);
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);
const cx = (...a) => a.filter(Boolean).join(' ');
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  upright: '<path d="M7 17 17 7M8 7h9v9"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.7 3.5 2.6 3.5 5.7"/>',
  chart: '<path d="M5 20V11M12 20V4M19 20v-6"/><path d="M3 20h18"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  trend: '<path d="m3 17 6-6 4 4 8-9M15 6h6v6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4"/>'
};
function Icon({ n, size = 18, className }) {
  return html`<svg className=${cx('ic', className)} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: ICONS[n] || '' }} />`;
}

/* Brand mark: three connected nodes climbing upward. */
function Mark({ size = 34 }) {
  return html`<svg width=${size} height=${size} viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="var(--btn)"/><path d="M9 29 17 21l5 4 9-13" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="29" r="3" fill="#fff"/><circle cx="17" cy="21" r="3" fill="#fff"/><circle cx="31" cy="12" r="4.2" fill="#C8F23A"/></svg>`;
}
function Logo({ light, size = 34 }) {
  return html`<span className=${cx('logo', light && 'logo-light')}><${Mark} size=${size} /><span className="logo-word">Talent<b>Hub</b></span></span>`;
}

function Btn({ variant = 'primary', size, icon, iconRight, loading, className, children, ...p }) {
  return html`<button type="button" ...${p} className=${cx('btn', 'btn-' + variant, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', className)} disabled=${p.disabled || loading}>${loading ? html`<span className="spin" aria-hidden="true"></span>` : icon ? html`<${Icon} n=${icon} size=${16} />` : null}${children}${iconRight ? html`<${Icon} n=${iconRight} size=${16} />` : null}</button>`;
}
function Chip({ tone = 'neutral', icon, children, className }) {
  return html`<span className=${cx('chip', 'chip-' + tone, className)}>${icon ? html`<${Icon} n=${icon} size=${13} />` : null}${children}</span>`;
}
const STATUS_META = { Applied: ['neutral', 'file'], Shortlisted: ['violet', 'check'], 'Interview Scheduled': ['warn', 'calendar'], Interviewed: ['info', 'video'], Offered: ['lime', 'award'], Accepted: ['good', 'shield'], Rejected: ['bad', 'x'], Closed: ['neutral', 'lock'], Open: ['good', 'check'], Draft: ['warn', 'edit'], Issued: ['lime', 'award'], Declined: ['neutral', 'x'], Lapsed: ['neutral', 'lock'], Scheduled: ['warn', 'calendar'], Completed: ['info', 'check'], Cancelled: ['neutral', 'x'] };
function StatusChip({ s }) { const m = STATUS_META[s] || ['neutral', 'info']; return html`<${Chip} tone=${m[0]} icon=${m[1]}>${s}<//>`; }
function CompanyLogo({ co, size = 44 }) {
  return html`<span className="cologo" style=${{ width: size, height: size, background: co ? co.color : '#444', fontSize: size * 0.36 }} aria-hidden="true">${co ? initials(co.name) : '?'}</span>`;
}
function Avatar({ name, size = 36 }) { return html`<span className="avatar" style=${{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">${initials(name || '?')}</span>`; }

function PageHeader({ eyebrow, title, sub, actions }) {
  return html`<header className="pagehead"><div><p className="eyebrow">${eyebrow}</p><h1>${title}</h1>${sub ? html`<p className="sub">${sub}</p>` : null}</div>${actions ? html`<div className="pagehead-actions">${actions}</div>` : null}</header>`;
}
function Empty({ icon = 'search', title, body, action }) {
  return html`<div className="empty"><span className="empty-ic"><${Icon} n=${icon} size=${26} /></span><h3>${title}</h3><p>${body}</p>${action || null}</div>`;
}
function Skeleton({ h = 16, w = '100%', className }) { return html`<span className=${cx('skel', className)} style=${{ height: h, width: w }} aria-hidden="true"></span>`; }
function CardSkeleton() { return html`<div className="card skel-card" aria-hidden="true"><${Skeleton} h=${44} w=${44} /><${Skeleton} h=${18} w="70%" /><${Skeleton} h=${12} w="50%" /><${Skeleton} h=${12} /><${Skeleton} h=${34} w="40%" /></div>`; }

/* ---------- Dialogs ---------- */
function Modal({ title, onClose, children, footer, wide, side }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement; const el = ref.current;
    const first = el && el.querySelector('input,select,textarea,button:not(.modal-x)'); (first || el).focus();
    const key = e => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && el) { const f = [...el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]')]; if (!f.length) return; const a = f[0], b = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); } else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); } }
    };
    document.addEventListener('keydown', key); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; if (prev && prev.focus) prev.focus(); };
  }, []);
  return html`<div className=${cx('scrim', side && 'scrim-side')} onMouseDown=${e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className=${cx('modal', wide && 'modal-wide', side && 'modal-side')} role="dialog" aria-modal="true" aria-label=${title} tabIndex="-1" ref=${ref}>
      <div className="modal-head"><h2>${title}</h2><button className="icon-btn modal-x" onClick=${onClose} aria-label="Close dialog"><${Icon} n="x" /></button></div>
      <div className="modal-body">${children}</div>
      ${footer ? html`<div className="modal-foot">${footer}</div>` : null}
    </div></div>`;
}
function Confirm({ title, children, confirmLabel = 'Confirm', tone = 'primary', onConfirm, onClose, disabled, loading }) {
  return html`<${Modal} title=${title} onClose=${onClose} footer=${html`<${Btn} variant="ghost" onClick=${onClose}>Cancel<//><${Btn} variant=${tone} onClick=${onConfirm} disabled=${disabled} loading=${loading}>${confirmLabel}<//>`}>${children}<//>`;
}
function CsvDialog({ title, csv, onClose }) {
  const ta = useRef(null); const { toast } = useApp();
  const copy = () => {
    const fallback = () => { if (ta.current) { ta.current.select(); toast('Text selected. Press Ctrl+C or Cmd+C to copy.', 'info'); } };
    try { navigator.clipboard.writeText(csv).then(() => toast('CSV copied to your clipboard.'), fallback); } catch (e) { fallback(); }
  };
  return html`<${Modal} title=${title} wide onClose=${onClose} footer=${html`<${Btn} variant="ghost" onClick=${onClose}>Close<//><${Btn} icon="copy" onClick=${copy}>Copy CSV<//>`}>
    <p className="muted">Downloads are turned off in this preview, so copy the CSV and paste it into a spreadsheet. A production build would stream a file from the server.</p>
    <textarea ref=${ta} className="csv" readOnly value=${csv} aria-label="CSV contents" rows="10"></textarea><//>`;
}

/* ---------- Form controls ---------- */
function Field({ id, label, hint, error, children, className }) {
  return html`<div className=${cx('field', error && 'has-err', className)}><label htmlFor=${id}>${label}</label>${children}${error ? html`<p className="err" id=${id + '-e'} role="alert"><${Icon} n="alert" size=${14} />${error}</p>` : hint ? html`<p className="hint" id=${id + '-h'}>${hint}</p>` : null}</div>`;
}
function TextField({ id, label, hint, error, value, onChange, type = 'text', className, ...rest }) {
  return html`<${Field} id=${id} label=${label} hint=${hint} error=${error} className=${className}><input id=${id} type=${type} value=${value} onChange=${e => onChange(e.target.value)} aria-invalid=${error ? 'true' : undefined} aria-describedby=${error ? id + '-e' : hint ? id + '-h' : undefined} ...${rest} /><//>`;
}
function SelectField({ id, label, value, onChange, options, error, hint, className, ...rest }) {
  return html`<${Field} id=${id} label=${label} hint=${hint} error=${error} className=${className}><select id=${id} value=${value} onChange=${e => onChange(e.target.value)} aria-invalid=${error ? 'true' : undefined} ...${rest}>${options.map(o => { const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o; return html`<option key=${v} value=${v}>${l}</option>`; })}</select><//>`;
}
function TextArea({ id, label, value, onChange, error, hint, rows = 3, className, ...rest }) {
  return html`<${Field} id=${id} label=${label} hint=${hint} error=${error} className=${className}><textarea id=${id} rows=${rows} value=${value} onChange=${e => onChange(e.target.value)} aria-invalid=${error ? 'true' : undefined} ...${rest}></textarea><//>`;
}
function Toggle({ id, checked, onChange, label, hint }) {
  return html`<label className="toggle" htmlFor=${id}><input id=${id} type="checkbox" role="switch" checked=${checked} onChange=${e => onChange(e.target.checked)} /><span className="toggle-track" aria-hidden="true"></span><span className="toggle-text"><b>${label}</b>${hint ? html`<small>${hint}</small>` : null}</span></label>`;
}
function Check({ id, checked, onChange, children }) {
  return html`<label className="check" htmlFor=${id}><input id=${id} type="checkbox" checked=${checked} onChange=${e => onChange(e.target.checked)} /><span className="check-box" aria-hidden="true"><${Icon} n="check" size=${13} /></span><span>${children}</span></label>`;
}
function BranchPicker({ value, onChange }) {
  return html`<div className="chips-pick" role="group" aria-label="Allowed branches">${BRANCHES.map(b => { const on = value.includes(b); return html`<button type="button" key=${b} className=${cx('pick', on && 'on')} aria-pressed=${on} onClick=${() => onChange(on ? value.filter(x => x !== b) : value.concat(b))}>${on ? html`<${Icon} n="check" size=${13} />` : null}${b}</button>`; })}</div>`;
}
function Tabs({ items, value, onChange, label }) {
  const key = (e, i) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = (i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length; onChange(items[n].id); const b = e.currentTarget.parentElement.children[n]; if (b) b.focus(); } };
  return html`<div className="tabs" role="tablist" aria-label=${label}>${items.map((t, i) => html`<button key=${t.id} role="tab" aria-selected=${value === t.id} tabIndex=${value === t.id ? 0 : -1} className=${cx('tab', value === t.id && 'on')} onClick=${() => onChange(t.id)} onKeyDown=${e => key(e, i)}>${t.label}${t.count != null ? html`<span className="tab-n">${t.count}</span>` : null}</button>`)}</div>`;
}
function Pager({ page, pages, onPage, total, size }) {
  if (pages <= 1) return null;
  return html`<div className="pager"><span className="muted">Showing ${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total}</span><div><${Btn} variant="outline" size="sm" icon="left" disabled=${page <= 1} onClick=${() => onPage(page - 1)} aria-label="Previous page">Prev<//><span className="pager-n">Page ${page} of ${pages}</span><${Btn} variant="outline" size="sm" iconRight="right" disabled=${page >= pages} onClick=${() => onPage(page + 1)} aria-label="Next page">Next<//></div></div>`;
}

/* ---------- Charts ---------- */
function Ring({ value, size = 96, stroke = 9, label }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return html`<div className="ring" style=${{ width: size, height: size }} role="img" aria-label=${`${label || 'Progress'} ${value} percent`}><svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`}><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--line)" strokeWidth=${stroke} /><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--btn)" strokeWidth=${stroke} strokeLinecap="round" strokeDasharray=${c} strokeDashoffset=${c * (1 - value / 100)} transform=${`rotate(-90 ${size / 2} ${size / 2})`} /></svg><span>${value}%</span></div>`;
}
function Meter({ value, label }) {
  return html`<div className="meter" role="progressbar" aria-valuenow=${value} aria-valuemin="0" aria-valuemax="100" aria-label=${label}><span style=${{ width: value + '%' }}></span></div>`;
}
const TONE_VAR = { neutral: 'var(--muted)', violet: 'var(--violet)', warn: 'var(--warn)', info: 'var(--info)', lime: 'var(--lime-dk)', good: 'var(--good)', bad: 'var(--bad)' };
function BarList({ data }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return html`<ul className="bars">${data.map(d => html`<li key=${d.label}><span className="bar-label">${d.label}</span><span className="bar-track"><span className="bar-fill" style=${{ width: (d.value / max * 100) + '%', background: TONE_VAR[d.tone] || 'var(--violet)' }}></span></span><span className="bar-val">${d.value}</span></li>`)}</ul>`;
}
function Funnel({ steps }) {
  const top = Math.max(1, steps[0].value);
  return html`<ol className="funnel">${steps.map((s, i) => { const prev = i ? steps[i - 1].value : 0; const conv = i && prev ? Math.round(s.value / prev * 100) : null; return html`<li key=${s.label}><div className="funnel-bar" style=${{ width: Math.max(8, s.value / top * 100) + '%', opacity: 1 - i * 0.14 }}><b>${s.value}</b></div><span className="funnel-label">${s.label}${conv != null ? html`<small>${conv}% of previous</small>` : null}</span></li>`; })}</ol>`;
}
function LineChart({ points, unit = '' }) {
  const W = 560, H = 220, L = 34, R = 16, T = 16, B = 30;
  const max = Math.max(4, ...points.map(p => p.value)); const top = Math.ceil(max / 4) * 4; const step = top / 4;
  const x = i => L + (points.length === 1 ? 0 : i * (W - L - R) / (points.length - 1)), y = v => T + (H - T - B) * (1 - v / top);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const last = points[points.length - 1];
  return html`<svg className="linechart" viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${`Line chart: ${points.map(p => p.label + ' ' + p.value).join(', ')}`}>
    ${[0, 1, 2, 3, 4].map(i => html`<g key=${i}><line x1=${L} x2=${W - R} y1=${y(i * step)} y2=${y(i * step)} stroke="var(--line)" strokeWidth="1" /><text x=${L - 8} y=${y(i * step) + 4} textAnchor="end" fill="var(--muted)" fontSize="11">${i * step}</text></g>`)}
    <path d=${area} fill="var(--violet)" opacity="0.14" /><path d=${line} fill="none" stroke="var(--violet)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    ${points.map((p, i) => html`<g key=${p.label}><circle cx=${x(i)} cy=${y(p.value)} r=${i === points.length - 1 ? 5.5 : 3.5} fill=${i === points.length - 1 ? 'var(--lime)' : 'var(--surface)'} stroke="var(--violet)" strokeWidth="2" /><text x=${x(i)} y=${H - 9} textAnchor="middle" fill="var(--muted)" fontSize="11">${p.label}</text></g>`)}
    <text x=${x(points.length - 1)} y=${y(last.value) - 12} textAnchor="end" fill="var(--ink)" fontSize="12" fontWeight="700">${last.value}${unit}</text>
  </svg>`;
}
function Stepper({ app }) {
  const terminal = TERMINAL.includes(app.status);
  const idxs = app.history.map(h => STAGES.indexOf(h.status)).filter(i => i >= 0);
  const cur = terminal ? Math.max(0, ...idxs) : STAGES.indexOf(app.status);
  return html`<div className="stepper-wrap"><ol className="stepper" aria-label=${`Application progress. Current status: ${app.status}`}>${STAGES.map((s, i) => {
    const st = app.status === 'Accepted' ? 'done' : i < cur ? 'done' : i === cur ? (terminal ? 'stop' : 'cur') : 'todo';
    return html`<li key=${s} className=${'step ' + st} aria-current=${st === 'cur' ? 'step' : undefined}><span className="step-bar"><${Icon} n=${st === 'done' ? 'check' : st === 'stop' ? 'x' : 'clock'} size=${11} /></span><span className="step-lbl">${s}</span></li>`;
  })}</ol><p className="step-note">${terminal ? `${app.status} after stage ${cur + 1} of 6` : `Stage ${cur + 1} of 6`} · ${app.status}</p></div>`;
}

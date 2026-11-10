/* Pages 8-10: My Applications, Interview Center, Offers & Career Insights. */
const NEXT_TEXT = {
  Applied: 'The recruiter has your application and has not reviewed it yet. Shortlists usually follow the application deadline.',
  Shortlisted: 'You are on the shortlist. The company will schedule your first interview round.',
  'Interview Scheduled': 'An interview round is booked. Check the Interview Center for the time and venue.',
  Interviewed: 'Your interview stage is complete. The company decides on offers next.',
  Offered: 'You have an offer. Review it on the Offers page and accept or decline before the response date.',
  Accepted: 'You accepted this offer. Your other applications were closed under the season-wide rule.'
};

function AppDetail({ app, onClose }) {
  const { db, user, mutate, toast, go } = useApp();
  const job = byId(db.jobs, app.jobId), co = byId(db.companies, app.companyId);
  const ivs = db.interviews.filter(i => i.appId === app.id).sort(cmpIv), offer = db.offers.find(o => o.appId === app.id);
  const sim = () => { const r = mutate(d => simulateNext(d, app.id)); toast(r.msg || 'Updated.', r.ok ? 'ok' : 'info'); };
  return html`<${Modal} title="Application details" side onClose=${onClose} footer=${html`<${Btn} variant="ghost" onClick=${onClose}>Close<//><${Btn} variant="outline" onClick=${() => { onClose(); go('job-' + job.id); }}>View listing<//>`}>
    <div className="detail-top"><${CompanyLogo} co=${co} size=${48} /><div><h3>${job.title}</h3><p className="muted">${co.name} · ${pkgLabel(job)} · ${job.location}</p></div></div>
    <div className="chips"><${StatusChip} s=${app.status} /><${Chip}>Applied ${fmtDate(app.appliedOn)}<//><${Chip}>Updated ${fmtDate(app.updatedOn)}<//></div>
    <${Stepper} app=${app} />
    ${app.reason ? html`<div className=${cx('notice', app.status === 'Rejected' ? 'notice-bad' : 'notice-info')} role="note"><${Icon} n=${app.status === 'Rejected' ? 'x' : 'info'} size=${16} /><div><b>${app.status === 'Rejected' ? 'Why this application ended' : 'Why this application closed'}</b><p>${app.reason}</p></div></div>` : html`<p className="whynow"><b>What happens next.</b> ${NEXT_TEXT[app.status]}</p>`}
    <h4>History</h4><ol className="timeline compact">${app.history.slice().reverse().map((h, i) => html`<li key=${i} className="done"><span className="tl-dot"></span><div><b>${h.status}</b><p className="muted">${h.note} · ${fmtDate(h.date)}</p></div></li>`)}</ol>
    ${ivs.length ? html`<h4>Interview rounds</h4><ul className="rows">${ivs.map(i => html`<li key=${i.id} className="row-iv"><div className="grow"><b>${i.round}</b><p className="muted">${fmtDate(i.date)} · ${i.time} · ${i.mode}</p></div><${StatusChip} s=${i.status === 'Completed' && i.result ? i.result === 'Passed' ? 'Completed' : 'Rejected' : i.status} /></li>`)}</ul>` : null}
    ${offer ? html`<h4>Offer</h4><p>${offer.package} LPA · ${offer.status}. <button className="link" onClick=${() => { onClose(); go('offers'); }}>Open offers</button></p>` : null}
    ${isActive(app) && app.status !== 'Offered' ? html`<div className="demo-box"><b>Demo control</b><p className="muted">Simulate the recruiter moving this application one stage forward. It uses the same rules the recruiter workspace uses.</p><${Btn} variant="outline" size="sm" icon="play" onClick=${sim}>Simulate next update<//></div>` : null}
  <//>`;
}
ICONS.play = '<path d="M7 4.5v15l12-7.5z"/>';

function Applications() {
  const { db, user, go } = useApp();
  const [q, setQ] = useState(''), [st, setSt] = useState('All'), [loading, setLoading] = useState(true), [error, setError] = useState(false), [sel, setSel] = useState(null);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, [error]);
  const mine = db.applications.filter(a => a.studentId === user.id).sort((a, b) => b.updatedOn.localeCompare(a.updatedOn) || b.appliedOn.localeCompare(a.appliedOn));
  const counts = ALL_STATUSES.reduce((o, s) => (o[s] = mine.filter(a => a.status === s).length, o), {});
  const rows = mine.filter(a => { const j = byId(db.jobs, a.jobId), c = byId(db.companies, a.companyId); return (st === 'All' || a.status === st) && (!q.trim() || `${j.title} ${c.name}`.toLowerCase().includes(q.trim().toLowerCase())); });
  const cur = sel ? db.applications.find(a => a.id === sel) : null;
  return html`<div className="page"><${PageHeader} eyebrow=${`${mine.length} application${mine.length === 1 ? '' : 's'} this season`} title="My applications" sub="One timeline per application: Applied, Shortlisted, Interview Scheduled, Interviewed, Offered, Accepted." />
    <div className="toolbar"><${TextField} id="ap-q" label="Search applications" type="search" value=${q} onChange=${setQ} placeholder="Company or role" className="grow" /></div>
    <div className="chips filter-chips" role="group" aria-label="Filter by status">${['All'].concat(ALL_STATUSES).map(s => { const n = s === 'All' ? mine.length : counts[s]; if (s !== 'All' && !n && st !== s) return null; return html`<button key=${s} className=${cx('pick', st === s && 'on')} aria-pressed=${st === s} onClick=${() => setSt(s)}>${s}<span className="tab-n">${n}</span></button>`; })}</div>
    ${error ? html`<div className="card"><${Empty} icon="alert" title="We could not load your applications" body="This is the demo's simulated error state. In production it appears when the server cannot be reached." action=${html`<${Btn} icon="refresh" onClick=${() => setError(false)}>Try again<//>`} /></div>`
      : loading ? html`<div className="stack">${[1, 2, 3].map(i => html`<${CardSkeleton} key=${i} />`)}</div>`
        : mine.length === 0 ? html`<div className="card"><${Empty} icon="file" title="You have not applied yet" body="Applications you submit show up here with a live timeline." action=${html`<${Btn} onClick=${() => go('jobs')}>Explore opportunities<//>`} /></div>`
          : rows.length === 0 ? html`<div className="card"><${Empty} title="No applications match" body="Clear the search or choose a different status." action=${html`<${Btn} variant="outline" onClick=${() => { setQ(''); setSt('All'); }}>Clear filters<//>`} /></div>`
            : html`<div className="stack">${rows.map(a => { const j = byId(db.jobs, a.jobId), c = byId(db.companies, a.companyId); return html`<article key=${a.id} className="card app-row"><div className="app-top"><${CompanyLogo} co=${c} /><div className="grow"><h3>${j.title}</h3><p className="muted">${c.name} · ${pkgLabel(j)}</p></div><${StatusChip} s=${a.status} /></div><${Stepper} app=${a} /><div className="app-foot"><span className="muted">Applied ${fmtDate(a.appliedOn)} · Updated ${fmtDate(a.updatedOn)}</span>${a.reason ? html`<span className="muted reason-snip">${a.reason}</span>` : null}<${Btn} variant="outline" size="sm" iconRight="right" onClick=${() => setSel(a.id)}>Details<//></div></article>`; })}</div>`}
    <p className="fine"><button className="link" onClick=${() => setError(true)}>Preview the error state</button> (demo only)</p>
    ${cur ? html`<${AppDetail} app=${cur} onClose=${() => setSel(null)} />` : null}</div>`;
}

/* ---------------- Page 9: Interview Center ---------------- */
const PREP = ['Revise core data structures and walk through one project end to end', 'Read the company\'s product page and latest release notes', 'Test your camera, microphone and meeting link', 'Prepare two questions to ask the interviewer', 'Keep your photo ID and printed resume ready'];
function IvCard({ iv }) {
  const { db, toast } = useApp();
  const co = byId(db.companies, iv.companyId), j = byId(db.jobs, iv.jobId), t = TODAY();
  const left = diffDays(iv.date, t);
  const state = iv.status === 'Completed' ? 'completed' : iv.status === 'Cancelled' ? 'cancelled' : left <= 2 ? 'upcoming' : 'scheduled';
  const copy = () => { try { navigator.clipboard.writeText(iv.venue).then(() => toast('Link copied.'), () => toast('Copy is blocked here. Select the text instead.', 'info')); } catch (e) { toast('Copy is blocked here. Select the text instead.', 'info'); } };
  return html`<article className=${cx('card', 'iv', 'iv-' + state)}><div className="iv-head"><${CompanyLogo} co=${co} size=${42} /><div className="grow"><h3>${co.name}</h3><p className="muted">${j.title}</p></div>
    ${state === 'completed' ? html`<${Chip} tone=${iv.result === 'Passed' ? 'good' : 'bad'} icon=${iv.result === 'Passed' ? 'check' : 'x'}>Completed · ${iv.result}<//>` : state === 'cancelled' ? html`<${Chip} icon="x">Cancelled<//>` : state === 'upcoming' ? html`<${Chip} tone="warn" icon="clock">Upcoming · ${left === 0 ? 'today' : left === 1 ? 'tomorrow' : 'in ' + left + ' days'}<//>` : html`<${Chip} tone="violet" icon="calendar">Scheduled<//>`}</div>
    <dl className="facts"><div><dt>Round</dt><dd>${iv.round}</dd></div><div><dt>When</dt><dd>${fmtDay(iv.date)}, ${iv.time}</dd></div><div><dt>${iv.mode === 'Online' ? 'Meeting link' : 'Venue'}</dt><dd className="venue">${iv.venue}${iv.mode === 'Online' && state !== 'completed' ? html` <button className="link" onClick=${copy}>Copy</button>` : null}</dd></div></dl>
    ${state === 'completed' ? (iv.feedback ? html`<p className="note"><b>Feedback:</b> ${iv.feedback}</p>` : null) : html`<p className="note"><b>Preparation:</b> ${iv.notes}</p>`}</article>`;
}
function Interviews() {
  const { db, user, mutate, toast } = useApp();
  const mine = db.interviews.filter(i => i.studentId === user.id);
  const sched = mine.filter(i => i.status === 'Scheduled').sort(cmpIv), done = mine.filter(i => i.status !== 'Scheduled').sort((a, b) => cmpIv(b, a));
  const pf = prefsOf(db, user.id);
  const [view, setView] = useState('agenda');
  const first = sched[0]; const base = first ? parseD(first.date) : new Date();
  const [cur, setCur] = useState({ y: base.getFullYear(), m: base.getMonth() }); const [sel, setSel] = useState(first ? first.date : TODAY());
  const monthName = new Date(cur.y, cur.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const lead = new Date(cur.y, cur.m, 1).getDay(), days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = []; for (let i = 0; i < lead; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(`${cur.y}-${pad(cur.m + 1)}-${pad(d)}`);
  const move = n => { const d = new Date(cur.y, cur.m + n, 1); setCur({ y: d.getFullYear(), m: d.getMonth() }); };
  const on = sel ? mine.filter(i => i.date === sel).sort(cmpIv) : [];
  const grouped = sched.reduce((o, i) => ((o[i.date] = o[i.date] || []).push(i), o), {});
  const togglePrep = k => mutate(d => { const p = getPrefs(d, user.id); p.prep[k] = !p.prep[k]; });
  const rem = (k, v) => { mutate(d => { getPrefs(d, user.id).reminders[k] = v; }); toast('Reminder preference saved. The demo shows reminders in the app only.', 'info'); };
  const prepDone = PREP.filter((_, i) => pf.prep['p' + (i + 1)]).length;
  return html`<div className="page"><${PageHeader} eyebrow=${`${sched.length} scheduled · ${done.filter(i => i.status === 'Completed').length} completed`} title="Interview center" sub="Your agenda, calendar and round history in one place." actions=${html`<${Tabs} label="View" value=${view} onChange=${setView} items=${[{ id: 'agenda', label: 'Agenda' }, { id: 'calendar', label: 'Calendar' }]} />`} />
    <div className="grid-main"><div className="stack">
      ${view === 'calendar' ? html`<section className="card"><div className="card-head"><h2>${monthName}</h2><div><${Btn} variant="outline" size="sm" icon="left" onClick=${() => move(-1)} aria-label="Previous month">Prev<//> <${Btn} variant="outline" size="sm" iconRight="right" onClick=${() => move(1)} aria-label="Next month">Next<//></div></div>
        <div className="cal" role="grid" aria-label=${monthName}>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => html`<span key=${d} className="cal-h" role="columnheader">${d}</span>`)}${cells.map((c, i) => { if (!c) return html`<span key=${'e' + i} className="cal-c empty-c"></span>`; const evs = mine.filter(x => x.date === c); const s = evs.some(x => x.status === 'Scheduled'); return html`<button key=${c} role="gridcell" className=${cx('cal-c', sel === c && 'sel', c === TODAY() && 'today')} onClick=${() => setSel(c)} aria-label=${`${fmtDate(c)}${evs.length ? ', ' + evs.length + ' interview' + (evs.length > 1 ? 's' : '') : ''}`} aria-pressed=${sel === c}><span>${parseD(c).getDate()}</span>${evs.length ? html`<i className=${s ? 'dot-s' : 'dot-c'}></i>` : null}</button>`; })}</div>
        <p className="legend"><span><i className="dot-s"></i>Scheduled</span><span><i className="dot-c"></i>Completed</span></p>
        <h3>${fmtDay(sel)}</h3>${on.length ? html`<div className="stack">${on.map(i => html`<${IvCard} key=${i.id} iv=${i} />`)}</div>` : html`<p className="muted">No interviews on this day.</p>`}</section>`
        : html`<section className="stack"><h2 className="h-sm">Upcoming and scheduled</h2>${sched.length ? Object.keys(grouped).map(d => html`<div key=${d} className="agenda-day"><h3>${fmtDay(d)}</h3><div className="stack">${grouped[d].map(i => html`<${IvCard} key=${i.id} iv=${i} />`)}</div></div>`) : html`<div className="card"><${Empty} icon="calendar" title="Nothing scheduled" body="When a company schedules a round for you, it appears here with the time and venue." /></div>`}</section>`}
      <section className="card"><h2>Round history and results</h2>${done.length ? html`<div className="tablewrap"><table className="table"><thead><tr><th>Company</th><th>Round</th><th>Date</th><th>Result</th></tr></thead><tbody>${done.map(i => { const co = byId(db.companies, i.companyId); return html`<tr key=${i.id}><td><b>${co.name}</b><small>${byId(db.jobs, i.jobId).title}</small></td><td>${i.round}</td><td>${fmtDate(i.date)}</td><td>${i.status === 'Cancelled' ? html`<${Chip}>Cancelled<//>` : html`<${Chip} tone=${i.result === 'Passed' ? 'good' : 'bad'} icon=${i.result === 'Passed' ? 'check' : 'x'}>${i.result}<//>`}</td></tr>`; })}</tbody></table></div>` : html`<p className="muted">Completed rounds and their results will be listed here.</p>`}</section>
    </div>
    <div className="stack"><section className="card"><div className="card-head"><h2>Preparation checklist</h2><span className="muted">${prepDone} of ${PREP.length}</span></div><${Meter} value=${Math.round(prepDone / PREP.length * 100)} label="Preparation progress" /><ul className="checklist">${PREP.map((p, i) => html`<li key=${i}><${Check} id=${'pp' + i} checked=${!!pf.prep['p' + (i + 1)]} onChange=${() => togglePrep('p' + (i + 1))}>${p}<//></li>`)}</ul></section>
      <section className="card"><h2>Reminder preferences</h2><div className="stack-sm"><${Toggle} id="r1" checked=${pf.reminders.h24} onChange=${v => rem('h24', v)} label="24 hours before" /><${Toggle} id="r2" checked=${pf.reminders.h1} onChange=${v => rem('h1', v)} label="1 hour before" /><${Toggle} id="r3" checked=${pf.reminders.inApp} onChange=${v => rem('inApp', v)} label="In-app notification" /><${Toggle} id="r4" checked=${pf.reminders.email} onChange=${v => rem('email', v)} label="Email reminder" hint="Saved as a preference only. This demo sends no email." /></div></section></div></div></div>`;
}

/* ---------------- Page 10: Offers & Career Insights ---------------- */
function Letter({ offer, onClose }) {
  const { db, user } = useApp(); const co = byId(db.companies, offer.companyId), j = byId(db.jobs, offer.jobId);
  return html`<${Modal} title="Offer letter preview" wide onClose=${onClose} footer=${html`<${Btn} onClick=${onClose}>Close<//>`}><div className="letter"><p className="letter-tag">Sample document. Not a legal offer.</p><h3>${co.name}</h3><p>${fmtDate(offer.date)}</p><p>Dear ${user.name},</p><p>We are pleased to offer you the position of <b>${j.title}</b> at ${co.name}, based in ${j.location} (${j.mode.toLowerCase()}). The annual package is <b>₹${offer.package} lakh per annum</b>${j.type === 'Internship' ? ', paid as a monthly stipend' : ''}.</p><p>Your proposed joining date is ${fmtDate(offer.joiningDate)}. Please respond by <b>${fmtDate(offer.respondBy)}</b> through TalentHub.</p><p>We look forward to welcoming you.</p><p>Campus Hiring Team<br/>${co.name}</p></div><p className="fine">A secure download needs document storage, which this demo does not have.</p><//>`;
}
function Offers() {
  const { db, user, mutate, toast, go } = useApp();
  const offers = db.offers.filter(o => o.studentId === user.id).sort((a, b) => b.date.localeCompare(a.date));
  const live = offers.filter(o => o.status === 'Issued' || o.status === 'Accepted');
  const [letter, setLetter] = useState(null), [acc, setAcc] = useState(null), [dec, setDec] = useState(null), [ack, setAck] = useState(false), [busy, setBusy] = useState(false);
  const accepted = offers.find(o => o.status === 'Accepted');
  const doAccept = () => { setBusy(true); setTimeout(() => { const r = mutate(d => acceptOffer(d, acc.id, user.id)); setBusy(false); setAcc(null); setAck(false); toast(r.msg, r.ok ? 'ok' : 'bad'); }, 500); };
  const doDecline = () => { const r = mutate(d => declineOffer(d, dec.id, user.id)); setDec(null); toast(r.msg, r.ok ? 'ok' : 'bad'); };
  const best = live.length ? Math.max(...live.map(o => o.package)) : 0;
  const apps = db.applications.filter(a => a.studentId === user.id);
  const reached = s => apps.filter(a => a.history.some(h => h.status === s)).length;
  const funnel = [{ label: 'Applied', value: apps.length }, { label: 'Shortlisted', value: reached('Shortlisted') }, { label: 'Interviewed', value: reached('Interviewed') }, { label: 'Offered', value: reached('Offered') }, { label: 'Accepted', value: reached('Accepted') }];
  const weeks = []; for (let w = 5; w >= 0; w--) { const s = addDays(-7 * w - 6), e = addDays(-7 * w); weeks.push({ label: fmtShort(e), value: apps.filter(a => a.appliedOn >= s && a.appliedOn <= e).length }); }
  const need = {}; db.jobs.filter(j => j.status === 'Open' && j.deadline >= TODAY()).forEach(j => j.skills.forEach(s => { if (!user.skills.includes(s)) need[s] = (need[s] || 0) + 1; }));
  const sugg = Object.entries(need).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const iv = reached('Interviewed'), off = reached('Offered');
  return html`<div className="page"><${PageHeader} eyebrow=${`${live.length} active offer${live.length === 1 ? '' : 's'}`} title="Offers and career insights" sub="Compare what you have, then decide with the placement rules in view." />
    <div className="notice notice-info" role="note"><${Icon} n="info" size=${16} /><div><b>Season-wide rule.</b> Accepting an offer may close your other applications and make you ineligible for other drives, according to this college's placement rules. You can still decline an offer without any effect on other drives.</div></div>
    ${offers.length === 0 ? html`<div className="card"><${Empty} icon="award" title="No offers yet" body="Offers from companies appear here as soon as they are issued." action=${html`<${Btn} onClick=${() => go('applications')}>Track applications<//>`} /></div>` : html`<div className="offer-grid">${offers.map(o => { const co = byId(db.companies, o.companyId), j = byId(db.jobs, o.jobId), issued = o.status === 'Issued'; return html`<article key=${o.id} className=${cx('card', 'offer', o.status === 'Accepted' && 'offer-acc', !issued && o.status !== 'Accepted' && 'offer-off')}><div className="offer-top"><${CompanyLogo} co=${co} size=${46} /><div className="grow"><h3>${co.name}</h3><p className="muted">${j.title}</p></div><${StatusChip} s=${o.status} /></div><p className="offer-pkg">${o.package}<small> LPA</small></p><dl className="facts"><div><dt>Offer date</dt><dd>${fmtDate(o.date)}</dd></div><div><dt>Respond by</dt><dd>${fmtDate(o.respondBy)}</dd></div><div><dt>Joining</dt><dd>${fmtDate(o.joiningDate)}</dd></div></dl>
      <div className="row-gap"><${Btn} variant="outline" size="sm" icon="file" onClick=${() => setLetter(o)}>View letter<//>${issued ? html`<${Btn} size="sm" icon="check" onClick=${() => { setAck(false); setAcc(o); }} disabled=${!!accepted}>Accept offer<//><${Btn} variant="ghost" size="sm" onClick=${() => setDec(o)}>Decline<//>` : null}</div>${issued && accepted ? html`<p className="fine">You already accepted an offer, so this one cannot be accepted.</p>` : null}${o.status === 'Lapsed' ? html`<p className="fine">Lapsed when you accepted another offer.</p>` : null}</article>`; })}</div>`}
    ${live.length >= 2 ? html`<section className="card"><h2>Compare offers</h2><div className="tablewrap"><table className="table cmp"><thead><tr><th scope="col">Detail</th>${live.map(o => html`<th key=${o.id} scope="col">${byId(db.companies, o.companyId).name}</th>`)}</tr></thead><tbody>
      ${[['Role', o => byId(db.jobs, o.jobId).title], ['Package', o => html`<b>${o.package} LPA</b>${o.package === best ? html` <${Chip} tone="lime">Highest package<//>` : ''}`], ['Location', o => byId(db.jobs, o.jobId).location], ['Work mode', o => byId(db.jobs, o.jobId).mode], ['Joining date', o => fmtDate(o.joiningDate)], ['Respond by', o => fmtDate(o.respondBy)], ['Status', o => html`<${StatusChip} s=${o.status} />`]].map(r => html`<tr key=${r[0]}><th scope="row">${r[0]}</th>${live.map(o => html`<td key=${o.id}>${r[1](o)}</td>`)}</tr>`)}</tbody></table></div><p className="fine">Package is one factor. Compare role, location and growth before you decide.</p></section>` : null}
    <div className="grid-2"><section className="card"><h2>Application activity</h2><p className="muted">New applications per week, last six weeks.</p><${LineChart} points=${weeks} /></section>
      <section className="card"><h2>Interview conversion</h2><${Funnel} steps=${funnel} /><p className="fine">${iv ? `${Math.round(off / iv * 100)}% of the applications that reached interviews ended in an offer.` : 'Conversion appears once you complete an interview.'}</p></section></div>
    <section className="card"><h2>Skills worth building</h2>${sugg.length ? html`<ul className="rows">${sugg.map(s => html`<li key=${s[0]} className="row-sugg"><${Chip} tone="violet" icon="spark">${s[0]}<//><span className="grow muted">Required by ${s[1]} open listing${s[1] > 1 ? 's' : ''} and not on your profile.</span><${Btn} variant="ghost" size="sm" onClick=${() => go('profile')}>Add to profile<//></li>`)}</ul>` : html`<p className="muted">Your skills already cover every open listing.</p>`}<p className="fine">Insights use only your own data. Other students' details are never shown.</p></section>
    ${letter ? html`<${Letter} offer=${letter} onClose=${() => setLetter(null)} />` : null}
    ${acc ? html`<${Confirm} title="Accept this offer?" confirmLabel="Accept offer" disabled=${!ack} loading=${busy} onConfirm=${doAccept} onClose=${() => setAcc(null)}><p>You are accepting <b>${byId(db.jobs, acc.jobId).title}</b> at <b>${byId(db.companies, acc.companyId).name}</b> for <b>${acc.package} LPA</b>.</p><ul className="bullets"><li>Your other open applications will be closed automatically.</li><li>Other issued offers will lapse.</li><li>You will be ineligible for other drives for the rest of the season.</li><li>This cannot be undone in the demo.</li></ul><${Check} id="ack" checked=${ack} onChange=${setAck}>I understand and want to accept this offer.<//><//>` : null}
    ${dec ? html`<${Confirm} title="Decline this offer?" tone="danger" confirmLabel="Decline offer" onConfirm=${doDecline} onClose=${() => setDec(null)}><p>Declining the ${byId(db.companies, dec.companyId).name} offer closes that application. Your other applications and offers are not affected.</p><//>` : null}</div>`;
}

/* TalentHub business rules and demo services.
   Every function takes a mutable draft of the db and returns { ok, msg }.
   In production each of these becomes a FastAPI endpoint that enforces the same rules server-side. */

const cgEq = (a, b) => Math.round(a * 100) === Math.round(b * 100);
const cgGte = (a, b) => Math.round(a * 100) >= Math.round(b * 100);
const rank = s => STAGES.indexOf(s);
const isActive = a => !TERMINAL.includes(a.status) && a.status !== 'Accepted';
const prefsOf = (db, id) => (db.prefs && db.prefs[id]) || DEFAULT_PREFS;

function getPrefs(d, id) {
  d.prefs = d.prefs || {};
  if (!d.prefs[id]) d.prefs[id] = JSON.parse(JSON.stringify(DEFAULT_PREFS));
  return d.prefs[id];
}
function logAudit(d, actor, role, action, detail) {
  d.audit.unshift({ id: uid('l'), ts: new Date().toISOString(), actor, role, action, detail });
  d.audit = d.audit.slice(0, 200);
}
function notify(d, to, text) { d.notifications.unshift({ id: uid('n'), to, text, ts: new Date().toISOString(), read: false }); d.notifications = d.notifications.slice(0, 120); }

/* Rules 1-4 plus application blockers (rules 5 and 6). */
function evalEligibility(db, st, job) {
  const co = byId(db.companies, job.companyId);
  const eqc = cgEq(st.cgpa, job.minCgpa), cgOk = cgGte(st.cgpa, job.minCgpa);
  const blOk = st.activeBacklogs <= job.maxBacklogs;
  const brOpen = job.branches.length === 0, brOk = brOpen || job.branches.includes(st.branch);
  const accOffer = st.acceptedOfferId ? byId(db.offers, st.acceptedOfferId) : null;
  const accCo = accOffer ? byId(db.companies, accOffer.companyId) : null;
  const checks = [
    { key: 'cgpa', title: 'Minimum CGPA', req: `${job.minCgpa.toFixed(2)} or higher`, pass: cgOk,
      detail: cgOk ? (eqc ? `Your CGPA is ${st.cgpa.toFixed(2)}, exactly the minimum. Meeting the minimum counts as eligible.` : `Your CGPA is ${st.cgpa.toFixed(2)}, above the ${job.minCgpa.toFixed(2)} minimum.`) : `Your CGPA is ${st.cgpa.toFixed(2)}, which is ${(job.minCgpa - st.cgpa).toFixed(2)} below the required ${job.minCgpa.toFixed(2)}.` },
    { key: 'backlogs', title: 'Active backlogs', req: job.maxBacklogs === 0 ? 'None allowed' : `At most ${job.maxBacklogs}`, pass: blOk,
      detail: blOk ? `You have ${st.activeBacklogs} active backlogs.${st.clearedBacklogs ? ` Your ${st.clearedBacklogs} cleared backlog${st.clearedBacklogs > 1 ? 's' : ''} do not count against you.` : ''}` : `You have ${st.activeBacklogs} active backlog${st.activeBacklogs > 1 ? 's' : ''} and this drive allows ${job.maxBacklogs}. Clearing it in the next exam cycle would make you eligible.` },
    { key: 'branch', title: 'Branch', req: brOpen ? 'Open to every branch' : job.branches.join(', '), pass: brOk,
      detail: brOpen ? 'This drive is open to every branch.' : brOk ? `${st.branch} is one of the allowed branches.` : `This drive is limited to ${job.branches.join(', ')}. Your branch is ${st.branch}.` },
    { key: 'offer', title: 'Accepted-offer rule', req: 'No accepted offer this season', pass: !accOffer,
      detail: accOffer ? `You accepted an offer from ${accCo ? accCo.name : 'another company'} this season, so you cannot join other drives under the placement rules.` : 'You have not accepted an offer this season, so you can still join drives.' }
  ];
  const eligible = checks.every(c => c.pass);
  const blockers = [];
  const closedMsg = job.status === 'Closed' ? 'This listing is closed and no longer accepts applications.' : job.status === 'Draft' ? 'This listing has not been published yet.' : job.deadline < TODAY() ? `Applications closed on ${fmtDate(job.deadline)}.` : null;
  if (closedMsg) blockers.push({ key: 'closed', msg: closedMsg });
  const existing = db.applications.find(a => a.studentId === st.id && a.companyId === job.companyId);
  if (existing) blockers.push({ key: 'dup', msg: `You already applied to ${co.name} this season. Each student can apply to a company once.` });
  if (co && !co.active) blockers.push({ key: 'paused', msg: `${co.name} is paused by the placement office.` });
  checks.filter(c => !c.pass).forEach(c => blockers.push({ key: c.key, msg: c.detail }));
  return { checks, eligible, blockers, canApply: blockers.length === 0, existing, closed: !!closedMsg };
}

function profileScore(st) {
  const items = [
    ['Add a short summary', !!st.about], ['Add your phone number', !!st.phone], ['List at least five skills', st.skills.length >= 5],
    ['Add a project', st.projects.length > 0], ['Add a certification', st.certs.length > 0], ['Add an internship', st.internships.length > 0],
    ['Add an achievement', st.achievements.length > 0], ['Upload your resume', !!st.resume], ['Confirm your academic details', !!st.cgpa && !!st.usn]
  ];
  const done = items.filter(i => i[1]).length;
  return { pct: Math.round(done / items.length * 100), missing: items.filter(i => !i[1]).map(i => i[0]) };
}
const skillMatch = (st, job) => job.skills.filter(s => st.skills.includes(s)).length;

/* ---- Authentication (demo only: no server session) ---- */
function authenticate(db, role, email, pw) {
  const e = email.trim().toLowerCase();
  const lists = { student: db.students, recruiter: db.recruiters, coordinator: db.coordinators };
  const u = lists[role].find(x => x.email.toLowerCase() === e);
  if (!u) {
    for (const r of Object.keys(lists)) if (r !== role && lists[r].some(x => x.email.toLowerCase() === e)) return { ok: false, field: 'email', msg: `This email belongs to a ${r} account. Choose the ${r} tab to sign in.` };
    return { ok: false, field: 'email', msg: 'No account found for this email in the demo. Check the address or create a student account.' };
  }
  if (u.pw !== hash(pw)) return { ok: false, field: 'password', msg: 'That password does not match. The sample accounts use Demo@1234.' };
  return { ok: true, user: u };
}
function registerStudent(d, f) {
  const email = f.email.trim().toLowerCase(), usn = f.usn.trim().toUpperCase();
  if (d.students.some(s => s.email.toLowerCase() === email)) return { ok: false, field: 'email', msg: 'An account with this email already exists. Sign in instead.' };
  if (d.students.some(s => s.usn === usn)) return { ok: false, field: 'usn', msg: 'This USN is already registered.' };
  const st = { id: uid('s'), name: f.name.trim(), email, usn, branch: f.branch, gradYear: +f.gradYear, cgpa: Math.round(+f.cgpa * 100) / 100, activeBacklogs: 0, clearedBacklogs: 0, phone: '', city: '', about: '', skills: [], projects: [], certs: [], internships: [], achievements: [], resume: null, visibility: { contact: false, searchable: true, resume: true }, acceptedOfferId: null, pw: hash(f.password) };
  d.students.push(st);
  logAudit(d, st.name, 'student', 'Student registered', `${st.usn} (${st.branch}) created a demo account.`);
  return { ok: true, student: st };
}

/* ---- Applications ---- */
function toggleSave(d, sid, jid) {
  const p = getPrefs(d, sid); const i = p.saved.indexOf(jid);
  if (i >= 0) p.saved.splice(i, 1); else p.saved.push(jid);
  return { ok: true, saved: i < 0 };
}
function applyToJob(d, sid, jid) {
  const st = byId(d.students, sid), job = byId(d.jobs, jid);
  if (!st || !job) return { ok: false, msg: 'This listing could not be found.' };
  const ev = evalEligibility(d, st, job);
  if (!ev.canApply) return { ok: false, msg: ev.blockers[0].msg };
  const co = byId(d.companies, job.companyId), t = TODAY();
  const app = { id: uid('a'), studentId: sid, jobId: jid, companyId: job.companyId, status: 'Applied', appliedOn: t, updatedOn: t, history: [{ status: 'Applied', date: t, note: 'Application submitted' }], reason: null };
  d.applications.push(app);
  logAudit(d, st.name, 'student', 'Application submitted', `${st.usn} applied to ${co.name}, ${job.title}.`);
  d.recruiters.filter(r => r.companyId === co.id).forEach(r => notify(d, r.id, `${st.name} applied for ${job.title}.`));
  return { ok: true, msg: `Application sent to ${co.name}. You can follow it under My Applications.`, app };
}
function moveApp(d, app, to, note) {
  if (TERMINAL.includes(app.status) || app.status === 'Accepted') return { ok: false, msg: `This application is already ${app.status.toLowerCase()} and cannot change.` };
  if (rank(app.status) + 1 !== rank(to)) return { ok: false, msg: `An application moves one stage at a time. This one is at "${app.status}", so the next stage is "${STAGES[rank(app.status) + 1]}", not "${to}".` };
  app.status = to; app.updatedOn = TODAY(); app.history.push({ status: to, date: TODAY(), note: note || to });
  return { ok: true };
}
const ctxNames = (d, app) => { const job = byId(d.jobs, app.jobId), co = byId(d.companies, app.companyId), st = byId(d.students, app.studentId); return { job, co, st }; };

function shortlistApp(d, appId, actor) {
  const app = byId(d.applications, appId); const { job, co, st } = ctxNames(d, app);
  const r = moveApp(d, app, 'Shortlisted', 'Shortlisted by the recruiter'); if (!r.ok) return r;
  notify(d, st.id, `${co.name} shortlisted you for ${job.title}.`);
  logAudit(d, actor.name, actor.role, 'Candidate shortlisted', `${co.name}: ${st.name} shortlisted for ${job.title}.`);
  return { ok: true, msg: `${st.name} is now shortlisted.` };
}
function scheduleInterview(d, appId, slot, actor) {
  const app = byId(d.applications, appId); const { job, co, st } = ctxNames(d, app);
  if (!['Shortlisted', 'Interview Scheduled'].includes(app.status)) return { ok: false, msg: 'Interviews can be scheduled only for shortlisted candidates.' };
  if (d.interviews.some(i => i.appId === appId && i.status === 'Scheduled')) return { ok: false, msg: 'A round is already scheduled. Record its outcome before adding another round.' };
  if (slot.date < TODAY()) return { ok: false, msg: 'Pick today or a future date for the interview.' };
  const clash = d.interviews.find(i => i.studentId === st.id && i.status === 'Scheduled' && i.date === slot.date && i.time === slot.time);
  if (clash) return { ok: false, msg: `Slot clash: ${st.name} already has an interview on ${fmtDate(slot.date)} at ${slot.time}. Choose another time.` };
  if (app.status === 'Shortlisted') { const r = moveApp(d, app, 'Interview Scheduled', `${slot.round} scheduled`); if (!r.ok) return r; } else { app.updatedOn = TODAY(); app.history.push({ status: 'Interview Scheduled', date: TODAY(), note: `${slot.round} scheduled` }); }
  d.interviews.push({ id: uid('i'), appId, studentId: st.id, companyId: co.id, jobId: job.id, round: slot.round, date: slot.date, time: slot.time, mode: slot.mode, venue: slot.venue, notes: slot.notes || 'Arrive ten minutes early and keep your resume handy.', status: 'Scheduled', result: null, feedback: '' });
  notify(d, st.id, `${co.name} scheduled ${slot.round} on ${fmtDate(slot.date)} at ${slot.time}.`);
  logAudit(d, actor.name, actor.role, 'Interview scheduled', `${co.name}: ${slot.round} for ${st.name} on ${fmtDate(slot.date)}.`);
  return { ok: true, msg: `${slot.round} scheduled for ${st.name} on ${fmtDate(slot.date)} at ${slot.time}.` };
}
function recordOutcome(d, ivId, pass, final, feedback, actor) {
  const iv = byId(d.interviews, ivId); if (!iv || iv.status !== 'Scheduled') return { ok: false, msg: 'This interview has no pending outcome to record.' };
  const app = byId(d.applications, iv.appId); const { job, co, st } = ctxNames(d, app);
  iv.status = 'Completed'; iv.result = pass ? 'Passed' : 'Not selected'; iv.feedback = feedback || '';
  if (pass) {
    if (final) { const r = moveApp(d, app, 'Interviewed', 'Interview stage completed'); if (!r.ok) { iv.status = 'Scheduled'; iv.result = null; return r; } }
    else { app.updatedOn = TODAY(); app.history.push({ status: 'Interview Scheduled', date: TODAY(), note: `Passed ${iv.round}` }); }
    notify(d, st.id, `${co.name}: you passed ${iv.round}.`);
  } else {
    app.status = 'Rejected'; app.updatedOn = TODAY(); app.reason = `Not selected after ${iv.round}.${feedback ? ' ' + feedback : ''}`; app.history.push({ status: 'Rejected', date: TODAY(), note: 'Not selected' });
    notify(d, st.id, `${co.name} did not move you forward after ${iv.round}.`);
  }
  logAudit(d, actor.name, actor.role, 'Interview outcome', `${co.name}: ${st.name} ${pass ? 'passed' : 'not selected'} in ${iv.round}.`);
  return { ok: true, msg: pass ? (final ? `${st.name} has completed the interview stage and can now receive an offer.` : `${st.name} passed ${iv.round}. You can schedule the next round.`) : `${st.name} was marked not selected.` };
}
function rejectApp(d, appId, reason, actor) {
  const app = byId(d.applications, appId); const { job, co, st } = ctxNames(d, app);
  if (app.status === 'Offered') return { ok: false, msg: 'An offer is already issued for this application, so it cannot be rejected.' };
  if (!isActive(app)) return { ok: false, msg: `This application is already ${app.status.toLowerCase()}.` };
  app.status = 'Rejected'; app.updatedOn = TODAY(); app.reason = reason; app.history.push({ status: 'Rejected', date: TODAY(), note: 'Not selected' });
  d.interviews.forEach(i => { if (i.appId === appId && i.status === 'Scheduled') { i.status = 'Cancelled'; } });
  notify(d, st.id, `${co.name} closed your application for ${job.title}.`);
  logAudit(d, actor.name, actor.role, 'Application rejected', `${co.name}: ${st.name}, ${job.title}.`);
  return { ok: true, msg: `${st.name}'s application was marked not selected.` };
}
function issueOffer(d, appId, pkg, actor) {
  const app = byId(d.applications, appId); const { job, co, st } = ctxNames(d, app);
  if (d.offers.some(o => o.appId === appId)) return { ok: false, msg: 'This application already has an offer. An application can have at most one.' };
  if (app.status !== 'Interviewed') return { ok: false, msg: app.status === 'Interview Scheduled' ? 'An offer can be issued only after the interview stage is completed. Record the final interview outcome first.' : `An offer needs the application to be at "Interviewed". This one is at "${app.status}".` };
  if (st.acceptedOfferId) return { ok: false, msg: `${st.name} has already accepted an offer this season and cannot receive another.` };
  if (!(pkg > 0)) return { ok: false, msg: 'Enter a package greater than zero.' };
  const r = moveApp(d, app, 'Offered', 'Offer issued'); if (!r.ok) return r;
  d.offers.push({ id: uid('o'), appId, studentId: st.id, companyId: co.id, jobId: job.id, package: pkg, date: TODAY(), respondBy: addDays(10), joiningDate: '2027-07-01', status: 'Issued' });
  notify(d, st.id, `${co.name} issued you an offer for ${job.title}.`);
  logAudit(d, actor.name, actor.role, 'Offer issued', `${co.name}: offer of ${pkg} LPA to ${st.name}.`);
  return { ok: true, msg: `Offer of ${pkg} LPA issued to ${st.name}.` };
}
function acceptOffer(d, offerId, sid) {
  const o = byId(d.offers, offerId), st = byId(d.students, sid);
  if (!o || o.studentId !== sid) return { ok: false, msg: 'This offer is not available to you.' };
  if (st.acceptedOfferId) return { ok: false, msg: 'You have already accepted an offer this season.' };
  if (o.status !== 'Issued') return { ok: false, msg: `This offer is ${o.status.toLowerCase()} and can no longer be accepted.` };
  const co = byId(d.companies, o.companyId), t = TODAY();
  o.status = 'Accepted'; st.acceptedOfferId = o.id;
  const app = byId(d.applications, o.appId); app.status = 'Accepted'; app.updatedOn = t; app.history.push({ status: 'Accepted', date: t, note: 'Offer accepted' });
  d.offers.forEach(x => { if (x.studentId === sid && x.id !== o.id && x.status === 'Issued') { x.status = 'Lapsed'; const a = byId(d.applications, x.appId); a.status = 'Closed'; a.updatedOn = t; a.reason = 'Closed automatically because you accepted another offer. Accepting an offer ends your participation in other drives this season.'; a.history.push({ status: 'Closed', date: t, note: 'Offer lapsed' }); } });
  d.applications.forEach(a => { if (a.studentId === sid && a.id !== o.appId && isActive(a)) { a.status = 'Closed'; a.updatedOn = t; a.reason = `Closed automatically because you accepted an offer from ${co.name}. Placement rules end your participation in other drives once you accept.`; a.history.push({ status: 'Closed', date: t, note: 'Closed after offer acceptance' }); } });
  d.interviews.forEach(i => { if (i.studentId === sid && i.status === 'Scheduled') i.status = 'Cancelled'; });
  d.recruiters.filter(r => r.companyId === co.id).forEach(r => notify(d, r.id, `${st.name} accepted the offer for ${byId(d.jobs, o.jobId).title}.`));
  logAudit(d, st.name, 'student', 'Offer accepted', `${st.usn} accepted ${co.name} (${o.package} LPA).`);
  return { ok: true, msg: `You accepted the offer from ${co.name}. Your other applications were closed.` };
}
function declineOffer(d, offerId, sid) {
  const o = byId(d.offers, offerId); if (!o || o.studentId !== sid || o.status !== 'Issued') return { ok: false, msg: 'This offer cannot be declined.' };
  o.status = 'Declined'; const a = byId(d.applications, o.appId); a.status = 'Closed'; a.updatedOn = TODAY(); a.reason = 'You declined this offer.'; a.history.push({ status: 'Closed', date: TODAY(), note: 'Offer declined' });
  const co = byId(d.companies, o.companyId); logAudit(d, byId(d.students, sid).name, 'student', 'Offer declined', `Declined ${co.name}.`);
  return { ok: true, msg: `You declined the offer from ${co.name}.` };
}

/* Demo helper: advance one application by one stage as a recruiter would. */
function simulateNext(d, appId) {
  const app = byId(d.applications, appId), actor = { name: 'Demo recruiter', role: 'recruiter' };
  const job = byId(d.jobs, app.jobId);
  if (app.status === 'Applied') return shortlistApp(d, appId, actor);
  if (app.status === 'Shortlisted') {
    for (let n = 3; n < 14; n++) { const r = scheduleInterview(d, appId, { round: 'Technical Interview', date: addDays(n), time: '11:00', mode: 'Online', venue: `https://meet.example/${job.id}-demo`, notes: 'Demo interview created by the simulate button.' }, actor); if (r.ok || !/clash/i.test(r.msg)) return r; }
  }
  if (app.status === 'Interview Scheduled') { const iv = d.interviews.find(i => i.appId === appId && i.status === 'Scheduled'); if (!iv) return { ok: false, msg: 'No scheduled round to complete.' }; return recordOutcome(d, iv.id, true, true, 'Demo outcome.', actor); }
  if (app.status === 'Interviewed') return issueOffer(d, appId, job.package, actor);
  if (app.status === 'Offered') return { ok: false, msg: 'Offers are accepted by you on the Offers page. Open it to accept or decline.' };
  return { ok: false, msg: `This application is ${app.status.toLowerCase()} and has no further stages.` };
}

/* ---- Listings and coordinator controls ---- */
function saveJob(d, job, actor) {
  const i = d.jobs.findIndex(j => j.id === job.id);
  if (i >= 0) d.jobs[i] = { ...d.jobs[i], ...job }; else d.jobs.push(job);
  const co = byId(d.companies, job.companyId);
  logAudit(d, actor.name, actor.role, i >= 0 ? 'Listing updated' : 'Listing created', `${co.name}: ${job.title} (${job.status}).`);
  return { ok: true };
}
function setJobStatus(d, jid, status, actor, deadline) {
  const j = byId(d.jobs, jid), co = byId(d.companies, j.companyId);
  if (status === 'Open') { const dl = deadline || j.deadline; if (dl < TODAY()) return { ok: false, msg: 'Set a deadline that is today or later before publishing.' }; j.deadline = dl; }
  j.status = status;
  logAudit(d, actor.name, actor.role, status === 'Open' ? 'Listing published' : 'Listing closed', `${co.name}: ${j.title}.`);
  return { ok: true, msg: status === 'Open' ? `${j.title} is now open for applications.` : `${j.title} is closed. No new applications will be accepted.` };
}

/* ---- Stats and exports ---- */
function funnelOf(apps) {
  const reached = s => apps.filter(a => a.history.some(h => h.status === s)).length;
  return [{ label: 'Applied', value: apps.length }, { label: 'Shortlisted', value: reached('Shortlisted') }, { label: 'Interviewed', value: apps.filter(a => a.history.some(h => h.status === 'Interviewed')).length }, { label: 'Offered', value: reached('Offered') }, { label: 'Accepted', value: reached('Accepted') }];
}
function toCsv(rows) { return rows.map(r => r.map(c => { const s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n'); }
function simulateShortlist(db, job, crit) {
  const out = { eligible: [], reasons: { offer: [], cgpa: [], backlogs: [], branch: [] }, alreadyApplied: 0 };
  db.students.forEach(st => {
    let why = null;
    if (st.acceptedOfferId) why = 'offer';
    else if (!cgGte(st.cgpa, crit.minCgpa)) why = 'cgpa';
    else if (st.activeBacklogs > crit.maxBacklogs) why = 'backlogs';
    else if (crit.branches.length && !crit.branches.includes(st.branch)) why = 'branch';
    if (why) out.reasons[why].push(st); else { out.eligible.push(st); if (db.applications.some(a => a.studentId === st.id && a.companyId === job.companyId)) out.alreadyApplied++; }
  });
  out.ineligible = Object.values(out.reasons).reduce((n, a) => n + a.length, 0);
  return out;
}

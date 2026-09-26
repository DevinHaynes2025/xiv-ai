'use client';

import React, { useRef, useState } from 'react';
import { ENGINE_NAMES, FIXTURE_TIME, UNIVERSES, activeUniverse, agents, approvalIdentity, initialState, reviewDemo, switchUniverse, visibleApprovals, visibleReceipts, type ConsoleState, type Decision } from './model';

const sections = ['Overview', 'Agents', 'Approvals', 'Audit', 'Infrastructure', 'Security'] as const;
type Section = typeof sections[number];
function Fields({ rows }: { rows: Readonly<Record<string, string | number | null>> }) {
  return <dl className="qc-fields">{Object.entries(rows).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'None'}</dd></div>)}</dl>;
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="qc-empty">{children}</p>; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="qc-tag">{children}</span>; }
export function CoreMap({ onSelect }: { onSelect: (id: string) => void }) {
  return <div className="qc-map" aria-label="Demonstration system map">
    <div className="qc-orbit qc-orbit-outer" aria-hidden="true" /><div className="qc-orbit qc-orbit-inner" aria-hidden="true" />
    <button className="qc-core" onClick={() => onSelect('core')}><span className="qc-core-icon" aria-hidden="true">✦</span><strong>XVI QUANTUM/AGI<br />CORE</strong><span>LOCAL CONSOLE</span><small>0 running engines · no runtime connected</small></button>
    <div className="qc-engine-ring">{ENGINE_NAMES.map((name, i) => <button key={name} className="qc-engine" style={{ '--angle': `${i * 30}deg` } as React.CSSProperties} onClick={() => onSelect(name)} aria-label={`Inspect ${name} engine`}><span className="qc-engine-number">{String(i + 1).padStart(2, '0')}</span><strong>{name}</strong><small>OFFLINE</small></button>)}</div>
    <p className="qc-map-caption">12 ENGINE SLOTS / DEMO TOPOLOGY / NO ACTIVE CONNECTIONS</p>
  </div>;
}
export default function CoreConsole() {
  const [state, setState] = useState(initialState);
  const [section, setSection] = useState<Section>('Overview');
  const [selected, setSelected] = useState('core');
  const [query, setQuery] = useState('');
  const [verification, setVerification] = useState('ALL');
  const [date, setDate] = useState('');
  const [notice, setNotice] = useState('Local demonstration ready. No authenticated session or external adapters.');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const universe = activeUniverse(state);
  const approvals = visibleApprovals(state);
  const receipts = visibleReceipts(state);
  const nodes = agents(state);
  const filtered = receipts.filter(r => `${r.actor} ${r.organizationId} ${r.agentId} ${r.action} ${r.decision} ${r.risk}`.toLowerCase().includes(query.toLowerCase()) && (verification === 'ALL' || r.verification === verification) && (!date || r.timestamp.startsWith(date)));
  const selectUniverse = (id: string) => {
    if (inFlight.current) return;
    setState(previous => switchUniverse(previous, id)); setSelected('core'); setQuery(''); setVerification('ALL'); setDate('');
    setNotice('Demo universe changed; detail selection and filters cleared. This does not establish membership authority.');
  };
  const decide = async (identity: string, decision: Decision) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      const result = await reviewDemo(state, JSON.stringify({ identity, decision }), Date.now());
      setState(result.state); setNotice(result.message);
    } finally { inFlight.current = false; setBusy(false); }
  };
  const selectedAgent = nodes.find(a => a.id === selected);
  const selectedReceipt = receipts.find(r => r.id === selected);
  return <main className="qc-console">
    <a href="#qc-main" className="qc-skip">Skip to console</a>
    <aside className="qc-sidebar">
      <a className="qc-brand" href="/quantum-core"><span aria-hidden="true">◈</span> XVI <small>PRIVATE SYSTEMS</small></a>
      <p className="qc-eyebrow">CONTROL CENTER</p>
      <nav aria-label="Console sections">{sections.map((name, i) => <button key={name} aria-current={section === name ? 'page' : undefined} onClick={() => { setSection(name); setSelected('core'); }}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{name}{name === 'Approvals' && <b>{approvals.filter(a => a.state === 'PENDING').length}</b>}</button>)}</nav>
      <div className="qc-sidebar-bottom"><Tag>OFFLINE_ONLY</Tag><p>Local session · zero permissions</p><small>CI_UNVERIFIED<br />No agents activated</small></div>
    </aside>
    <div className="qc-body">
      <header className="qc-topbar"><div><span className="qc-eyebrow">XVI OS / {section.toUpperCase()}</span><h1>Quantum/AGI Core Console</h1></div><label>Demo organization universe<select value={state.universeId} disabled={busy} onChange={e => selectUniverse(e.target.value)}>{UNIVERSES.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label></header>
      <div className="qc-banner"><Tag>DEMO DATA</Tag><span>Session-only synthetic records. No verified runtime, cloud synchronization, or authenticated authority.</span></div>
      <div className="qc-notice" role="status" aria-live="polite">{busy ? 'Recording local demo decision…' : notice}</div>
      <div id="qc-main" tabIndex={-1}>
        <section className="qc-metrics" aria-label="Core status"><article><small>Operating mode</small><strong>OFFLINE</strong><span>External effects disabled</span></article><article><small>Running engines</small><strong>0 <em>/ 12</em></strong><span>No runtime evidence</span></article><article><small>Connected agents</small><strong>0 <em>/ {nodes.length}</em></strong><span>Disabled demo identities</span></article><article><small>Pending reviews</small><strong>{approvals.filter(a => a.state === 'PENDING').length.toString().padStart(2, '0')}</strong><span>Review does not execute</span></article></section>
        {section === 'Overview' && <div className="qc-overview"><section className="qc-panel qc-map-panel"><div className="qc-panel-heading"><h2>System architecture</h2><Tag>DEMO TOPOLOGY</Tag></div><CoreMap onSelect={setSelected} /></section><section className="qc-panel"><h2>{selected === 'core' ? 'Core inspection' : `${selected} engine`}</h2>{selected === 'core' ? <Fields rows={{ 'System state': 'Offline local demonstration', 'Organization': universe.organizationId, 'Universe': universe.id, 'Source': 'DEMO_DATA', 'Fixture timestamp': FIXTURE_TIME, 'Freshness': 'Static fixture; not live telemetry', 'Last verified receipt': 'None', 'Open incidents': '1 synthetic example; live count unknown', 'Synchronization': 'Unavailable — no transport', 'Permissions': 'None' }} /> : <Fields rows={{ 'Engine ID': `engine-${ENGINE_NAMES.indexOf(selected as typeof ENGINE_NAMES[number]) + 1}`, 'Version': 'demo-v1', 'State': 'OFFLINE', 'Workloads': 'None', 'Dependency health': 'Unknown; adapter unavailable', 'Resource usage': 'Unknown', 'Heartbeat': 'Unavailable', 'Successful evaluation': 'No verified evidence', 'Risk': 'Unassessed', 'Approval': 'Required before any future execution', 'Execution mode': 'Local demo; execution disabled' }} />}<p className="qc-muted">Quantum/AGI is the product name. This interface establishes no quantum computing, AGI, or consciousness capability.</p></section></div>}
        {section === 'Agents' && <section className="qc-panel"><h2>Governed agent nodes</h2><p>Disabled identities in {universe.name}. Select a node to inspect its boundaries.</p><div className="qc-card-grid">{nodes.map(a => <button className="qc-node" key={a.id} onClick={() => setSelected(a.id)} aria-pressed={selected === a.id}><span aria-hidden="true">◉</span><strong>{a.role}</strong><small>{a.id}</small><Tag>OFFLINE · DEMO DATA</Tag></button>)}</div>{selectedAgent ? <><h3>{selectedAgent.role}</h3><Fields rows={{ ...selectedAgent, 'Approval required': 'Human review plus separate execution grant (unavailable)', 'Audit receipts': receipts.filter(r => r.agentId === selectedAgent.id).length }} /></> : <Empty>Select an agent to view its identity, evidence, dependencies, tools, and audit count.</Empty>}</section>}
        {section === 'Approvals' && <section className="qc-panel"><h2>Human approval gate</h2><p>Record synthetic review decisions. No decision issues an execution grant.</p><div className="qc-card-grid">{approvals.map(a => <article className="qc-approval" key={approvalIdentity(a)}><Tag>{a.state === 'PENDING' && Date.now() >= Date.parse(a.expiresAt) ? 'EXPIRED' : a.state} · {a.risk}</Tag><h3>{a.action}</h3><Fields rows={{ 'Action ID': a.actionId, 'Review cycle': a.reviewCycleId, 'Organization': a.organizationId, 'Membership': a.membershipId, 'Role version': a.membershipRoleVersion, 'Principal': a.principal, 'Agent': a.agentId, 'Target': a.target, 'Reason': a.reason, 'Expected effect': a.effect, 'Reversibility': a.reversibility, 'Created': a.createdAt, 'Expires': a.expiresAt, 'Reviewer role': a.reviewerRole, 'Supporting evidence': a.evidence, 'Receipt': receipts.find(r => r.correlationId === approvalIdentity(a))?.id ?? 'None' }} /><div className="qc-actions">{(['APPROVE', 'DENY', 'REQUEST_CHANGES'] as const).map(d => <button key={d} disabled={busy || a.state !== 'PENDING' || Date.now() >= Date.parse(a.expiresAt)} onClick={() => void decide(approvalIdentity(a), d)}>{d === 'APPROVE' ? 'Approve demo review' : d === 'DENY' ? 'Deny' : 'Request changes'}</button>)}</div></article>)}</div></section>}
        {section === 'Audit' && <section className="qc-panel"><h2>Audit receipt ledger</h2><p>Append-only session records. SHA-256 links are not signatures; all receipts remain UNVERIFIED. Reload clears this ledger.</p><div className="qc-filters"><label>Actor, agent, action, organization, risk or decision<input value={query} onChange={e => setQuery(e.target.value)} maxLength={128} /></label><label>Verification<select value={verification} onChange={e => setVerification(e.target.value)}>{['ALL', 'VERIFIED', 'UNVERIFIED', 'TAMPERED', 'INCOMPLETE', 'EXPIRED'].map(s => <option key={s}>{s}</option>)}</select></label><label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>{filtered.length ? filtered.map(r => <button className="qc-receipt" key={r.id} onClick={() => setSelected(r.id)}><Tag>{r.verification}</Tag><strong>{r.action} · {r.decision}</strong><small>{r.timestamp} · {r.actor}</small></button>) : <Empty>No matching receipts. Record a demo review decision to create one.</Empty>}{selectedReceipt && <article><h3>Receipt details</h3><Fields rows={{ ...selectedReceipt }} /></article>}</section>}
        {section === 'Infrastructure' && <section className="qc-panel"><h2>Offline edge & secure cloud</h2><div className="qc-card-grid"><article><h3>Local edge · DEMO DATA</h3><Fields rows={{ 'Node': 'demo-edge-01', 'Connectivity': 'Offline', 'Local model': 'Not connected', 'Queued work': '0 executable tasks', 'Last synchronization': 'Never', 'Conflicts': 'Unknown; no synchronization adapter', 'Storage usage': 'Session memory only; unmeasured', 'Approved sync scope': 'None', 'Version': 'demo-v1', 'Health': 'Unknown' }} /></article><article><h3>Cloud · UNAVAILABLE</h3><Fields rows={{ 'Environment': 'Not connected', 'Region': 'Unknown', 'Compute / storage / queue / network': 'Unknown', 'Service health': 'Unavailable', 'Last deployment': 'No verified evidence', 'Configuration': 'No cloud configuration loaded', 'Incidents': 'Unknown' }} /></article><article><h3>Private data vault · UNAVAILABLE</h3><Fields rows={{ 'Health / encryption / backup': 'Unknown; no vault adapter', 'Classification': 'Synthetic public fixtures only', 'Owner': universe.organizationId, 'Retention': 'Until page reload', 'Access policy': 'No data access grants', 'Integrity check': 'Not performed', 'Connectors': 'None', 'Active grants': 0 }} /></article><article><h3>Integration fabric · DISABLED</h3><Fields rows={{ 'Connection': 'No adapters installed by this slice', 'Authentication': 'Unavailable', 'Scopes / data direction': 'None', 'Last exchange': 'Never', 'Error': 'No connection attempted', 'Approval requirement': 'Separate reviewed boundary', 'Owner': universe.organizationId }} /></article></div></section>}
        {section === 'Security' && <section className="qc-panel"><h2>Safety, privacy & fraud defense</h2><Tag>DEMO DATA · NOT THREAT DETECTION</Tag><p>No security telemetry source is connected. Live findings and containment status are unknown.</p><details><summary>Inspect synthetic incident: external action awaiting review</summary><Fields rows={{ 'Incident': `${universe.id}-incident-1`, 'Severity': 'Demo informational', 'Affected component': 'Disconnected integration', 'Evidence': 'Synthetic approval proposal', 'Containment': 'External effects unavailable', 'Required human action': 'Inspect the demo review queue', 'Policy': 'Default deny; no execution grants' }} /><ol><li>{FIXTURE_TIME} — Synthetic proposal created.</li><li>Human review requested; no action executed.</li></ol></details><Fields rows={{ 'Threat / privacy / fraud signals': 'Unknown', 'Cross-tenant / replay / malformed attempts': 'No live telemetry', 'Expired grants': 'No grants issued', 'Suspicious tools': 'All tools disabled' }} /></section>}
      </div>
      <footer className="qc-footer"><span>● OFFLINE_ONLY · CI_UNVERIFIED</span><span>DEMO DATA · {universe.organizationId} · fixture {FIXTURE_TIME}</span></footer>
    </div>
  </main>;
}

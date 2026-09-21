'use client';

import React, { useRef, useState } from 'react';
import { CAPABILITY_MATRIX, createCapabilitySession, type CapabilityOperation, type CapabilitySnapshot, type ExecutionMode } from '../../../../ai/runtime/offline-team/xvi-capability-contract';

type Props = { snapshot: CapabilitySnapshot; consent: boolean; mobileRevision: number; notice: string;
  onConsent: (value: boolean) => void; onRefresh: () => void;
  onRequest: (operation: CapabilityOperation, targetMode: ExecutionMode | null, mobile?: boolean) => void };

export function CapabilityStatusView({ snapshot: s, consent, mobileRevision, notice, onConsent, onRefresh, onRequest }: Props) {
  return <main className="capability-preview">
    <style>{`
      .capability-preview{font:16px/1.6 system-ui,sans-serif;background:#f3f6f8;color:#172431;min-height:100vh;padding:clamp(16px,4vw,48px);overflow-wrap:anywhere}
      .capability-preview *{box-sizing:border-box}.capability-wrap{max-width:1100px;margin:auto}.capability-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
      .capability-preview section,.capability-preview article{background:white;border:1px solid #bdcbd4;border-radius:12px;padding:20px;margin:16px 0;min-width:0}
      .capability-preview button{font:inherit;min-height:44px;padding:8px 12px;border:1px solid #607d84;border-radius:6px;background:white;color:#172431;margin:4px;cursor:pointer}
      .capability-preview button:disabled{cursor:not-allowed;color:#65727a}.capability-preview :focus-visible{outline:3px solid #156dce;outline-offset:3px}
      .capability-preview label{display:block;padding:12px 0}.capability-preview input{width:20px;height:20px;margin-right:8px}.capability-preview dt{font-weight:700}.capability-preview dd{margin:0 0 8px}
      .capability-preview a{color:#135c94}.capability-notice{padding:16px;border:1px solid #607d84;background:#eaf2f7;min-height:56px}
      @media(max-width:720px){.capability-grid{grid-template-columns:minmax(0,1fr)}}
    `}</style>
    <div className="capability-wrap">
      <a href="#capability-status">Skip to capability status</a>
      <h1>Offline, online, and cloud capability contract</h1>
      <p>OFFLINE_FIRST · ONLINE_BY_CONSENT · CLOUD_GOVERNED</p>
      <p><strong>Current execution mode: {s.executionMode}</strong> · CI_UNVERIFIED</p>
      <p>This foundation records synthetic local proposals only. Online and cloud modes are unavailable. No agents, providers, credentials, or background workers are active.</p>
      <p>Tenant: {s.tenantId} · Universe: {s.universeId} · Actor: {s.actorId}. These are local labels, not verified identities or provisioned organization universes.</p>
      <label><input type="checkbox" checked={consent} onChange={e => onConsent(e.target.checked)} />I consent to recording synthetic request metadata in this local session. This does not authorize networking.</label>
      <div className="capability-notice" role="status" aria-live="polite">{notice || 'Ready. No action has been executed.'}</div>
      <div id="capability-status" className="capability-grid">
        {(['laptop', 'mobile'] as const).map(device => <section key={device} aria-labelledby={`${device}-capability-heading`} data-device={device}>
          <h2 id={`${device}-capability-heading`}>{device === 'laptop' ? 'Laptop' : 'Mobile'} preview</h2>
          <dl>
            <dt>Execution mode</dt><dd>{s.executionMode}</dd>
            <dt>Connectivity</dt><dd>Unknown — not observed. Internet access is not required for these local controls.</dd>
            <dt>Synchronization</dt><dd>Blocked — no authenticated adapter; nothing is uploaded.</dd>
            <dt>Uncertainty</dt><dd>Identity and connectivity unverified.</dd>
            <dt>Pending human review</dt><dd>{s.pendingReviewCount} local proposal(s). No approval or execution has occurred.</dd>
            <dt>Edit revision</dt><dd>{device === 'mobile' ? mobileRevision : s.revision}; shared revision {s.revision}</dd>
          </dl>
          <button disabled={!consent} onClick={() => onRequest('PROPOSE_LOCAL_CHANGE', null, device === 'mobile')}>Propose local change from {device}</button>
          {device === 'mobile' && <button onClick={onRefresh}>Refresh mobile revision locally</button>}
        </section>)}
      </div>
      <p>The previews share one in-memory session, not two connected devices. Mobile holds its edit revision until you refresh it. Reload loses this queue; durable encrypted storage is a separate story.</p>
      <section aria-labelledby="mode-contract-heading">
        <h2 id="mode-contract-heading">Capability matrix</h2>
        {Object.entries(CAPABILITY_MATRIX).map(([mode, row]) => <article key={mode}>
          <h3>{mode}</h3><p>{row.availability === 'LOCAL_METADATA_ONLY' ? 'Available: local proposal metadata only.' : 'Unavailable in this foundation. Future requirements:'}</p>
          <ul>{row.requirements.map(r => <li key={r}>{r.replaceAll('_', ' ').toLowerCase()}</li>)}</ul>
        </article>)}
        <button disabled={!consent} onClick={() => onRequest('REQUEST_MODE_CHANGE', 'ONLINE_ALLOWED')}>Request online mode (unavailable)</button>
        <button disabled={!consent} onClick={() => onRequest('REQUEST_MODE_CHANGE', 'CLOUD_GOVERNED')}>Request cloud mode (unavailable)</button>
        <button disabled={!consent} onClick={() => onRequest('SYNCHRONIZE', null)}>Request synchronization (unavailable)</button>
        <button disabled={!consent} onClick={() => onRequest('DISCARD_LOCAL_CHANGES', null)}>Discard local pending changes</button>
      </section>
      <section aria-labelledby="policy-metadata-heading">
        <h2 id="policy-metadata-heading">Policy and presentation metadata</h2>
        <p>Policy: {s.policyVersion}. Agents disabled · Zero permissions · Consequential actions require human approval and cannot execute here.</p>
        <p>Language: {s.preferences.language}; locale: {s.preferences.locale}; accessibility preference: {s.preferences.accessibility}; cultural context: {s.preferences.culturalContext}; residency policy: {s.preferences.dataResidency}.</p>
        <p>These configurable contract values do not translate this preview or implement cloud residency controls. Changing them never relaxes safety rules.</p>
      </section>
    </div>
  </main>;
}

export default function CapabilityPreview() {
  const [session] = useState(() => createCapabilitySession('tenant-demo', 'universe-demo', 'human-demo'));
  const [snapshot, setSnapshot] = useState(session.snapshot);
  const [consent, setConsent] = useState(false);
  const [mobileRevision, setMobileRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const counter = useRef(0);
  return <CapabilityStatusView snapshot={snapshot} consent={consent} mobileRevision={mobileRevision} notice={notice}
    onConsent={setConsent} onRefresh={() => { setMobileRevision(snapshot.revision); setNotice('Mobile revision refreshed locally. No synchronization occurred.'); }}
    onRequest={(operation, targetMode, mobile) => {
      const r = session.record(JSON.stringify({ requestId: `ui-${++counter.current}`, executionMode: snapshot.executionMode,
        tenantId: snapshot.tenantId, universeId: snapshot.universeId, actorId: snapshot.actorId,
        purpose: 'CLARIFY_GOAL', policyVersion: snapshot.policyVersion, baseRevision: mobile ? mobileRevision : snapshot.revision,
        operation, targetMode, consent }));
      setSnapshot(session.snapshot());
      setNotice(`${r.outcome}: ${r.reason}. Mode ${r.executionMode}; tenant ${r.tenantId}; universe ${r.universeId}; actor ${r.actorId}; purpose ${r.purpose}; policy ${r.policyVersion}. Receipt ${r.id}. Local, unsigned, not persisted.`);
    }} />;
}

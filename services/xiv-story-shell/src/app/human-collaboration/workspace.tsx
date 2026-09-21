'use client';

import React, { useRef, useState } from 'react';
import {
  createHumanWorkspace, WORKSPACE_FEEDBACK,
  type FeedbackKind, type HumanWorkspaceSnapshot,
} from '../../../../ai/runtime/offline-team/xvi-human-workspace';

type Device = 'laptop' | 'mobile';
type Props = {
  snapshot: HumanWorkspaceSnapshot;
  bases: Record<Device, number>;
  consent: boolean;
  mobileOffline: boolean;
  notice: string;
  exported: string;
  onConsent: (value: boolean) => void;
  onOffline: (value: boolean) => void;
  onFeedback: (device: Device, kind: FeedbackKind) => void;
  onReview: (id: string, revoke: boolean) => void;
  onRefresh: () => void;
  onControl: (action: 'pause' | 'resume' | 'kill' | 'delete' | 'export') => void;
};

const styles = `
.hc-workspace{font:16px/1.55 system-ui,sans-serif;color:#172431;background:#f3f6f8;padding:clamp(16px,4vw,48px);min-height:100vh;overflow-wrap:anywhere}
.hc-workspace *{box-sizing:border-box}.hc-wrap{max-width:1160px;margin:auto}.hc-workspace h1{font-size:clamp(28px,4vw,42px);line-height:1.15;margin:12px 0}.hc-workspace h2{font-size:21px;margin:0 0 12px}.hc-workspace h3{font-size:17px;margin:0 0 8px}
.hc-eyebrow{font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:#36576a}.hc-status{display:flex;flex-wrap:wrap;gap:8px}.hc-tag{padding:4px 10px;border:1px solid #b4c9cc;border-radius:20px;background:#e4efed;font-size:13px}
.hc-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:20px;margin-top:24px}.hc-card{background:#fff;border:1px solid #c9d3da;border-radius:14px;padding:20px;min-width:0}.hc-stack{display:grid;gap:16px;align-content:start}.hc-devices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.hc-device{border:1px solid #c9d3da;border-radius:10px;padding:14px;min-width:0}
.hc-workspace button,.hc-workspace select{font:inherit;min-height:44px;border:1px solid #7e929f;border-radius:7px;padding:8px 12px;background:#fff;color:#172431;max-width:100%}.hc-workspace button{cursor:pointer}.hc-workspace button:disabled{cursor:not-allowed;color:#65727a;background:#edf0f2}.hc-workspace button.hc-primary{background:#174e59;color:white}.hc-workspace button.hc-primary:disabled{background:#607d84}.hc-workspace :focus-visible{outline:3px solid #156dce;outline-offset:3px}
.hc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.hc-workspace label{display:block;margin:10px 0}.hc-workspace input[type=checkbox]{width:20px;height:20px;vertical-align:middle;margin-right:8px}.hc-muted{color:#4f6170;font-size:14px}.hc-evidence,.hc-proposal{border-left:3px solid #447f8b;padding:12px 16px;background:#f4f8fa;margin:12px 0}.hc-workspace nav{display:flex;flex-wrap:wrap;gap:16px;margin:20px 0}.hc-workspace a{color:#135c94;text-decoration:underline}.hc-workspace textarea{width:100%;min-height:180px;font:13px/1.5 monospace}.hc-notice{border:1px solid #b3c9d4;padding:12px;background:#eaf2f7;min-height:48px}.hc-workspace ul{padding-left:20px}.hc-workspace summary{cursor:pointer;min-height:44px;padding:8px 0}
@media(max-width:720px){.hc-grid,.hc-devices{grid-template-columns:minmax(0,1fr)}.hc-card{padding:16px}.hc-workspace nav{gap:12px}.hc-actions button{flex:1 1 140px}}
`;

function DeviceComposer({ device, props }: { device: Device; props: Props }) {
  const [kind, setKind] = useState<FeedbackKind>('CLARIFY_GOAL');
  if (props.snapshot.deleted) return null;
  return <section className="hc-device" data-device={device} aria-labelledby={`${device}-heading`}>
    <h3 id={`${device}-heading`}>{device === 'laptop' ? 'Laptop preview' : 'Mobile preview'}</h3>
    <p className="hc-muted">Edit base revision: {props.bases[device]}. Shared revision: {props.snapshot.revision}.</p>
    <label htmlFor={`${device}-feedback`}>Feedback proposal</label>
    <select id={`${device}-feedback`} value={kind} onChange={event => setKind(event.target.value as FeedbackKind)} disabled={props.snapshot.deleted}>
      {Object.entries(WORKSPACE_FEEDBACK).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <div className="hc-actions"><button className="hc-primary" disabled={!props.consent || props.snapshot.paused || props.snapshot.deleted} onClick={() => props.onFeedback(device, kind)}>Propose from {device}</button></div>
  </section>;
}

export function HumanWorkspaceView(props: Props) {
  const { snapshot } = props;
  return <main className="hc-workspace">
    <style>{styles}</style>
    <div className="hc-wrap">
      <a href="#workspace-conversation">Skip to conversation</a>
      <header>
        <p className="hc-eyebrow">XVI AI OS / Human collaboration</p>
        <h1>A shared place to clarify, review, and improve.</h1>
        <p>Six disabled agent identities. Every output stays a proposal. You remain in control.</p>
        <div className="hc-status" aria-label="Workspace status">
          <span className="hc-tag">OFFLINE_ONLY</span><span className="hc-tag">CI_UNVERIFIED</span>
          <span className="hc-tag">{snapshot.deleted ? 'Deleted' : snapshot.killed ? 'Killed' : snapshot.paused ? 'Paused' : 'Local session'}</span>
          <span className="hc-tag">Online synchronization unavailable</span>
        </div>
        <p className="hc-muted">Synthetic demonstration · No real documents · No models running · Memory clears on reload or deletion.</p>
      </header>
      <nav aria-label="Workspace sections"><a href="#workspace-conversation">Conversation</a><a href="#workspace-evidence">Evidence</a><a href="#workspace-controls">Human controls</a><a href="#workspace-team">Team</a></nav>
      <div role="status" aria-live="polite" className="hc-notice">{props.notice || 'Ready for a consented, synthetic feedback proposal.'}</div>
      <div className="hc-grid">
        <div className="hc-stack">
          <section className="hc-card" id="workspace-conversation" aria-labelledby="conversation-heading">
            <h2 id="conversation-heading">Shared conversation</h2>
            <p className="hc-muted">{snapshot.tenantId} / {snapshot.conversationId} · revision {snapshot.revision} · {snapshot.syncState}</p>
            <p>The two previews share this session only. They do not connect a real laptop and phone. Hold the mobile edit revision, make a laptop proposal, then try a mobile proposal to see conflict refusal.</p>
            <label><input type="checkbox" checked={props.consent} onChange={event => props.onConsent(event.target.checked)} disabled={snapshot.deleted} />I consent to retaining these synthetic feedback proposals for this session.</label>
            <label><input type="checkbox" checked={props.mobileOffline} onChange={event => props.onOffline(event.target.checked)} disabled={snapshot.deleted} />Hold mobile edit revision (simulate an offline edit)</label>
            <div className="hc-devices"><DeviceComposer device="laptop" props={props} /><DeviceComposer device="mobile" props={props} /></div>
            <div className="hc-actions"><button onClick={props.onRefresh} disabled={snapshot.deleted}>Refresh mobile edit revision</button></div>
            <h3 style={{ marginTop: 24 }}>Feedback and review decisions</h3>
            {snapshot.proposals.length === 0 ? <p>{snapshot.deleted ? 'Conversation data deleted from this session.' : 'No proposals yet.'}</p> :
              <ol>{snapshot.proposals.map(proposal => <li className="hc-proposal" key={proposal.id}>
                <p>{proposal.summary}</p>
                <p className="hc-muted">{proposal.id} · version {proposal.version} · {proposal.decision} · Not executed</p>
                <p className="hc-muted">Consent recorded · {proposal.license} · {proposal.provenance}</p>
                <div className="hc-actions">
                  <button disabled={snapshot.paused || proposal.decision !== 'AWAITING_HUMAN_REVIEW'} onClick={() => props.onReview(proposal.id, false)}>Approve for review only: {proposal.id}</button>
                  <button disabled={snapshot.deleted || proposal.decision === 'REVOKED'} onClick={() => props.onReview(proposal.id, true)}>Reject or revoke: {proposal.id}</button>
                </div>
              </li>)}</ol>}
            <p className="hc-muted">Approval records a local review decision. It grants no authority and executes nothing. Correction requests create new proposals.</p>
          </section>
          <section className="hc-card" id="workspace-evidence" aria-labelledby="evidence-heading">
            <h2 id="evidence-heading">Evidence and uncertainty</h2>
            {snapshot.evidence.map(item => <article className="hc-evidence" key={item.id}>
              <h3>{item.title}</h3><p>{item.text}</p><p className="hc-muted">Uncertainty: {item.uncertainty}</p>
              <p className="hc-muted">Evidence ID: {item.id}</p>
              <p className="hc-muted">{item.provenance} · {item.license} · {item.classification}</p>
            </article>)}
            {!snapshot.deleted && <p className="hc-muted">Assumption: this is a fictional demonstration. Proposed action: ask a human to clarify. No evidence supports a real-world conclusion.</p>}
          </section>
        </div>
        <aside className="hc-stack" aria-label="Human oversight">
          <section className="hc-card" id="workspace-controls" aria-labelledby="controls-heading">
            <h2 id="controls-heading">Human controls</h2>
            <p>Pause new proposals, stop the session, or remove its local conversation data. Kill remains latched for this session.</p>
            <div className="hc-actions">
              <button onClick={() => props.onControl('pause')} disabled={snapshot.deleted || snapshot.paused}>Pause</button>
              <button onClick={() => props.onControl('resume')} disabled={snapshot.deleted || snapshot.killed || !snapshot.paused}>Resume local proposals</button>
              <button onClick={() => props.onControl('kill')} disabled={snapshot.deleted || snapshot.killed}>Kill session</button>
              <button onClick={() => props.onControl('export')} disabled={snapshot.deleted}>Show local export</button>
              <button onClick={() => props.onControl('delete')} disabled={snapshot.deleted}>Delete conversation</button>
            </div>
            <p className="hc-muted">No durable storage or authenticated synchronization. Deletion cannot retract exports already copied outside this session.</p>
            {props.exported && <label>Local synthetic export<textarea readOnly value={props.exported} /></label>}
          </section>
          <section className="hc-card" id="workspace-team" aria-labelledby="team-heading">
            <h2 id="team-heading">Collaboration team</h2>
            <ul>{snapshot.team.members.map(member => <li key={member.agentId}><strong>{member.role.replaceAll('_', ' ').toLowerCase()}</strong><br /><span className="hc-muted">{member.agentId} · Disabled · Zero permissions</span></li>)}</ul>
            <details><summary>Policy and learning boundaries</summary><p>{snapshot.policyVersion}. Feedback improves versioned proposals only. No silent training, core-value changes, self-authorization, or hidden chain-of-thought disclosure.</p></details>
          </section>
        </aside>
      </div>
    </div>
  </main>;
}

export default function HumanCollaborationWorkspace() {
  const [workspace] = useState(() => createHumanWorkspace('tenant-demo', 'conversation-demo'));
  const [snapshot, setSnapshot] = useState(workspace.snapshot);
  const [bases, setBases] = useState({ laptop: 0, mobile: 0 });
  const [consent, setConsent] = useState(false);
  const [mobileOffline, setMobileOffline] = useState(true);
  const [notice, setNotice] = useState('');
  const [exported, setExported] = useState('');
  const counter = useRef(0);
  const update = (receipt: { reason: string; outcome: string; id: string }) => {
    const next = workspace.snapshot();
    setSnapshot(next);
    setBases(previous => ({ laptop: next.revision, mobile: mobileOffline ? previous.mobile : next.revision }));
    setNotice(`${receipt.outcome}: ${receipt.reason}. Receipt ${receipt.id} (local, not persisted).`);
    setExported('');
  };
  const submit = (kind: 'FEEDBACK' | 'REVIEW' | 'REVOKE', value: string, baseRevision: number) => update(workspace.recordHumanInput(JSON.stringify({
    tenantId: snapshot.tenantId, conversationId: snapshot.conversationId,
    requestId: `ui-request-${++counter.current}`, baseRevision, kind, value, consent,
  })));
  return <HumanWorkspaceView snapshot={snapshot} bases={bases} consent={consent} mobileOffline={mobileOffline} notice={notice} exported={exported}
    onConsent={setConsent}
    onOffline={value => { setMobileOffline(value); if (!value) setBases(previous => ({ ...previous, mobile: snapshot.revision })); }}
    onFeedback={(device, kind) => submit('FEEDBACK', kind, bases[device])}
    onReview={(id, revoke) => submit(revoke ? 'REVOKE' : 'REVIEW', id, snapshot.revision)}
    onRefresh={() => { setBases(previous => ({ ...previous, mobile: snapshot.revision })); setNotice('Mobile edit revision refreshed locally. No network synchronization occurred.'); }}
    onControl={action => {
      if (action === 'export') { const result = workspace.humanOverride.exportConversation(); update(result.receipt); setExported(result.data ?? ''); }
      else if (action === 'delete') { update(workspace.humanOverride.deleteConversation()); setConsent(false); }
      else update(workspace.humanOverride[action]());
    }} />;
}

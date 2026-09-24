import React from 'react';
import type { SystemSnapshot } from '../../../ai/runtime/offline-team/offline-system-snapshot';

export default function OfflineSystemPanel({ snapshot }: { snapshot: SystemSnapshot }) {
  const models = snapshot.installedModels;
  return <main className="console">
    <header><p className="eyebrow">XIV / LOCAL OPERATIONS</p><span className="badge">OFFLINE_ONLY</span>
      <h1>Offline System Console</h1><p className="subtitle">A clear view of your local system. Read-only by design.</p></header>
    <section className="summary" aria-label="System status">
      <article><h2>Operating mode</h2><strong>Offline only</strong><p>Local access · no remote fallback</p></article>
      <article><h2>Readiness</h2><strong>{snapshot.readiness === 'METADATA_READY' ? 'Metadata ready' : snapshot.readiness === 'NO_INSTALLED_MODELS' ? 'No models recorded' : 'Evidence unavailable'}</strong><p>Model execution has not been verified.</p></article>
      <article><h2>Pending reviews</h2><strong>{snapshot.pendingReviews ?? 'Unknown'}</strong><p>{snapshot.pendingReviews === null ? 'Review evidence has not been supplied.' : 'Awaiting human review'}</p></article>
    </section>
    <section className="card"><h2>Installed models <span className="count">{models?.length ?? '—'}</span></h2>
      <p>Local inventory snapshot · model execution has not been verified</p>
      {models === null ? <p className="empty">No model evidence supplied. Installed models are unknown.</p> : models.length === 0 ? <p className="empty">The supplied inventory contains no installed models.</p> :
        <table><thead><tr><th scope="col">Model / reference</th><th scope="col">Size (bytes)</th></tr></thead><tbody>{models.map(model => <tr key={model.modelRef}><td>{model.label}<code>{model.modelRef}</code></td><td>{model.sizeBytes.toLocaleString('en-US')}</td></tr>)}</tbody></table>}
    </section>
    <section className="card"><h2>Verification receipt</h2><p>SHA-256 · snapshot integrity only</p><code>{snapshot.receipt.digest}</code><p>This receipt does not attest to model health, execution, or CI success.</p></section>
    <section className="ci"><div><h2>CI state</h2><strong>{snapshot.ci}</strong></div><p>No CI evidence was checked. No retry was requested.</p></section>
    <footer><span>Tenant reference: <code>{snapshot.identity.tenantRef}</code></span><span>Universe reference: <code>{snapshot.identity.universeRef}</code></span><span>Requester reference: <code>{snapshot.identity.requesterRef}</code></span></footer>
  </main>;
}

export const offlineConsoleCss = `
*{box-sizing:border-box}body{margin:0;background:#eef5ff;color:#102d53;font:15px/1.6 system-ui,sans-serif}.console{max-width:1040px;margin:48px auto;padding:0 24px}header{position:relative;padding:32px 0}.eyebrow{color:#2764ae;font-size:12px;letter-spacing:.18em;font-weight:700}h1{font-size:clamp(28px,4vw,42px);line-height:1.2;letter-spacing:-.04em;margin:16px 0}h2{font-size:14px;margin:0 0 12px;color:#335c8d}p{color:#57718e;margin:8px 0}.subtitle{font-size:17px}.badge,.count{background:#dcecff;color:#1552a0;border-radius:99px;padding:6px 12px;font-size:12px;font-weight:700}.badge{display:inline-block}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.summary article,.card{background:white;border:1px solid #d2e2f5;border-radius:18px;padding:24px;box-shadow:0 8px 24px #143f7506}.summary strong{font-size:23px;line-height:1.3;display:block}.summary p{font-size:13px}.card{margin-top:20px}.card h2{font-size:18px}.count{margin-left:8px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;padding:12px 8px;border-bottom:1px solid #e4edf8;overflow-wrap:anywhere}th{color:#57718e;font-size:12px}.empty{padding:24px;background:#f3f8ff;border-radius:10px}code{display:block;overflow-wrap:anywhere;background:#eff6ff;color:#174e92;padding:16px;border-radius:10px;font-size:13px}.ci{display:flex;align-items:center;justify-content:space-between;gap:20px;background:#dfecfc;border:1px solid #c2d8f4;border-radius:18px;padding:24px;margin-top:20px}.ci h2{margin-bottom:4px}.ci strong{color:#164d94}footer{display:flex;flex-wrap:wrap;gap:8px 24px;padding:24px 0;font-size:12px;color:#57718e}@media(max-width:700px){.console{margin:12px auto;padding:0 16px}.summary{grid-template-columns:1fr}.ci{display:block}.card{padding:20px}table{font-size:13px}}
`;

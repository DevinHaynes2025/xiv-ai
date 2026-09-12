import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { getEnterpriseRole } from './enterprise-workforce';

export interface OfflineStory {
  id: string; tenantId: string; roleId: string; objective: string;
  acceptance: readonly string[]; dependencies: readonly string[];
  sourceRevision: string; masterPlanSha256: string;
  securityClass: 'ORDINARY'; kind: 'PRODUCT_STORY' | 'CAPACITY_FIXTURE';
}
export interface StoryLease {
  token: string; storyId: string; tenantId: string; roleId: string;
  deadlineMs: number; ownerId: string;
}
export type QueueState = 'READY' | 'LEASED' | 'AWAITING_REVIEW' | 'DONE' | 'FAILED';
export const OFFLINE_QUEUE_POLICY = Object.freeze({ maxRows: 2_000_000, maxBatch: 1000,
  maxPage: 100, maxLeaseMs: 300_000, maxOutstandingLeases: 1,
  networkCalls: false, launchesProcesses: false, plaintextOrdinaryBacklogOnly: true,
  isHostWideLock: false, automaticallyStealsExpiredLeases: false });
const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const hash = (v: string): string => createHash('sha256').update(v).digest('hex');
const sha = (v: unknown, length: number) => typeof v === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(v);
const bounded = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
function validate(story: OfflineStory): string {
  if (!story || ![story.id,story.tenantId,story.roleId].every(id)
    || story.securityClass !== 'ORDINARY' || !['PRODUCT_STORY','CAPACITY_FIXTURE'].includes(story.kind)
    || !bounded(story.objective,3000) || !sha(story.sourceRevision,40) || !sha(story.masterPlanSha256,64)
    || !Array.isArray(story.acceptance) || story.acceptance.length < 1 || story.acceptance.length > 8
    || !story.acceptance.every(a=>bounded(a,500)) || !Array.isArray(story.dependencies)
    || story.dependencies.length > 8 || !story.dependencies.every(id)
    || new Set(story.dependencies).size !== story.dependencies.length || story.dependencies.includes(story.id)) throw new Error('invalid ordinary story');
  getEnterpriseRole(story.roleId);
  return JSON.stringify({ id: story.id, tenantId: story.tenantId, roleId: story.roleId,
    objective: story.objective.trim(), acceptance: [...story.acceptance], dependencies: [...story.dependencies],
    sourceRevision: story.sourceRevision, masterPlanSha256: story.masterPlanSha256,
    securityClass: story.securityClass, kind: story.kind });
}

/**
 * Draft-backlog storage only; no worker is launched and a lease is NOT tool authorization.
 * Must run behind a trusted operator/service boundary. File access is not tenant authentication.
 * Stores only approved ordinary task text; no encryption-at-rest claim. Node 22 sqlite is experimental.
 * One lease per DB file, including after process restart; this does NOT coordinate other DBs/Homebase.
 */
export class OfflineStoryQueue {
  readonly #db: DatabaseSync;
  readonly #clock: () => number;
  #lastNow = -Infinity;
  constructor(path: string, clock: () => number = Date.now) {
    if (typeof path !== 'string' || !path.trim() || path.length > 4096) throw new Error('local database path required');
    this.#clock = clock;
    this.#db = new DatabaseSync(path, { allowExtension: false });
    try {
      this.#db.exec(`PRAGMA foreign_keys=ON; PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=1000;
        PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
        CREATE TABLE IF NOT EXISTS queue_meta(key TEXT PRIMARY KEY,value INTEGER NOT NULL) STRICT;
        INSERT OR IGNORE INTO queue_meta VALUES('rows',0);
        CREATE TABLE IF NOT EXISTS stories(
          ordinal INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL, id TEXT NOT NULL,
          role TEXT NOT NULL, kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'READY',
          fingerprint TEXT NOT NULL, body TEXT NOT NULL, dependencies TEXT NOT NULL,
          output_hash TEXT, review_ref TEXT, UNIQUE(tenant,id), UNIQUE(tenant,fingerprint),
          CHECK(state IN ('READY','LEASED','AWAITING_REVIEW','DONE','FAILED')),
          CHECK(kind IN ('PRODUCT_STORY','CAPACITY_FIXTURE'))
        ) STRICT;
        CREATE INDEX IF NOT EXISTS story_page ON stories(tenant,ordinal);
        CREATE INDEX IF NOT EXISTS story_ready ON stories(tenant,role,state,ordinal);
        CREATE TABLE IF NOT EXISTS lease(
          singleton INTEGER PRIMARY KEY CHECK(singleton=1), token TEXT NOT NULL,
          tenant TEXT NOT NULL, story_id TEXT NOT NULL, role TEXT NOT NULL,
          owner TEXT NOT NULL, deadline_ms INTEGER NOT NULL,
          FOREIGN KEY(tenant,story_id) REFERENCES stories(tenant,id)
        ) STRICT;`);
    } catch (error) { this.#db.close(); throw error; }
  }
  #now(): number {
    const n = this.#clock();
    if (!Number.isSafeInteger(n) || n < 0 || n < this.#lastNow) throw new Error('invalid or backward clock');
    this.#lastNow=n; return n;
  }
  #transaction<T>(fn:()=>T): T {
    this.#db.exec('BEGIN IMMEDIATE');
    try { const r=fn(); this.#db.exec('COMMIT'); return r; }
    catch(error) { this.#db.exec('ROLLBACK'); throw error; }
  }
  enqueue(stories: readonly OfflineStory[]): { inserted:number; duplicates:number } {
    if (!Array.isArray(stories) || stories.length<1 || stories.length>OFFLINE_QUEUE_POLICY.maxBatch) throw new Error('bounded batch required');
    const rows=stories.map(s=>{
      const body=validate(s);
      // Stable semantic key excludes only the arbitrary story ID; tenant remains included.
      const semantic=JSON.parse(body); delete semantic.id;
      return { story:s, body, fingerprint:hash(JSON.stringify(semantic)) };
    });
    return this.#transaction(()=>{
      const count=Number(this.#db.prepare("SELECT value FROM queue_meta WHERE key='rows'").get()!.value);
      const existing=this.#db.prepare('SELECT fingerprint FROM stories WHERE tenant=? AND id=?');
      const insert=this.#db.prepare('INSERT OR IGNORE INTO stories(tenant,id,role,kind,fingerprint,body,dependencies) VALUES(?,?,?,?,?,?,?)');
      let inserted=0;
      for(const r of rows){
        const s=r.story, prior=existing.get(s.tenantId,s.id);
        if(prior && prior.fingerprint!==r.fingerprint) throw new Error('story ID content conflict');
        inserted+=Number(insert.run(s.tenantId,s.id,s.roleId,s.kind,r.fingerprint,r.body,JSON.stringify(s.dependencies)).changes);
      }
      if(count+inserted>OFFLINE_QUEUE_POLICY.maxRows) throw new Error('queue capacity reached');
      this.#db.prepare("UPDATE queue_meta SET value=value+? WHERE key='rows'").run(inserted);
      return {inserted,duplicates:rows.length-inserted};
    });
  }
  page(tenantId:string, afterOrdinal=0, limit=50) {
    if(!id(tenantId)||!Number.isSafeInteger(afterOrdinal)||afterOrdinal<0||!Number.isInteger(limit)||limit<1||limit>100) throw new Error('invalid page');
    return this.#db.prepare('SELECT ordinal,id,role,kind,state,body,output_hash FROM stories WHERE tenant=? AND ordinal>? ORDER BY ordinal LIMIT ?').all(tenantId,afterOrdinal,limit);
  }
  claimNext(tenantId:string,roleId:string,ownerId:string,durationMs=120_000): StoryLease|null {
    if(![tenantId,roleId,ownerId].every(id)||!Number.isSafeInteger(durationMs)||durationMs<1||durationMs>OFFLINE_QUEUE_POLICY.maxLeaseMs) throw new Error('invalid lease request');
    getEnterpriseRole(roleId); const now=this.#now();
    return this.#transaction(()=>{
      if(this.#db.prepare('SELECT token FROM lease WHERE singleton=1').get()) return null;
      const row=this.#db.prepare(`SELECT id FROM stories s WHERE tenant=? AND role=? AND state='READY' AND kind='PRODUCT_STORY'
        AND NOT EXISTS(SELECT 1 FROM json_each(s.dependencies) dep WHERE NOT EXISTS(
          SELECT 1 FROM stories d WHERE d.tenant=s.tenant AND d.id=dep.value AND d.state='DONE'))
        ORDER BY ordinal LIMIT 1`).get(tenantId,roleId);
      if(!row) return null;
      const lease:StoryLease=Object.freeze({token:randomUUID(),storyId:String(row.id),tenantId,roleId,ownerId,deadlineMs:now+durationMs});
      this.#db.prepare("UPDATE stories SET state='LEASED' WHERE tenant=? AND id=? AND state='READY'").run(tenantId,lease.storyId);
      this.#db.prepare('INSERT INTO lease VALUES(1,?,?,?,?,?,?)').run(lease.token,tenantId,lease.storyId,roleId,ownerId,lease.deadlineMs);
      return lease;
    });
  }
  /** Controller-only lookup. A matching queue token is not permission to invoke a model. */
  inspectLease(lease: StoryLease, requireUnexpired = false): Readonly<OfflineStory> {
    if (!lease || ![lease.token, lease.tenantId, lease.storyId, lease.ownerId, lease.roleId].every(id)
      || !Number.isSafeInteger(lease.deadlineMs)) throw new Error('invalid lease identity');
    const held = this.#db.prepare('SELECT * FROM lease WHERE singleton=1').get();
    if (!held || held.token !== lease.token || held.tenant !== lease.tenantId || held.story_id !== lease.storyId
      || held.owner !== lease.ownerId || held.role !== lease.roleId || Number(held.deadline_ms) !== lease.deadlineMs) throw new Error('lease ownership mismatch');
    if (requireUnexpired && this.#now() >= lease.deadlineMs) throw new Error('queue lease expired');
    const row = this.#db.prepare("SELECT body FROM stories WHERE tenant=? AND id=? AND state='LEASED'").get(lease.tenantId, lease.storyId);
    if (!row || typeof row.body !== 'string') throw new Error('leased story unavailable');
    const story: OfflineStory = JSON.parse(row.body);
    validate(story);
    return Object.freeze({ ...story, acceptance: Object.freeze([...story.acceptance]), dependencies: Object.freeze([...story.dependencies]) });
  }
  /** Trusted admission controller ONLY, while no provider has been invoked for this lease. */
  returnUnstarted(lease: StoryLease): void {
    this.#transaction(() => {
      this.inspectLease(lease);
      this.#db.prepare("UPDATE stories SET state='READY' WHERE tenant=? AND id=? AND state='LEASED'").run(lease.tenantId, lease.storyId);
      this.#db.prepare('DELETE FROM lease WHERE singleton=1 AND token=?').run(lease.token);
    });
  }
  /** Operator/controller-only read of the singleton lease. Read-only; grants nothing. */
  inspectHeldLease(): Readonly<StoryLease & { expired: boolean }> | null {
    const held = this.#db.prepare('SELECT * FROM lease WHERE singleton=1').get();
    if (!held) return null;
    const lease: StoryLease = Object.freeze({ token: String(held.token), storyId: String(held.story_id),
      tenantId: String(held.tenant), roleId: String(held.role), ownerId: String(held.owner),
      deadlineMs: Number(held.deadline_ms) });
    return Object.freeze({ ...lease, expired: this.#now() >= lease.deadlineMs });
  }
  /**
   * OPERATOR recovery (12D-100): clears a stale lease WITHOUT claiming any provider settlement.
   * 'READY' re-queues the story — the operator explicitly attests no provider side-effect is
   * outstanding; 'FAILED' retires it. The evidence ref is echoed to the caller, never stored
   * as a review or settlement record.
   */
  voidLease(input: { token: string; tenantId: string; storyId: string; roleId: string; ownerId: string; deadlineMs: number },
    outcome: 'READY' | 'FAILED', evidenceRef: string): void {
    if (!input || ![input.token, input.tenantId, input.storyId, input.ownerId, input.roleId].every(id)
      || !Number.isSafeInteger(input.deadlineMs) || !['READY', 'FAILED'].includes(outcome)
      || typeof evidenceRef !== 'string' || !evidenceRef.trim() || evidenceRef.length > 256) throw new Error('operator void request invalid');
    this.#transaction(() => {
      const held = this.#db.prepare('SELECT * FROM lease WHERE singleton=1').get();
      if (!held || held.token !== input.token || held.tenant !== input.tenantId || held.story_id !== input.storyId
        || held.owner !== input.ownerId || held.role !== input.roleId || Number(held.deadline_ms) !== input.deadlineMs) throw new Error('lease ownership mismatch');
      this.#db.prepare("UPDATE stories SET state=?,output_hash=NULL WHERE tenant=? AND id=? AND state='LEASED'").run(outcome, input.tenantId, input.storyId);
      this.#db.prepare('DELETE FROM lease WHERE singleton=1 AND token=?').run(input.token);
      this.#now();
    });
  }
  /** Called by the trusted controller only AFTER its provider call has actually settled. */
  settle(lease:StoryLease,result:{outcome:'DRAFT'|'FAILED';outputHash?:string;providerSettled:true}):void {
    if(!lease||![lease.token,lease.tenantId,lease.storyId,lease.ownerId,lease.roleId].every(id)
      || !result || result.providerSettled!==true || !['DRAFT','FAILED'].includes(result.outcome)
      || (result.outcome==='DRAFT'&&!sha(result.outputHash,64))) throw new Error('invalid settlement');
    const now=this.#now();
    this.#transaction(()=>{
      const held=this.#db.prepare('SELECT * FROM lease WHERE singleton=1').get();
      if(!held||held.token!==lease.token||held.tenant!==lease.tenantId||held.story_id!==lease.storyId
        ||held.owner!==lease.ownerId||held.role!==lease.roleId||Number(held.deadline_ms)!==lease.deadlineMs) throw new Error('lease ownership mismatch');
      // Reject late output; do not auto-steal an expired lease before the owning call settles.
      const state=result.outcome==='DRAFT'&&now<lease.deadlineMs?'AWAITING_REVIEW':'FAILED';
      this.#db.prepare('UPDATE stories SET state=?,output_hash=? WHERE tenant=? AND id=?').run(state,state==='AWAITING_REVIEW'?result.outputHash!:null,lease.tenantId,lease.storyId);
      this.#db.exec('DELETE FROM lease WHERE singleton=1');
    });
  }
  /** Operator review metadata, NOT an authenticated review endpoint or independent model attestation. */
  acceptReview(tenantId:string,storyId:string,reviewerRoleId:string,reviewRef:string):void {
    if(![tenantId,storyId,reviewerRoleId,reviewRef].every(id)) throw new Error('review identity required');
    getEnterpriseRole(reviewerRoleId);
    const row=this.#db.prepare('SELECT role,state FROM stories WHERE tenant=? AND id=?').get(tenantId,storyId);
    if(!row||row.state!=='AWAITING_REVIEW'||!getEnterpriseRole(String(row.role)).reviewerIds.includes(reviewerRoleId)) throw new Error('designated independent reviewer required');
    this.#db.prepare("UPDATE stories SET state='DONE',review_ref=? WHERE tenant=? AND id=? AND state='AWAITING_REVIEW'").run(reviewRef,tenantId,storyId);
  }
  /** Read-only single-story lookup for authenticated review ingestion (12D-101). Grants nothing. */
  inspectStory(tenantId:string,storyId:string): { state:QueueState; role:string; outputHash:string|null } | null {
    if(!id(tenantId)||!id(storyId)) throw new Error('story identity required');
    const row=this.#db.prepare('SELECT state,role,output_hash FROM stories WHERE tenant=? AND id=?').get(tenantId,storyId);
    if(!row) return null;
    return { state:String(row.state) as QueueState, role:String(row.role), outputHash:row.output_hash===null?null:String(row.output_hash) };
  }
  /**
   * 12D-101: apply a reviewer's decision atomically, ONLY for a story in AWAITING_REVIEW whose
   * stored output hash still matches the hash the reviewer signed. APPROVED→DONE,
   * CHANGES_REQUESTED→READY (output hash kept as the audit record of what was re-requested; the
   * next settlement overwrites it), REJECTED→FAILED. The signature verification lives in the
   * ingestion adapter; this method only enforces state and designated-reviewer invariants.
   */
  applyReviewDecision(input:{tenantId:string;storyId:string;reviewerId:string;expectedOutputHash:string;decision:'APPROVED'|'CHANGES_REQUESTED'|'REJECTED';reviewRef:string}):'DONE'|'READY'|'FAILED' {
    if(![input?.tenantId,input?.storyId,input?.reviewerId].every(id)||!sha(input.expectedOutputHash,64)
      || !['APPROVED','CHANGES_REQUESTED','REJECTED'].includes(input.decision)
      || !bounded(input.reviewRef,256)) throw new Error('invalid review decision');
    this.#now();
    this.#transaction(()=>{
      const row=this.#db.prepare('SELECT role,state,output_hash FROM stories WHERE tenant=? AND id=?').get(input.tenantId,input.storyId);
      if(!row||String(row.state)!=='AWAITING_REVIEW') throw new Error('story not awaiting review');
      if(String(row.output_hash??'')!==input.expectedOutputHash) throw new Error('reviewed output hash mismatch');
      if(!getEnterpriseRole(String(row.role)).reviewerIds.includes(input.reviewerId)) throw new Error('designated independent reviewer required');
      const to=input.decision==='APPROVED'?'DONE':input.decision==='CHANGES_REQUESTED'?'READY':'FAILED';
      this.#db.prepare('UPDATE stories SET state=?,review_ref=? WHERE tenant=? AND id=? AND state=? AND (output_hash IS ? )').run(to,input.reviewRef,input.tenantId,input.storyId,'AWAITING_REVIEW',input.expectedOutputHash);
    });
    return input.decision==='APPROVED'?'DONE':input.decision==='CHANGES_REQUESTED'?'READY':'FAILED';
  }
  summary(tenantId:string) {
    if(!id(tenantId)) throw new Error('tenant required');
    const counts=this.#db.prepare('SELECT kind,state,count(*) AS count FROM stories WHERE tenant=? GROUP BY kind,state').all(tenantId);
    const held=this.#db.prepare('SELECT tenant,deadline_ms FROM lease WHERE singleton=1').get();
    return {counts,leaseHeld:!!held,leaseExpired:held?this.#now()>=Number(held.deadline_ms):false,
      liveAgentCount:null,capacityRowsAreUserStories:false,hostWideCoordinationVerified:false};
  }
  close():void {this.#db.close();}
}

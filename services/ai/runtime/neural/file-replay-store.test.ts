import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFileAlignmentReplayStore } from './file-replay-store';
function test(name:string,run:()=>void){run();console.log(`ok - ${name}`)}
function temporary(run:(root:string)=>void){const root=mkdtempSync(join(tmpdir(),'xiv-replay-'));try{run(root)}finally{rmSync(root,{recursive:true,force:true})}}
test('reservation is atomic and single use',()=>temporary(root=>{const s=createFileAlignmentReplayStore(root,'tenant-a');assert.equal(s.reserve('receipt-1'),true);assert.equal(s.reserve('receipt-1'),false)}));
test('reservation survives adapter restart',()=>temporary(root=>{assert.equal(createFileAlignmentReplayStore(root,'tenant-a').reserve('receipt-1'),true);assert.equal(createFileAlignmentReplayStore(root,'tenant-a').reserve('receipt-1'),false)}));
test('tenant namespaces do not collide',()=>temporary(root=>{assert.equal(createFileAlignmentReplayStore(root,'tenant-a').reserve('same'),true);assert.equal(createFileAlignmentReplayStore(root,'tenant-b').reserve('same'),true)}));
test('unsafe namespaces and relative roots are rejected',()=>{assert.throws(()=>createFileAlignmentReplayStore('relative','tenant-a'));assert.throws(()=>createFileAlignmentReplayStore('/tmp','../escape'))});
test('I/O failure throws sanitized error',()=>temporary(root=>{const blocker=join(root,'blocked');writeFileSync(blocker,'file');const s=createFileAlignmentReplayStore(blocker,'tenant-a');assert.throws(()=>s.reserve('receipt'),/replay reservation unavailable/)}));
console.log('Disposable durable replay adapter: OK');

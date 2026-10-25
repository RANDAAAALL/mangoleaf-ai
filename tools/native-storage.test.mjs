import { expect, test } from "bun:test";

// Fresh workers isolate the native list/cache; all photos and bridge replies are local fixtures.
function run(source) {
  const result = Bun.spawnSync([process.execPath, "--eval", fixture + source], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}

const fixture = String.raw`
import assert from 'node:assert/strict'; import {mock} from 'bun:test';
globalThis.window={location:{origin:'https://appassets.androidplatform.net'}};
let rows=[],reads=0,fetches=0,missing=true,listError=false;
const row=id=>({id,disease_name:'fixture',confidence:0.5,updated_at:'2026-10-23T00:00:00Z',photoUri:'https://appassets.androidplatform.net/_native/photos/'+id});
mock.module('./src/lib/native-bridge.ts',()=>({nativeRequest:async method=>{assert.equal(method,'storage.report.list');reads++;if(listError)throw Error('SQLite unavailable');return rows;}}));
globalThis.fetch=async url=>{fetches++;assert.ok(String(url).startsWith('https://appassets.androidplatform.net/_native/photos/'));return String(url).endsWith('/missing')&&missing ? new Response(null,{status:404}) : new Response('local photo',{headers:{'Content-Type':'image/jpeg'}})};
const {readNativeScans}=await import('./src/lib/native-storage.ts');
`;

test("one unreadable private photo preserves all History metadata and retries later", () => {
  run(`rows=[row('good'),row('missing'),{...row('hidden'),_status:'pending-delete'}];
    const first=await readNativeScans();assert.deepEqual(first.map(r=>r.id),['good','missing']);
    assert.equal(first[0].image_blob.size,11);assert.equal(first[1].image_blob.size,0);assert.equal(fetches,2);
    missing=false;const next=await readNativeScans();assert.equal(next[1].image_blob.size,11);assert.equal(fetches,3);
    listError=true;await assert.rejects(readNativeScans(),/SQLite unavailable/);`);
});

test("overlapping History reads share work and immutable photos survive metadata refreshes", () => {
  run(`rows=[row('one'),row('two')];const [a,b]=await Promise.all([readNativeScans(),readNativeScans()]);
    assert.equal(reads,1);assert.equal(fetches,2);assert.equal(a[0].image_blob,b[0].image_blob);
    rows=[{...row('one'),confidence:0.7},row('two')];const next=await readNativeScans();
    assert.equal(next[0].confidence,0.7);assert.equal(next[0].image_blob,a[0].image_blob);assert.equal(fetches,2);
    rows=[row('two')];await readNativeScans();rows=[row('one'),row('two')];await readNativeScans();assert.equal(fetches,3);`);
});

test("photo reuse is bounded and never follows a historical cloud URL", () => {
  run(`rows=Array.from({length:65},(_,i)=>row('photo'+i));await readNativeScans();assert.equal(fetches,65);
    await readNativeScans();assert.equal(fetches,66);
    rows=[{...row('invalid'),photoUri:'https://private-cloud.invalid/photo',image_url:'https://legacy.invalid/photo'}];
    const result=await readNativeScans();assert.equal(result.length,1);assert.equal(result[0].image_blob.size,0);assert.equal(fetches,66);`);
});

test("large photos obey the byte bound even before the entry bound is reached", () => {
  run(`globalThis.fetch=async()=>{fetches++;return new Response(new Uint8Array(6*1024*1024),{headers:{'Content-Type':'image/jpeg'}})};
    rows=[row('a'),row('b'),row('c')];await readNativeScans();assert.equal(fetches,3);
    await readNativeScans();assert.equal(fetches,4);`);
});

test("a reader joining after deletion cannot inherit the older in-flight History", () => {
  run(`let release;const held=new Promise(resolve=>{release=resolve});
    globalThis.fetch=async()=>{fetches++;await held;return new Response('local photo')};
    rows=[row('deleted')];const before=readNativeScans();await Promise.resolve();
    rows=[];const {notifyStorageChange}=await import('./src/lib/native-storage.ts');notifyStorageChange();
    const after=readNativeScans();release();assert.deepEqual(await before,[]);assert.deepEqual(await after,[]);
    assert.equal(reads,2);`);
});

const importFixture = String.raw`
import assert from 'node:assert/strict';import {mock} from 'bun:test';
globalThis.fetch=()=>{throw Error('Import counts must not hydrate a photo or use the network')};
const stored=new Map(),tombstones=new Set(),reads=[];let ack={},commits=0,commitThenError=false,wrongConfirmation=false;
const record=id=>({id,disease_name:'fixture',confidence:0.5,updated_at:'2026-10-25T00:00:00.000Z',_status:'local-only',
  image_blob:new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'})});
mock.module('./src/lib/native-bridge.ts',()=>({nativeRequest:async(method,p)=>{
  if(method==='storage.report.get'){reads.push(p.id);const found=stored.get(p.id)??null;return wrongConfirmation&&found?{...found,id:'another-report'}:found;}
  assert.equal(method,'storage.import');assert.equal(p.records.length,1);
  const {record:next,image}=p.records[0];assert.equal(image.mimeType,'image/jpeg');assert.equal(image.base64,'/9j/AA==');
  const existing=stored.get(next.id);
  if(existing&&existing.disease_name!==next.disease_name)throw Error('CONFLICT');
  if(!existing&&!tombstones.has(next.id)){stored.set(next.id,{...next,photoUri:'https://appassets.androidplatform.net/_native/photos/fixture'});commits++;}
  if(commitThenError)throw Error('Bridge caller timed out after native commit');
  return ack;
}}));
const {importNativeRecords,subscribeStorageChange}=await import('./src/lib/native-storage.ts');
let notifications=0;subscribeStorageChange(()=>{notifications++});
`;

test("native import counts exact visible inserts despite missing or incorrect host acknowledgments", () => {
  run(
    `for(const acknowledgment of [{},{imported:0},{imported:-1},{imported:99},{imported:'1'}]){
      stored.clear();reads.length=0;ack=acknowledgment;const next=record('bounded-report');
      assert.equal(await importNativeRecords([next]),1);assert.deepEqual(reads,['bounded-report','bounded-report']);
      assert.equal(stored.get(next.id).disease_name,'fixture');assert.ok(stored.get(next.id).photoUri);
      assert.equal(await importNativeRecords([next]),0);
    }assert.equal(commits,5);assert.equal(notifications,10);`,
    importFixture,
  );
});

test("native count verification preserves duplicates, tombstones and hidden pending deletes", () => {
  run(
    `const existing=record('existing'),hidden={...record('hidden'),_status:'pending-delete'},deleted=record('deleted');
    stored.set(existing.id,existing);stored.set(hidden.id,hidden);tombstones.add(deleted.id);ack={imported:1};
    assert.equal(await importNativeRecords([existing,hidden,deleted,record('fresh'),record('fresh')]),1);
    assert.equal(commits,1);assert.equal(stored.has(deleted.id),false);assert.equal(stored.get(hidden.id),hidden);
    assert.equal(stored.size,3);assert.ok(reads.every(id=>['existing','hidden','deleted','fresh'].includes(id)));`,
    importFixture,
  );
});

test("a rejected or timed-out native import never reports success from a later row observation", () => {
  run(
    `const next=record('late-commit');commitThenError=true;
    await assert.rejects(importNativeRecords([next]),/timed out/);
    assert.equal(stored.has(next.id),true);assert.deepEqual(reads,[next.id]);assert.equal(notifications,1);
    commitThenError=false;assert.equal(await importNativeRecords([next]),0);assert.equal(notifications,2);
    const conflicting={...next,disease_name:'changed'};
    await assert.rejects(importNativeRecords([conflicting]),/CONFLICT/);
    assert.equal(stored.get(next.id).disease_name,'fixture');`,
    importFixture,
  );
});

test("native import confirmation rejects another report ID instead of manufacturing a count", () => {
  run(
    `wrongConfirmation=true;await assert.rejects(importNativeRecords([record('expected')]),/another report/);
    assert.equal(commits,1);assert.equal(notifications,1);
    await assert.rejects(importNativeRecords([record('expected')]),/another report/);assert.equal(commits,1);`,
    importFixture,
  );
});

import { expect, test } from "bun:test";

// Fresh workers isolate shared History reads; photos/bridge replies are local fixtures.
function run(source, setup = fixture) {
  const result = Bun.spawnSync([process.execPath, "--eval", setup + source], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}

const fixture = String.raw`
import assert from 'node:assert/strict'; import {mock} from 'bun:test';
globalThis.window={location:{origin:'https://appassets.androidplatform.net'}};
let rows=[],reads=0,fetches=0,missing=true,listError=false,heldRead;
const row=id=>({id,disease_name:'fixture',confidence:0.5,updated_at:'2026-10-23T00:00:00Z',photoUri:'https://appassets.androidplatform.net/_native/photos/'+id});
mock.module('./src/lib/native-bridge.ts',()=>({nativeRequest:async method=>{assert.equal(method,'storage.report.list');reads++;if(listError)throw Error('SQLite unavailable');const snapshot=rows;if(heldRead)await heldRead;return snapshot;}}));
globalThis.fetch=async url=>{fetches++;assert.ok(String(url).startsWith('https://appassets.androidplatform.net/_native/photos/'));return String(url).endsWith('/missing')&&missing ? new Response(null,{status:404}) : new Response('local photo',{headers:{'Content-Type':'image/jpeg'}})};
const {readNativeScans}=await import('./src/lib/native-storage.ts');
`;

test("History lists readable/missing-photo metadata without opening any photo", () => {
  run(`rows=[row('good'),row('missing'),{...row('hidden'),_status:'pending-delete'}];
    const first=await readNativeScans();assert.deepEqual(first.map(r=>r.id),['good','missing']);
    assert.ok(first.every(r=>!('image_blob' in r)));assert.equal(fetches,0);
    assert.equal(first[1].photoUri,row('missing').photoUri);
    listError=true;await assert.rejects(readNativeScans(),/SQLite unavailable/);`);
});

test("overlapping History reads share metadata and later refreshes keep private file references", () => {
  run(`rows=[row('one'),row('two')];const [a,b]=await Promise.all([readNativeScans(),readNativeScans()]);
    assert.equal(reads,1);assert.equal(fetches,0);assert.equal(a,b);
    rows=[{...row('one'),confidence:0.7},row('two')];const next=await readNativeScans();
    assert.equal(next[0].confidence,0.7);assert.equal(next[0].photoUri,a[0].photoUri);assert.equal(fetches,0);`);
});

test("a large History retains no photo Blobs and refuses non-private photo references", () => {
  run(`rows=Array.from({length:500},(_,i)=>row('photo'+i));const all=await readNativeScans();
    assert.equal(all.length,500);assert.ok(all.every(r=>!('image_blob' in r)));assert.equal(fetches,0);
    rows=[{...row('invalid'),photoUri:'https://private-cloud.invalid/photo',image_url:'https://legacy.invalid/photo'}];
    const result=await readNativeScans();assert.equal(result.length,1);assert.equal(result[0].photoUri,null);assert.equal(fetches,0);`);
});

test("strict photo consumers still hydrate one private Blob and reject unreadable files", () => {
  run(`const {hydrateNativeRecord}=await import('./src/lib/native-storage.ts');
    const good=await hydrateNativeRecord(row('good'));assert.equal(good.image_blob.size,11);assert.equal(fetches,1);
    await assert.rejects(hydrateNativeRecord(row('missing')),/could not be read/);
    await assert.rejects(hydrateNativeRecord({...row('bad'),photoUri:'https://cloud.invalid/photo'}),/invalid/);
    assert.equal(fetches,2);`);
});

test("a reader joining after deletion cannot inherit the older in-flight History", () => {
  run(`let release;const held=new Promise(resolve=>{release=resolve});
    heldRead=held;rows=[row('deleted')];const before=readNativeScans();await Promise.resolve();
    rows=[];const {notifyStorageChange}=await import('./src/lib/native-storage.ts');notifyStorageChange();
    const after=readNativeScans();release();assert.deepEqual(await before,[]);assert.deepEqual(await after,[]);
    assert.equal(reads,2);`);
});

test("scoped invalidations isolate guideline/report work and retain default subscribers", () => {
  run(`const {subscribeStorageChange,notifyStorageChange}=await import('./src/lib/native-storage.ts');
    let reports=0,guidelines=0,all=0;
    const stop=subscribeStorageChange(()=>reports++,'reports');
    subscribeStorageChange(()=>guidelines++,'guidelines');subscribeStorageChange(()=>all++);
    for(let n=0;n<100;n++)notifyStorageChange('guidelines');
    assert.deepEqual([reports,guidelines,all],[0,100,100]);
    notifyStorageChange('reports');assert.deepEqual([reports,guidelines,all],[1,100,101]);
    notifyStorageChange();assert.deepEqual([reports,guidelines,all],[2,101,102]);
    stop();notifyStorageChange('reports');assert.equal(reports,2);`);
});

test("private photo references reject credentials, foreign origins, query strings and traversal", () => {
  run(`const {nativePhotoUrl}=await import('./src/lib/scan-photo.ts');
    assert.equal(nativePhotoUrl('/_native/photos/valid-1.jpg'),row('valid-1.jpg').photoUri);
    for(const url of ['https://cloud.invalid/photo','https://appassets.androidplatform.net.evil.invalid/_native/photos/a',
      'https://user:pass@appassets.androidplatform.net/_native/photos/a','/_native/photos/a?token=x',
      '/_native/photos/a#fragment','/_native/photos/../not-a-photo','/_native/photos/%2fescape','file:///a',
      'https://appassets.androidplatform.net:123/_native/photos/a'])assert.equal(nativePhotoUrl(url),null,url);
    assert.equal(fetches,0);`);
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

import { expect, test } from "bun:test";
import { validateCloudTarget } from "../src/lib/cloud-target.ts";

test("testing and production targets reject each other's project, paths and lookalike hosts", () => {
  const testing = "https://ajwlojaclehxupntnsve.supabase.co";
  const production = "https://uuvvvoznajjqknedxpdg.supabase.co";
  expect(validateCloudTarget("testing", testing)).toBe("testing");
  expect(validateCloudTarget("production", production)).toBe("production");
  for (const url of [
    production,
    `${testing}/`,
    `${testing}.evil.invalid`,
    "http://localhost:3000",
  ])
    expect(() => validateCloudTarget("testing", url)).toThrow();
  expect(() => validateCloudTarget("production", testing)).toThrow();
  expect(() => validateCloudTarget(undefined, production)).toThrow();
});

// Each process gets independent module state, sessions and timers; no request can reach a live project.
function run(source, environment = {}) {
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `import assert from 'node:assert/strict'; import {mock} from 'bun:test'; globalThis.document={visibilityState:'visible'};\n${source}`,
    ],
    {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        NODE_ENV: "development",
        NEXT_PUBLIC_APP_TARGET: "browser",
        NEXT_PUBLIC_CLOUD_ENVIRONMENT: "testing",
        NEXT_PUBLIC_SUPABASE_URL: "https://ajwlojaclehxupntnsve.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-only-placeholder",
        ...environment,
      },
    },
  );
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}

test("development worker automatically uploads local Blobs after reconnect, retries and yields during diagnosis", () => {
  run(`
    globalThis.fetch=()=>{throw new Error('unexpected network')};
    const events=new EventTarget(); globalThis.window=events;
    globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
    const settings=new Map(); globalThis.localStorage={getItem:k=>settings.get(k)??null,setItem:(k,v)=>settings.set(k,v),removeItem:k=>settings.delete(k)};
    let online=false; let notify;
    const timers=new Map(); let timerId=0;
    globalThis.setTimeout=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId};
    globalThis.clearTimeout=id=>timers.delete(id);globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
    async function tick(){for(let i=0;i<80;i++)await new Promise(resolve=>setImmediate(resolve))}
    async function fire(){const item=[...timers.entries()][0];assert.ok(item,'worker timer');timers.delete(item[0]);await item[1].fn();await tick();return item[1].delay}
    mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>false,connectionHint:()=>online,subscribeConnection:fn=>{notify=fn;return()=>{}},nativeRequest:()=>{throw new Error('no native bridge')},initializeNativeRuntime:()=>{throw new Error('no native bridge')}}));
    let changed; mock.module('dexie',()=>({liveQuery:()=>({subscribe:observer=>{changed=observer.next;return{unsubscribe(){}}}})}));
    const photo=new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'});
    const record={id:'33333333-3333-4333-8333-333333333333',disease_name:'Healthy Leaf',confidence:0.974321987,updated_at:'2026-10-21T00:00:00.000Z',_status:'local-only',image_url:null,image_blob:photo,model_version:'model-v4.5.0'};
    const rows=new Map([['deleted',{...record,id:'44444444-4444-4444-8444-444444444444',_status:'pending-delete'}]]);
    let reads=0; mock.module('./src/lib/db.ts',()=>({db:{cloudDeletes:{where:()=>({equals:()=>({limit:()=>({toArray:async()=>[]})})})},scans:{toCollection:()=>({primaryKeys:async()=>[...rows.keys()]}),get:async id=>{reads++;return rows.get(id)}}}}));
    let creates=0,clients=0,uploads=0,attempts=0,anonymous=0;let signedIn=false,approved=false,completeFails=true;const manifests=new Map();
    const active={auth:{getSession:async()=>({data:{session:signedIn?{}:null}}),signInAnonymously:async()=>{anonymous++;signedIn=true;return{error:null}},refreshSession:async()=>({error:null}),getUser:async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111',is_anonymous:true,app_metadata:approved?{android_backup_vault:true}:{}}}}),stopAutoRefresh(){}},functions:{invoke:async(_name,options)=>{assert.equal(options.body.action,'enroll');creates++;approved=true;return{data:{ownerId:'11111111-1111-4111-8111-111111111111'}}}},storage:{from:()=>({upload:async(path,blob)=>{assert.equal(blob,photo);uploads++;return{error:null}}})},rpc:async(name,p)=>{
      if(name==='begin_android_backup_report'){attempts++;const row=manifests.get(p.p_manifest.record_id)||p.p_manifest;manifests.set(row.record_id,row);return{data:row}};
      if(completeFails){completeFails=false;return{data:false}};
      manifests.get(p.p_record_id).completed=true;return{data:true};
    }};
    // The duplicate-object retry downloads the same bytes and verifies their hash.
    active.storage.from=()=>({upload:async(path,blob)=>{assert.equal(blob,photo);uploads++;return uploads===1?{error:null}:{error:{}}},download:async()=>({data:photo})});
    mock.module('@supabase/supabase-js',()=>({createClient:()=>{clients++;return active}}));
    const cloud=await import('./src/lib/cloud-backup.ts');const stop=cloud.startCloudBackup();
    await fire();assert.equal(clients,0);assert.equal(creates,0);
    online=true;notify();await fire();assert.equal(creates,0);assert.equal(clients,0);
    online=false;rows.set(record.id,record);changed();await fire();assert.equal(uploads,0);
    online=true;notify();await fire();assert.equal(creates,1);assert.equal(uploads,1);assert.equal(attempts,1);
    assert.equal(anonymous,1);assert.equal(await cloud.savedRecoveryCode().catch(()=>null),null);
    assert.equal([...timers.values()][0].delay,10000);await fire();assert.equal(attempts,2);
    assert.equal(manifests.get(record.id).completed,true);assert.equal(record.confidence,0.974321987);assert.equal(record._status,'local-only');
    const before=uploads;changed();await fire();assert.equal(uploads,before);assert.ok(reads>=3);
    await assert.rejects(cloud.restoreCloudBackup());await assert.rejects(cloud.createBackupVault());await assert.rejects(cloud.savedRecoveryCode());
    cloud.setCloudBackupBusy(true);changed();await fire();assert.equal(uploads,before);
    cloud.setCloudBackupBusy(false);await fire();assert.equal(creates,1);assert.equal(uploads,before);
    assert.ok([...settings.keys()].every(key=>key.endsWith(':ajwlojaclehxupntnsve')));stop();
  `);
});

test("native host mismatch and production browser reject before client construction or network", () => {
  const source = `
    globalThis.fetch=()=>{throw new Error('unexpected network')};let clients=0;
    mock.module('dexie',()=>({liveQuery:()=>{throw new Error('must not observe')}}));
    mock.module('./src/lib/db.ts',()=>({db:{}}));
    mock.module('@supabase/supabase-js',()=>({createClient:()=>{clients++;throw new Error('must not construct')}}));
    mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>process.env.NEXT_PUBLIC_APP_TARGET==='android',initializeNativeRuntime:async()=>({cloudEnvironment:'production'}),nativeRequest:()=>{throw new Error('must not read credentials')},connectionHint:()=>true,subscribeConnection:()=>()=>{}}));
    const cloud=await import('./src/lib/cloud-backup.ts');
    if(process.env.NEXT_PUBLIC_APP_TARGET==='android')await assert.rejects(cloud.createBackupVault(),/do not match/);
    else {await assert.rejects(cloud.createBackupVault(),/Android/);assert.equal(await cloud.backUpScans(),0);}
    assert.equal(clients,0);
  `;
  run(source, { NEXT_PUBLIC_APP_TARGET: "android" });
  run(source, { NODE_ENV: "production" });
  run(source, {
    NEXT_PUBLIC_SUPABASE_URL: "https://uuvvvoznajjqknedxpdg.supabase.co",
  });
});

// These synthetic stores isolate every cloud request. Native transaction/reopen proof lives in NativeStoreTest.
const deletionFixture = `
  globalThis.fetch=()=>{throw new Error('unexpected live network')};
  const project=process.env.NEXT_PUBLIC_SUPABASE_URL.split('/')[2].split('.')[0];
  const vault='11111111-1111-4111-8111-111111111111', owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const code='MLB1.'+vault+'.'+'A'.repeat(43),scope=project+':'+vault;
  const settings=new Map([['backup-recovery-code:'+project,code],['backup-enabled:'+project,'false']]);
  globalThis.localStorage={getItem:k=>settings.get(k)??null,setItem:(k,v)=>settings.set(k,v),removeItem:k=>settings.delete(k)};
  const records=new Map(),jobs=new Map(),server=new Map(),photos=new Set();
  const key=job=>job.scope+'/'+job.record_id;
  const pending=s=>[...jobs.values()].filter(job=>job.scope===s);
  let online=false,removeFailure=false,sqlFailure=false,lostResponse=false,authEmail=vault+'@backup.mangoleaf.invalid';
  let lookups=0,removes=0,sqlDeletes=0,creates=0,uploads=0,onUpload;
  mock.module('dexie',()=>({liveQuery:()=>({subscribe:()=>({unsubscribe(){}})})}));
  const db={scans:{toCollection:()=>({primaryKeys:async()=>[...records.keys()]}),get:async id=>records.get(id),bulkDelete:async ids=>ids.forEach(id=>records.delete(id))},
    cloudDeletes:{bulkPut:async rows=>rows.forEach(job=>jobs.set(key(job),job)),where:()=>({equals:s=>({limit:()=>({toArray:async()=>pending(s)})})}),delete:async([s,id])=>jobs.delete(s+'/'+id)},
    transaction:async(_mode,_scans,_jobs,work)=>work()};
  mock.module('./src/lib/db.ts',()=>({db}));
  mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>process.env.NEXT_PUBLIC_APP_TARGET==='android',connectionHint:()=>online,subscribeConnection:()=>()=>{},
    initializeNativeRuntime:async()=>({cloudEnvironment:process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT,hostVersion:2}),
    nativeRequest:async(method,p={})=>{
      if(method==='storage.settings.get')return settings.get(p.key)??null;
      if(method==='storage.settings.set'){p.value===null?settings.delete(p.key):settings.set(p.key,p.value);return true}
      if(method==='storage.report.deleteSynced'){for(const id of p.ids){records.delete(id);const job={scope:p.scope,record_id:id};jobs.set(key(job),job)}return true}
      if(method==='storage.cloudDelete.list')return pending(p.scope);
      if(method==='storage.cloudDelete.ack')return jobs.delete(key(p));
      if(method==='storage.report.list')return [...records.values()];
      if(method==='storage.report.get')return records.get(p.id)??null;
      throw new Error('unexpected native method '+method);
    }}));
  const active={auth:{getSession:async()=>({data:{session:{}}}),getUser:async()=>({data:{user:{id:owner,email:authEmail,app_metadata:{android_backup_vault:true}}}}),stopAutoRefresh(){}},
    functions:{invoke:async()=>{creates++;throw new Error('deletion must not create an identity')}},
    from:table=>{assert.equal(table,'android_backup_reports');const filters={};const query={select:()=>query,eq:(k,v)=>{filters[k]=v;return query},maybeSingle:async()=>{lookups++;assert.equal(filters.owner_id,owner);return{data:server.get(filters.record_id)??null}}};return query},
    storage:{from:bucket=>{assert.equal(bucket,'scans');return{
      remove:async paths=>{removes++;if(removeFailure)return{error:{statusCode:'503'}};for(const path of paths)photos.delete(path);return{error:null}},
      upload:async path=>{uploads++;photos.add(path);if(onUpload)await onUpload();return{error:null}},
    }}},
    rpc:async(name,p)=>{
      if(name==='begin_android_backup_report'){server.set(p.p_manifest.record_id,p.p_manifest);return{data:p.p_manifest}}
      if(name==='complete_android_backup_report'){server.get(p.p_record_id).completed=true;return{data:true}}
      assert.equal(name,'delete_android_backup_report');sqlDeletes++;
      if(sqlFailure)return{error:{code:'test_failure'}};
      server.delete(p.p_record_id);
      return lostResponse?{error:{code:'test_lost_response'}}:{data:true};
    }};
  mock.module('@supabase/supabase-js',()=>({createClient:()=>active}));
  const {prepareBackupRow}=await import('./src/lib/cloud-backup-format.ts');
  const queue=await import('./src/lib/cloud-history-delete.ts');
  const cloud=await import('./src/lib/cloud-backup.ts');
  async function seed(id){const row={id,disease_name:'Healthy Leaf',confidence:0.974321987,updated_at:'2026-10-21T00:00:00.000Z',_status:'local-only',image_url:null,image_blob:new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'}),model_version:'v4.5.0'};records.set(id,row);const backup=await prepareBackupRow(owner,row);server.set(id,{...backup,completed:true});photos.add(backup.storage_path);return row}
`;

for (const [runtime, environment] of [
  ["development browser", {}],
  ["debug APK", { NEXT_PUBLIC_APP_TARGET: "android" }],
  [
    "production APK",
    {
      NEXT_PUBLIC_APP_TARGET: "android",
      NEXT_PUBLIC_CLOUD_ENVIRONMENT: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://uuvvvoznajjqknedxpdg.supabase.co",
    },
  ],
]) {
  test(`${runtime}: History deletion retries offline, Storage/SQL failures and lost responses without touching another vault`, () => {
    run(
      deletionFixture +
        `
      const id='33333333-3333-4333-8333-333333333333';await seed(id);
      await queue.deleteScansWithCloudQueue([id]);assert.equal(records.size,0);assert.equal(jobs.size,1);
      await cloud.backUpScans();assert.equal(lookups,0);assert.equal(creates,0);
      online=true;removeFailure=true;await assert.rejects(cloud.backUpScans(),/photo deletion/);assert.equal(jobs.size,1);assert.equal(sqlDeletes,0);
      removeFailure=false;sqlFailure=true;await assert.rejects(cloud.backUpScans(),/backup deletion/);assert.equal(jobs.size,1);assert.equal(server.size,1);assert.equal(photos.size,0);
      sqlFailure=false;lostResponse=true;await assert.rejects(cloud.backUpScans());assert.equal(server.size,0);assert.equal(jobs.size,1);
      lostResponse=false;await cloud.backUpScans();assert.equal(jobs.size,0);assert.equal(creates,0);
      await seed(id);await queue.deleteScansWithCloudQueue([id]);
      const before=removes;settings.set('backup-recovery-code:'+project,'MLB1.22222222-2222-4222-8222-222222222222.'+'B'.repeat(43));
      await cloud.backUpScans();assert.equal(removes,before);assert.equal(jobs.size,1);assert.equal(server.size,1);
      settings.set('backup-recovery-code:'+project,code);authEmail='22222222-2222-4222-8222-222222222222@backup.mangoleaf.invalid';
      await assert.rejects(cloud.backUpScans(),/session/);assert.equal(removes,before);assert.equal(jobs.size,1);
      authEmail=vault+'@backup.mangoleaf.invalid';await cloud.backUpScans();assert.equal(jobs.size,0);assert.equal(server.size,0);assert.equal(photos.size,0);
    `,
      environment,
    );
  });
}

test("deletion during a settling upload drains afterward and foreign manifests are refused", () => {
  run(
    deletionFixture +
      `
    online=true;const id='33333333-3333-4333-8333-333333333333';await seed(id);server.clear();photos.clear();
    onUpload=async()=>{await queue.deleteScansWithCloudQueue([id])};
    await cloud.backUpScans();assert.equal(uploads,1);assert.equal(records.size,0);assert.equal(jobs.size,0);assert.equal(server.size,0);assert.equal(photos.size,0);
    onUpload=undefined;await seed(id);await queue.deleteScansWithCloudQueue([id]);
    server.set(id,{...server.get(id),owner_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'});
    const before=removes;await assert.rejects(cloud.backUpScans());assert.equal(removes,before);assert.equal(jobs.size,1);
  `,
  );
});

// Keep each Storage/SQL pair together; foreground loss pauses subsequent jobs even with uploads paused.
test("History deletion finishes its current pair and resumes remaining jobs only in foreground", () => {
  run(
    deletionFixture +
      `
    online=true;settings.set('backup-enabled:'+project,'paused');
    const first='33333333-3333-4333-8333-333333333333',second='44444444-4444-4444-8444-444444444444';
    await seed(first);await seed(second);await queue.deleteScansWithCloudQueue([first,second]);
    const storage=active.storage.from('scans');let hide=true;
    active.storage.from=()=>({...storage,remove:async paths=>{const result=await storage.remove(paths);if(hide)document.visibilityState='hidden';return result}});
    await cloud.backUpScans();assert.equal(removes,1);assert.equal(sqlDeletes,1);assert.equal(jobs.size,1);
    await cloud.backUpScans();assert.equal(removes,1);assert.equal(jobs.size,1);
    hide=false;document.visibilityState='visible';await cloud.backUpScans();
    assert.equal(removes,2);assert.equal(sqlDeletes,2);assert.equal(jobs.size,0);assert.equal(server.size,0);
    assert.equal(uploads,0);assert.equal(creates,0);
  `,
  );
});

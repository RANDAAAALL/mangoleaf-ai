import { expect, test } from "bun:test";

// Each child has isolated sessions/native state; all HTTP is forbidden in these controlled cases.
function run(check, production = false, setup = fixture) {
  const result = Bun.spawnSync([process.execPath, "--eval", setup + check], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_TARGET: "android",
      NEXT_PUBLIC_CLOUD_ENVIRONMENT: production ? "production" : "testing",
      NEXT_PUBLIC_SUPABASE_URL: production
        ? "https://uuvvvoznajjqknedxpdg.supabase.co"
        : "https://ajwlojaclehxupntnsve.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-only-placeholder",
    },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
  return result.stdout.toString();
}

const fixture = String.raw`
import assert from 'node:assert/strict';
import {mock} from 'bun:test';
globalThis.fetch=()=>{throw new Error('No real network is permitted')};
globalThis.document={visibilityState:'visible'};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};
const owner='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
const project=process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT==='testing'?'ajwlojaclehxupntnsve':'uuvvvoznajjqknedxpdg';
const settings=new Map(), records=new Map(), jobs=new Map(), manifests=new Map(),tombstones=new Set(),uploadPaths=[],removals=[];
const photo=new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'});
const report=(id,date='2026-10-21T00:00:00.000Z')=>({id,disease_name:'Healthy Leaf',confidence:0.974321987,updated_at:date,_status:'local-only',image_url:null,image_blob:photo,model_version:'v4.5.0'});
const local=report('33333333-3333-4333-8333-333333333333'); records.set(local.id,local);
let online=true;
let user=null, session=null, candidateUser=null, anonymous=0, creates=0, enrolls=0, sessionChanges=0, uploads=0, clients=0;
let activeStorage,candidateStorage,activeOptions,candidateOptions,failSetting,holdInitialization,beforeSetting;
const sourceReaders=[];let beforeSourceLogin,beforeSourceDownload,sourceVerifiedUser;
mock.module('./src/lib/db.ts',()=>({db:{}}));
mock.module('dexie',()=>({liveQuery:()=>{throw new Error('Native must not observe Dexie')}}));
mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>true,connectionHint:()=>online,subscribeConnection:()=>()=>{},
  initializeNativeRuntime:async()=>{if(holdInitialization){const hold=holdInitialization;holdInitialization=undefined;await hold}return{cloudEnvironment:process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT,hostVersion:2}},
  nativeRequest:async(method,p={})=>{
    if(method==='storage.settings.get')return settings.get(p.key)??null;
    if(method==='storage.settings.set'){
      if(failSetting===p.key){failSetting=null;throw new Error('controlled local persistence failure')}
      await beforeSetting?.(p);
      p.value===null?settings.delete(p.key):settings.set(p.key,p.value);
      if(p.key==='supabase-backup-session:'+project&&p.value){const saved=JSON.parse(p.value);session=saved;user=saved.user;if(user.email)sessionChanges++;}
      return true;
    }
    if(method==='storage.report.list')return [...records.values()];
    if(method==='storage.report.get')return records.get(p.id)??null;
    if(method==='storage.report.delete'){for(const id of p.ids){records.delete(id);tombstones.add(id)}return true;}
    if(method==='storage.cloudDelete.list')return [...jobs.values()].filter(j=>j.scope===p.scope);
    if(method==='storage.cloudDelete.ack')return jobs.delete(p.scope+'/'+p.record_id);
    if(method==='storage.report.deleteSynced'){for(const id of p.ids){records.delete(id);tombstones.add(id);jobs.set(p.scope+'/'+id,{scope:p.scope,record_id:id})}return true;}
    throw new Error('Unexpected native method '+method);
  }}));
mock.module('./src/lib/native-storage.ts',()=>({hydrateNativeRecord:async row=>row,subscribeStorageChange:()=>()=>{},notifyStorageChange(){},
  importNativeRecords:async rows=>{let count=0;for(const row of rows){if(!records.has(row.id)&&!tombstones.has(row.id)){records.set(row.id,row);count++}}return count}}));
const active={auth:{
  getSession:async()=>({data:{session}}),
  getUser:async()=>({data:{user},error:user?null:{code:'missing'}}),
  signInAnonymously:async()=>{anonymous++;user={id:owner,is_anonymous:true,app_metadata:{}};session={access_token:'anonymous',refresh_token:'refresh',user};await activeStorage.setItem('ignored',JSON.stringify(session));return{data:{session,user}}},
  refreshSession:async()=>({data:{session}}),
  setSession:async()=>{throw new Error('must promote the already-verified candidate without another Auth request')},
  stopAutoRefresh(){},dispose:async()=>{},
}, functions:{invoke:async(_name,{body})=>{
  if(body.action==='enroll'){enrolls++;assert.equal(user.is_anonymous,true);user.app_metadata.android_backup_vault=true;return{data:{ownerId:user.id}};}
  creates++;if(!user)user={id:owner,app_metadata:{android_backup_vault:true}};
  user.email=owner+'@backup.mangoleaf.invalid';user.is_anonymous=false;return{data:{recoveryCode:'MLB1.'+owner+'.'+'A'.repeat(43)}};
}}, storage:{from:()=>({upload:async path=>{uploads++;uploadPaths.push(path);return{}},download:async()=>({data:photo}),remove:async paths=>{removals.push(...paths);return{}}})},
  rpc:async(name,p)=>{
    if(name==='begin_android_backup_report'){const key=p.p_manifest.owner_id+'/'+p.p_manifest.record_id;const row=manifests.get(key)||p.p_manifest;manifests.set(key,row);return{data:row}};
    if(name==='complete_android_backup_report'){manifests.get(user.id+'/'+p.p_record_id).completed=true;return{data:true}};
    if(name==='delete_android_backup_report'){manifests.delete(user.id+'/'+p.p_record_id);return{data:true}};
    throw new Error('Unexpected RPC');
  },
  from:()=>{const filters={};const query={select:()=>query,eq:(k,v)=>{filters[k]=v;return query},order:()=>query,
    range:async(start,end)=>({data:[...manifests.values()].filter(row=>row.owner_id===filters.owner_id&&(filters.completed===undefined||row.completed===filters.completed)).slice(start,end+1)}),
    maybeSingle:async()=>({data:manifests.get(filters.owner_id+'/'+filters.record_id)??null})};return query;}
};
const candidate={...active,rpc:async(name,p)=>{
  if(name==='delete_android_backup_report'){manifests.delete(candidateUser.id+'/'+p.p_record_id);return{data:true}}
  return active.rpc(name,p);
},auth:{...active.auth,
  signInWithPassword:async({email,password})=>{
    if(password!=='A'.repeat(43))return{data:{session:null},error:{code:'invalid_credentials'}};
    candidateUser={id:email.startsWith(other)?other:owner,email,is_anonymous:false,app_metadata:{android_backup_vault:true}};
    const staged={access_token:'verified',refresh_token:'verified-refresh',user:candidateUser};
    await candidateStorage.setItem('ignored',JSON.stringify(staged));
    return{data:{session:staged}};
  },getUser:async()=>({data:{user:candidateUser}}),stopAutoRefresh(){},dispose:async()=>{},
}};
mock.module('@supabase/supabase-js',()=>({createClient:(_url,_key,options)=>{
  clients++;
  if(options.auth.storageKey.includes(':source:')){
    assert.equal(options.auth.persistSession,false);assert.equal(options.auth.autoRefreshToken,false);assert.equal(options.auth.storage,undefined);
    let sourceUser=null;const state={options,disposed:false,downloads:0,lists:0};sourceReaders.push(state);
    return{auth:{
      signInWithPassword:async({email,password})=>{
        await beforeSourceLogin?.();
        if(password!=='A'.repeat(43))return{data:{session:null},error:{code:'invalid_credentials'}};
        sourceUser={id:email.startsWith(other)?other:owner,email,is_anonymous:false,app_metadata:{android_backup_vault:true}};
        return{data:{session:{access_token:'source-only',refresh_token:'source-only-refresh',user:sourceUser}}};
      },getUser:async()=>({data:{user:sourceVerifiedUser?sourceVerifiedUser(sourceUser):sourceUser}}),
      dispose:async()=>{state.disposed=true;sourceUser=null;},
    },from:()=>{const query=active.from(),filters={};return{select(){query.select();return this},eq(k,v){filters[k]=v;query.eq(k,v);return this},order(){return this},
      range:async(start,end)=>{assert.equal(state.disposed,false);assert.equal(filters.owner_id,sourceUser.id);assert.equal(filters.completed,true);state.lists++;return query.range(start,end);}}},
    storage:{from:bucket=>{assert.equal(bucket,'scans');return{download:async path=>{assert.equal(state.disposed,false);assert.ok(path.startsWith(sourceUser.id+'/'));state.downloads++;await beforeSourceDownload?.();return{data:photo}},
      upload:async()=>{throw new Error('source must never upload')},remove:async()=>{throw new Error('source must never delete')}}}},
    rpc:async()=>{throw new Error('source must never mutate SQL')},functions:{invoke:async()=>{throw new Error('source must never create or enroll')}},};
  }
  if(options.auth.storageKey.includes(':candidate:')){candidateStorage=options.auth.storage;candidateOptions=options;return candidate;}
  activeStorage=options.auth.storage;activeOptions=options;return active;
}}));
const cloud=await import('./src/lib/cloud-backup.ts');
const {prepareBackupRow}=await import('./src/lib/cloud-backup-format.ts');
// Existing installations keep their authenticated owner and encrypted native settings.
function seedOwner(withCode=true,id=owner){
  user={id,is_anonymous:!withCode,app_metadata:{android_backup_vault:true}};
  if(withCode)user.email=id+'@backup.mangoleaf.invalid';
  session={access_token:'existing',refresh_token:'existing-refresh',user};
  settings.set('backup-owner:'+project,id);settings.set('supabase-backup-session:'+project,JSON.stringify(session));
  if(withCode)settings.set('backup-recovery-code:'+project,'MLB1.'+id+'.'+'A'.repeat(43));
}
async function backedUp(){seedOwner();return cloud.backUpScans()}
`;

test("both APK variants stay local without a code and automatically enable only after explicit successful creation", () => {
  for (const production of [false, true])
    run(
      `
    for(const oldFlag of [null,'false','true']){
      oldFlag===null?settings.delete('backup-enabled:'+project):settings.set('backup-enabled:'+project,oldFlag);
      assert.deepEqual(await cloud.backupPreferences(),{enabled:false,hasCode:false});
      assert.equal(await cloud.backUpScans(),0);assert.equal(clients,0);assert.equal(uploads,0);
    }
    await assert.rejects(cloud.setBackupEnabled(true),/recovery code/);assert.equal(clients,0);
    online=false;await assert.rejects(cloud.createBackupVault(),/connection/);assert.equal(clients,0);online=true;
    const code=await cloud.createBackupVault();assert.ok(code.startsWith('MLB1.'+owner+'.'));
    assert.equal(anonymous,1);assert.equal(enrolls,1);assert.equal(creates,1);
    assert.equal(await cloud.savedRecoveryCode(),code);assert.equal(uploads,0);
    assert.deepEqual(await cloud.backupPreferences(),{enabled:true,hasCode:true});
    assert.equal(await cloud.backUpScans(),1);assert.equal(user.id,owner);assert.equal(records.get(local.id),local);
    assert.equal(await cloud.backUpScans(),0);assert.equal(uploads,1);
  `,
      production,
    );
});

test("failed creation or local activation never enables private uploads in either APK", () => {
  for (const production of [false, true])
    for (const failure of [
      "service",
      "credential",
      "owner",
      "session",
      "enable",
    ])
      run(
        `
        if('${failure}'==='service')active.functions.invoke=async()=>({error:{code:'controlled'}});
        if('${failure}'==='credential')candidate.auth.signInWithPassword=async()=>({error:{code:'controlled'},data:{session:null}});
        if('${failure}'==='owner')candidate.auth.getUser=async()=>({data:{user:null},error:{code:'controlled'}});
        if('${failure}'==='session')failSetting='supabase-backup-session:'+project;
        if('${failure}'==='enable')failSetting='backup-enabled:'+project;
        await assert.rejects(cloud.createBackupVault());
        assert.deepEqual(await cloud.backupPreferences(),{enabled:false,hasCode:false});
        const beforeClients=clients;assert.equal(await cloud.backUpScans(),0);assert.equal(clients,beforeClients);
        assert.equal(uploads,0);assert.equal(manifests.size,0);assert.equal(records.get(local.id),local);
      `,
        production,
      );
});

test("damaged saved codes fail closed without constructing Auth clients", () => {
  for (const production of [false, true])
    run(
      `
    settings.set('backup-recovery-code:'+project,'damaged-code');settings.set('backup-enabled:'+project,'true');
    assert.deepEqual(await cloud.backupPreferences(),{enabled:false,hasCode:false});
    await assert.rejects(cloud.backUpScans());assert.equal(clients,0);
    await assert.rejects(cloud.setBackupEnabled(true),/recovery code/);assert.equal(clients,0);
  `,
      production,
    );
});

test("existing code preferences preserve both legacy disables and explicit pauses", () => {
  for (const production of [false, true])
    run(
      `
    seedOwner();
    for(const flag of ['false','paused']){
      settings.set('backup-enabled:'+project,flag);
      const beforeClients=clients;
      assert.equal((await cloud.backupPreferences()).enabled,false);assert.equal(await cloud.backUpScans(),0);
      assert.equal(clients,beforeClients);await cloud.restoreCloudBackup('MLB1.'+owner+'.'+'A'.repeat(43));
      assert.equal((await cloud.backupPreferences()).enabled,false);
    }
    settings.delete('backup-enabled:'+project);assert.equal((await cloud.backupPreferences()).enabled,true);
  `,
      production,
    );
});

test("fresh source restore creates a separate receiving backup while retaining local History", () => {
  for (const production of [false, true])
    run(
      `
    assert.equal(await cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),0);
    assert.equal(anonymous,1);assert.equal(creates,1);assert.equal(enrolls,1);
    assert.equal((await cloud.backupPreferences()).enabled,true);assert.equal(records.get(local.id),local);
    assert.equal(await cloud.backUpScans(),1);assert.equal(manifests.get(owner+'/'+local.id).completed,true);
    assert.equal(manifests.has(other+'/'+local.id),false);assert.equal(user.id,owner);
    assert.equal(sourceReaders.length,1);assert.equal(sourceReaders[0].disposed,true);
  `,
      production,
    );
});

test("lost legacy anonymous sessions cannot be replaced by a new owner during code creation", () => {
  run(`
    seedOwner(false);session=null;
    await assert.rejects(cloud.createBackupVault(),/existing backup owner/);
    assert.equal(anonymous,0);assert.equal(creates,0);assert.equal(uploads,0);
    assert.equal(settings.get('backup-owner:'+project),owner);
  `);
});

test("verified same-vault recovery drains pending deletion despite a lost original session", () => {
  for (const production of [false, true])
    run(
      `
    await backedUp();const queue=await import('./src/lib/cloud-history-delete.ts');
    await cloud.setBackupEnabled(false);await queue.deleteScansWithCloudQueue([local.id]);
    session=null;user=null;settings.delete('supabase-backup-session:'+project);
    assert.equal(jobs.size,1);assert.equal(await cloud.backUpScans(),0);
    assert.equal(jobs.size,0);assert.equal(manifests.size,0);assert.equal(anonymous,0);
    assert.equal((await cloud.backupPreferences()).enabled,false);
  `,
      production,
    );
});

test("another vault cannot consume pending jobs when the original session is lost", () => {
  run(`
    await backedUp();const queue=await import('./src/lib/cloud-history-delete.ts');
    await queue.deleteScansWithCloudQueue([local.id]);user=null;session=null;
    settings.set('backup-recovery-code:'+project,'MLB1.'+owner+'.'+'B'.repeat(43));
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),/accepted/);
    assert.equal(jobs.size,1);assert.equal(manifests.size,1);
    assert.equal(settings.get('backup-owner:'+project),owner);
    assert.equal(await cloud.savedRecoveryCode(),'MLB1.'+owner+'.'+'B'.repeat(43));
  `);
});

test("a rejected stored session reconnects its saved code before retrying uploads", () => {
  for (const production of [false, true])
    run(
      `
    await backedUp();active.auth.getUser=async()=>({data:{user:null},error:{code:'expired'}});
    const next=report('44444444-4444-4444-8444-444444444444');records.set(next.id,next);
    assert.equal(await cloud.backUpScans(),1);assert.equal(anonymous,0);assert.equal(creates,0);
    assert.equal(manifests.get(owner+'/'+next.id).completed,true);assert.equal(user.id,owner);
  `,
      production,
    );
});

// Restart the actual scheduler after backgrounding; persisted manifests, not
// an in-memory counter, decide which photos need retrying.
test("both APK schedulers stay local before setup and resume unfinished backups after reopening", () => {
  for (const production of [false, true])
    run(
      `
    globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
    const timers=new Map();let timer=0;
    globalThis.setTimeout=(fn,delay)=>{timers.set(++timer,{fn,delay});return timer};
    globalThis.clearTimeout=id=>timers.delete(id);globalThis.setInterval=()=>0;globalThis.clearInterval=()=>{};
    async function fire(){const first=[...timers.entries()][0];assert.ok(first);timers.delete(first[0]);await first[1].fn()}
    const stop=cloud.startCloudBackup();await fire();assert.equal(clients,0);assert.equal(anonymous,0);
    await cloud.createBackupVault();const code=await cloud.savedRecoveryCode();
    const next=report('44444444-4444-4444-8444-444444444444');records.set(next.id,next);
    const storage=active.storage.from();let hidden=false;
    active.storage.from=()=>({...storage,upload:async()=>{uploads++;if(!hidden){hidden=true;document.visibilityState='hidden'}return{}}});
    await fire();assert.equal(uploads,1);assert.equal(manifests.get(owner+'/'+local.id).completed,true);
    assert.equal(manifests.has(owner+'/'+next.id),false);stop();
    document.visibilityState='visible';const stopReopened=cloud.startCloudBackup();await fire();
    assert.equal(uploads,2);assert.equal(manifests.get(owner+'/'+next.id).completed,true);
    assert.equal(anonymous,1);assert.equal(creates,1);assert.equal(await cloud.savedRecoveryCode(),code);
    stopReopened();
  `,
      production,
    );
});

test("wrong recovery credentials preserve the connected session; valid recovery merges five reports with the new local report", () => {
  run(`
    await backedUp();const before=session;
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'B'.repeat(43)));
    assert.equal(session,before);assert.equal(sessionChanges,0);assert.equal(user.id,owner);
    for(let i=4;i<=8;i++){
      const row=await prepareBackupRow(other,report(String(i).repeat(8)+'-4444-4444-8444-444444444444','2026-10-19T00:00:00.000Z'));
      row.completed=true;manifests.set(other+'/'+row.record_id,row);
    }
    assert.equal(await cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),5);
    assert.equal(records.size,6);assert.equal(records.get(local.id),local);
    assert.equal(user.id,owner);assert.equal(await cloud.restoreCloudBackup(),0);
    assert.equal([...records.values()].filter(r=>r.updated_at==='2026-10-19T00:00:00.000Z').length,5);
  `);
});

test("a shared recovery code backs up both phones' reports and repeated restore adds no duplicates", () => {
  for (const production of [false, true]) {
    const cloudRows = JSON.parse(
      run(
        `
    seedOwner(true,other);
    const ownSecond=report('44444444-4444-4444-8444-444444444444');records.set(ownSecond.id,ownSecond);
    const sharedCode='MLB1.'+other+'.'+'A'.repeat(43);
    for(let i=5;i<=9;i++){
      const original=report(String(i).repeat(8)+'-5555-4555-8555-555555555555','2026-10-19T00:00:00.000Z');
      const row=await prepareBackupRow(other,original);
      manifests.set(other+'/'+original.id,{...row,completed:true});
    }
    assert.equal(await cloud.restoreCloudBackup(sharedCode),5);assert.equal(records.size,7);
    assert.equal(await cloud.savedRecoveryCode(),sharedCode);assert.equal(user.id,other);
    await assert.rejects(cloud.createBackupVault(),/already connected/);
    assert.equal(creates,0);assert.equal(anonymous,0);
    assert.equal(await cloud.backUpScans(),2);assert.equal(manifests.size,7);
    assert.ok([...manifests.values()].every(row=>row.owner_id===other&&row.completed));
    console.log(JSON.stringify([...manifests.values()]));
  `,
        production,
      ),
    );
    // A separate process gives the other phone its own native store, settings and Auth clients.
    // Only the synthetic completed cloud manifests cross between the two fixtures.
    run(
      `
    const sharedCode='MLB1.'+other+'.'+'A'.repeat(43);
    records.clear();for(let i=5;i<=9;i++){
      const original=report(String(i).repeat(8)+'-5555-4555-8555-555555555555','2026-10-19T00:00:00.000Z');
      records.set(original.id,original);
    }
    for(const row of ${JSON.stringify(cloudRows)})manifests.set(row.owner_id+'/'+row.record_id,row);
    user={id:other,email:other+'@backup.mangoleaf.invalid',is_anonymous:false,app_metadata:{android_backup_vault:true}};
    session={access_token:'other-phone',refresh_token:'other-phone-refresh',user};
    settings.set('backup-owner:'+project,other);settings.set('backup-recovery-code:'+project,sharedCode);
    settings.set('supabase-backup-session:'+project,JSON.stringify(session));
    assert.equal(await cloud.restoreCloudBackup(sharedCode),2);assert.equal(records.size,7);
    assert.equal(await cloud.restoreCloudBackup(sharedCode),0);assert.equal(records.size,7);
    assert.ok(records.has(local.id));assert.ok(records.has('44444444-4444-4444-8444-444444444444'));
    assert.equal(await cloud.savedRecoveryCode(),sharedCode);assert.equal(creates,0);assert.equal(anonymous,0);
  `,
      production,
    );
  }
});

test("source restore copies A's two reports into B's five without changing either backup owner", () => {
  for (const production of [false, true])
    run(
      `
    seedOwner();for(let i=4;i<=7;i++){
      const row=report(String(i).repeat(8)+'-4444-4444-8444-444444444444');records.set(row.id,row);
    }
    assert.equal(await cloud.backUpScans(),5);
    for(let i=8;i<=9;i++){
      const row=await prepareBackupRow(other,report(String(i).repeat(8)+'-8888-4888-8888-888888888888'));
      manifests.set(other+'/'+row.record_id,{...row,completed:true});
    }
    const sourceBefore=JSON.stringify([...manifests.values()].filter(row=>row.owner_id===other));
    const beforeSession=session,beforeCode=await cloud.savedRecoveryCode(),beforeSettings=[...settings];
    const sourceCode='MLB1.'+other+'.'+'A'.repeat(43);
    assert.equal(await cloud.restoreCloudBackup(sourceCode),2);assert.equal(records.size,7);
    assert.equal(session,beforeSession);assert.equal(await cloud.savedRecoveryCode(),beforeCode);
    assert.deepEqual([...settings],beforeSettings);assert.equal(user.id,owner);assert.equal(creates,0);
    assert.equal(await cloud.backUpScans(),2);
    assert.equal([...manifests.values()].filter(row=>row.owner_id===owner).length,7);
    assert.equal(JSON.stringify([...manifests.values()].filter(row=>row.owner_id===other)),sourceBefore);
    assert.ok(uploadPaths.every(path=>path.startsWith(owner+'/')));
    assert.equal(await cloud.restoreCloudBackup(sourceCode),0);assert.equal(records.size,7);
    await cloud.setBackupEnabled(false);const queue=await import('./src/lib/cloud-history-delete.ts');
    const copiedId='88888888-8888-4888-8888-888888888888';await queue.deleteScansWithCloudQueue([copiedId]);
    assert.equal(jobs.size,1);assert.equal([...jobs.values()][0].scope,project+':'+owner);
    assert.equal(await cloud.backUpScans(),0);assert.equal(jobs.size,0);
    assert.equal(manifests.has(owner+'/'+copiedId),false);assert.equal(manifests.has(other+'/'+copiedId),true);
    assert.ok(removals.every(path=>path.startsWith(owner+'/')));
    assert.equal(await cloud.restoreCloudBackup(sourceCode),0);assert.equal(records.has(copiedId),false);
    assert.equal((await cloud.backupPreferences()).enabled,false);
    assert.equal(JSON.stringify([...manifests.values()].filter(row=>row.owner_id===other)),sourceBefore);
    assert.ok(sourceReaders.every(reader=>reader.disposed));
  `,
      production,
    );
});

test("wrong or unverified source credentials cannot create or alter the receiving backup", () => {
  for (const production of [false, true])
    for (const hasOwnCode of [false, true])
      run(
        `
    if(${hasOwnCode}){seedOwner();await cloud.setBackupEnabled(false)}
    const before=[...settings],beforeSession=session;
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'B'.repeat(43)),/accepted/);
    sourceVerifiedUser=user=>({...user,app_metadata:{}});
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),/verified/);
    assert.deepEqual([...settings],before);assert.equal(session,beforeSession);
    assert.equal(anonymous,0);assert.equal(creates,0);assert.equal(enrolls,0);assert.equal(uploads,0);
    assert.ok(sourceReaders.every(reader=>reader.disposed));assert.equal(cloud.isCloudBackupRunning(),false);
  `,
        production,
      );
});

test("a failed receiving-code setup leaves uploads off and never attaches source credentials", () => {
  for (const production of [false, true])
    for (const failure of ["service", "session", "enable"])
      run(
        `
    const sourceRow=await prepareBackupRow(other,report('44444444-4444-4444-8444-444444444444'));
    manifests.set(other+'/'+sourceRow.record_id,{...sourceRow,completed:true});
    if('${failure}'==='service'){
      const invoke=active.functions.invoke;active.functions.invoke=async(name,p)=>p.body.action==='create'?{error:{code:'controlled'}}:invoke(name,p);
    }
    if('${failure}'==='session')failSetting='supabase-backup-session:'+project;
    if('${failure}'==='enable')failSetting='backup-enabled:'+project;
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)));
    assert.deepEqual(await cloud.backupPreferences(),{enabled:false,hasCode:false});
    assert.equal(records.size,1);assert.equal(uploads,0);assert.equal(manifests.size,1);
    assert.notEqual(user?.id,other);assert.notEqual(settings.get('backup-owner:'+project),other);
    assert.ok(sourceReaders.every(reader=>reader.disposed));assert.equal(sourceReaders[0].downloads,0);
    assert.equal(await cloud.backUpScans(),0);
  `,
        production,
      );
});

test("source restore preserves a legacy own anonymous owner and refuses to rotate the source owner", () => {
  for (const production of [false, true])
    run(
      `
    seedOwner(false);const source='MLB1.'+other+'.'+'A'.repeat(43);
    await cloud.restoreCloudBackup(source);assert.equal(anonymous,0);assert.equal(creates,1);assert.equal(user.id,owner);
    assert.equal(await cloud.savedRecoveryCode(),'MLB1.'+owner+'.'+'A'.repeat(43));
  `,
      production,
    );
  for (const production of [false, true])
    run(
      `
    seedOwner(false,other);const before=[...settings];
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),/source backup/);
    assert.equal(creates,0);assert.equal(anonymous,0);assert.equal(user.id,other);
    assert.deepEqual([...settings],before);assert.equal((await cloud.backupPreferences()).enabled,false);
    assert.ok(sourceReaders.every(reader=>reader.disposed));
  `,
      production,
    );
});

test("interrupted source photo copies retain completed imports and retry without duplicates", () => {
  for (const production of [false, true])
    run(
      `
    seedOwner();await cloud.setBackupEnabled(false);
    for(let i=4;i<=5;i++){
      const row=await prepareBackupRow(other,report(String(i).repeat(8)+'-4444-4444-8444-444444444444'));
      manifests.set(other+'/'+row.record_id,{...row,completed:true});
    }
    let attempts=0;beforeSourceDownload=()=>{if(++attempts===2)throw Error('controlled photo failure')};
    const source='MLB1.'+other+'.'+'A'.repeat(43);
    await assert.rejects(cloud.restoreCloudBackup(source),/photo failure/);assert.equal(records.size,2);
    assert.equal((await cloud.backupPreferences()).enabled,false);assert.equal(user.id,owner);
    beforeSourceDownload=undefined;assert.equal(await cloud.restoreCloudBackup(source),1);assert.equal(records.size,3);
    assert.equal(await cloud.restoreCloudBackup(source),0);assert.equal(records.size,3);
    assert.ok(sourceReaders.every(reader=>reader.disposed));assert.equal(manifests.size,2);assert.equal(uploads,0);
  `,
      production,
    );
});

test("backgrounding or cancelling source recovery stops the next import and releases the operation", () => {
  for (const production of [false, true])
    for (const interruption of ["background", "offline", "cancel", "busy"])
      run(
        `
    seedOwner();const before=[...settings],controller=new AbortController();
    const row=await prepareBackupRow(other,report('44444444-4444-4444-8444-444444444444'));
    manifests.set(other+'/'+row.record_id,{...row,completed:true});
    let release;beforeSourceDownload=()=>new Promise(resolve=>{release=resolve});
    const restoring=cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43),controller.signal);
    while(!release)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(cloud.isCloudBackupRunning(),true);assert.equal(await cloud.backUpScans(),0);
    if('${interruption}'==='background')document.visibilityState='hidden';
    if('${interruption}'==='offline')online=false;
    if('${interruption}'==='cancel')controller.abort();
    if('${interruption}'==='busy')cloud.setCloudBackupBusy(true);
    release();await assert.rejects(restoring);assert.equal(cloud.isCloudBackupRunning(),false);
    assert.equal(records.size,1);assert.deepEqual([...settings],before);
    assert.equal(sourceReaders[0].disposed,true);assert.equal(uploads,0);
  `,
        production,
      );
});

test("source verification interrupted before setup creates no receiving identity", () => {
  for (const production of [false, true])
    run(
      `
    beforeSourceLogin=()=>{document.visibilityState='hidden'};
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),/foreground/);
    assert.equal(anonymous,0);assert.equal(creates,0);assert.equal(enrolls,0);assert.equal(settings.size,0);
    assert.equal(sourceReaders[0].disposed,true);assert.equal(records.size,1);
  `,
      production,
    );
});

test("restoring the own code recovers an expired own session and drains only its paused outbox", () => {
  for (const production of [false, true])
    run(
      `
    await backedUp();await cloud.setBackupEnabled(false);const queue=await import('./src/lib/cloud-history-delete.ts');
    await queue.deleteScansWithCloudQueue([local.id]);assert.equal(jobs.size,1);
    session=null;user=null;settings.delete('supabase-backup-session:'+project);
    assert.equal(await cloud.restoreCloudBackup('MLB1.'+owner+'.'+'A'.repeat(43)),0);
    assert.equal(user.id,owner);assert.equal(jobs.size,0);assert.equal(manifests.size,0);assert.equal(records.size,0);
    assert.equal((await cloud.backupPreferences()).enabled,false);assert.equal(creates,0);assert.equal(anonymous,0);
    assert.ok(removals.every(path=>path.startsWith(owner+'/')));assert.equal(sourceReaders[0].disposed,true);
  `,
      production,
    );
});

test("legacy anonymous owners retain their session and confirmed deletions without resuming uploads", () => {
  run(`
    seedOwner(false);const original=session;const saved=settings.get('supabase-backup-session:'+project);
    const backup=await prepareBackupRow(owner,local);manifests.set(owner+'/'+local.id,{...backup,completed:true});
    await cloud.backUpScans();assert.equal(clients,0);assert.equal(uploads,0);
    assert.equal(session,original);assert.equal(settings.get('supabase-backup-session:'+project),saved);
    const {deleteScansWithCloudQueue}=await import('./src/lib/cloud-history-delete.ts');
    await deleteScansWithCloudQueue([local.id]);assert.equal(jobs.size,1);
    assert.equal([...jobs.values()][0].scope,project+':'+owner);
    await cloud.backUpScans();assert.equal(jobs.size,0);assert.equal(manifests.size,0);
    assert.equal(anonymous,0);assert.equal(creates,0);
    const code=await cloud.createBackupVault();assert.equal(user.id,owner);assert.equal(anonymous,0);
    assert.equal(await cloud.savedRecoveryCode(),code);assert.equal((await cloud.backupPreferences()).enabled,true);
  `);
});

test("legacy Production anonymous ownership attaches recovery without replacing earlier cloud data", () => {
  run(
    `
    seedOwner(false);settings.set('backup-enabled:'+project,'true');
    const original=await prepareBackupRow(owner,local);manifests.set(owner+'/'+local.id,{...original,completed:true});
    assert.equal((await cloud.backupPreferences()).enabled,false);assert.equal(await cloud.backUpScans(),0);assert.equal(clients,0);
    const code=await cloud.createBackupVault();assert.equal(user.id,owner);assert.equal(anonymous,0);assert.equal(enrolls,0);
    assert.equal(await cloud.savedRecoveryCode(),code);assert.equal((await cloud.backupPreferences()).enabled,true);
    assert.equal(await cloud.backUpScans(),0);assert.equal(uploads,0);assert.equal(manifests.size,1);
    assert.ok([...settings.keys()].every(key=>key.endsWith(':'+project)));
  `,
    true,
  );
});

test("Production keeps a paused existing code and reconnects that code instead of creating another identity", () => {
  run(
    `
    seedOwner();await cloud.setBackupEnabled(false);assert.equal(settings.get('backup-enabled:'+project),'paused');
    assert.equal((await cloud.backupPreferences()).enabled,false);await cloud.backUpScans();assert.equal(anonymous,0);
    await cloud.setBackupEnabled(true);await cloud.backUpScans();assert.equal(anonymous,0);
    session=null;await cloud.backUpScans();assert.equal(anonymous,0);assert.equal(user.id,owner);
  `,
    true,
  );
});

test("a missing session reconnects its saved recovery code and continues with the promoted client", () => {
  run(`
    await backedUp();
    const code='MLB1.'+owner+'.'+'A'.repeat(43);settings.set('backup-recovery-code:'+project,code);
    const next=report('44444444-4444-4444-8444-444444444444');records.set(next.id,next);
    session=null;settings.delete('supabase-backup-session:'+project);
    let retired=false;const getUser=active.auth.getUser;
    active.auth.dispose=async()=>{retired=true};
    active.auth.getUser=async()=>{assert.equal(retired,false,'must use the promoted Auth client');return getUser()};
    assert.equal(await cloud.backUpScans(),1);assert.equal(retired,true);
    assert.equal(anonymous,0);assert.equal(creates,0);assert.equal(user.id,owner);
    assert.equal(manifests.get(owner+'/'+next.id).completed,true);
    assert.equal(await cloud.savedRecoveryCode(),code);
  `);
});

test("Production wrong-code recovery preserves its current owner and valid recovery merges local reports", () => {
  run(
    `
    await backedUp();const before=session;
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'B'.repeat(43)));
    assert.equal(session,before);assert.equal(sessionChanges,0);
    const row=await prepareBackupRow(other,report('44444444-4444-4444-8444-444444444444','2026-10-19T00:00:00.000Z'));
    row.completed=true;manifests.set(other+'/'+row.record_id,row);
    assert.equal(await cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),1);
    assert.equal(records.size,2);assert.equal(records.get(local.id),local);
    assert.equal((await cloud.backupPreferences()).enabled,true);
    assert.equal(await cloud.restoreCloudBackup(),0);
  `,
    true,
  );
});

test("creation explicitly enables backup and later reconnection preserves its pause in both APK variants", () => {
  for (const production of [false, true])
    run(
      `
    seedOwner(false);await cloud.setBackupEnabled(false);
    const code=await cloud.createBackupVault();assert.equal((await cloud.backupPreferences()).enabled,true);
    await cloud.setBackupEnabled(false);
    await cloud.restoreCloudBackup(code);assert.equal((await cloud.backupPreferences()).enabled,false);
    await cloud.setBackupEnabled(true);assert.equal((await cloud.backupPreferences()).enabled,true);
  `,
      production,
    );
});

// Backgrounding must allow an in-flight photo/commit to settle, then yield before the next report.
test("automatic backup finishes its current photo but waits for foreground before the next report", () => {
  run(`
    seedOwner();
    const next=report('44444444-4444-4444-8444-444444444444');records.set(next.id,next);
    const storage=active.storage.from();let hide=true;
    active.storage.from=()=>({...storage,upload:async()=>{uploads++;if(hide)document.visibilityState='hidden';return{}}});
    assert.equal(await cloud.backUpScans(),1);assert.equal(uploads,1);
    assert.equal(manifests.get(owner+'/'+local.id).completed,true);
    assert.equal(manifests.has(owner+'/'+next.id),false);
    assert.equal(await cloud.backUpScans(),0);assert.equal(uploads,1);
    hide=false;document.visibilityState='visible';
    assert.equal(await cloud.backUpScans(),1);assert.equal(uploads,2);
    assert.equal(manifests.get(owner+'/'+next.id).completed,true);
  `);
});

test("a pending intent never starts its photo after backgrounding, diagnosis, disconnection or pause", () => {
  for (const change of [
    "document.visibilityState='hidden'",
    "cloud.setCloudBackupBusy(true)",
    "online=false",
    "await cloud.setBackupEnabled(false)",
  ])
    run(`
      seedOwner();
      const rpc=active.rpc;let interrupt=true;
      active.rpc=async(name,p)=>{const result=await rpc(name,p);if(name==='begin_android_backup_report'&&interrupt){${change}}return result};
      assert.equal(await cloud.backUpScans(),0);assert.equal(uploads,0);
      assert.equal(manifests.get(owner+'/'+local.id).completed,undefined);
      interrupt=false;document.visibilityState='visible';online=true;cloud.setCloudBackupBusy(false);await cloud.setBackupEnabled(true);
      assert.equal(await cloud.backUpScans(),1);assert.equal(uploads,1);
      assert.equal(manifests.get(owner+'/'+local.id).completed,true);
    `);
});

test("History deletion during candidate login drains under its original owner before recovery switches", () => {
  run(`
    await backedUp();
    const queue=await import('./src/lib/cloud-history-delete.ts');
    const signIn=candidate.auth.signInWithPassword;
    candidate.auth.signInWithPassword=async input=>{await queue.deleteScansWithCloudQueue([local.id]);return signIn(input)};
    await cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));
    assert.equal(user.id,other);assert.equal(jobs.size,0);assert.equal(manifests.size,0);assert.equal(records.size,0);
    assert.equal(await queue.cloudHistoryScope(),project+':'+other);
  `);
});

// Hold a local commit until after verification: the final guard must see its old-owner outbox job.
test("an overlapping local delete aborts a late recovery switch without replacing the owner", () => {
  run(`
    await backedUp();const before=session;
    const queue=await import('./src/lib/cloud-history-delete.ts');
    let release;const blocker=queue.withCloudHistoryMutation(()=>new Promise(resolve=>{release=resolve}));
    const deletion=queue.deleteScansWithCloudQueue([local.id]);
    let failed;
    const connecting=cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43)).catch(error=>{failed=error});
    for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(candidateUser.id,other);assert.equal(sessionChanges,0);
    release();await blocker;await deletion;await connecting;
    assert.match(failed.message,/Pending cloud deletions/);assert.equal(session,before);assert.equal(user.id,owner);
    assert.equal(records.size,0);assert.equal(jobs.size,1);assert.equal(manifests.size,1);
    await backedUp();assert.equal(jobs.size,0);assert.equal(manifests.size,0);
    await cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));assert.equal(user.id,other);
  `);
});

test("deletion during explicit recovery setup cannot upload the removed local report", () => {
  run(`
    const queue=await import('./src/lib/cloud-history-delete.ts');
    const signIn=active.auth.signInAnonymously;
    active.auth.signInAnonymously=async()=>{const result=await signIn();await queue.deleteScansWithCloudQueue([local.id]);return result};
    await cloud.createBackupVault();assert.equal(await cloud.backUpScans(),0);
    assert.equal(records.size,0);assert.equal(jobs.size,0);assert.equal(manifests.size,0);assert.equal(uploads,0);
  `);
});

test("candidate verification uses memory only and leaves local History deletion available", () => {
  run(`
    await backedUp();const before=settings.get('supabase-backup-session:'+project);
    const queue=await import('./src/lib/cloud-history-delete.ts');
    const getUser=candidate.auth.getUser;let release;
    candidate.auth.getUser=async()=>{await new Promise(resolve=>{release=resolve});return getUser()};
    const connecting=cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));
    for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(typeof release,'function');assert.equal(settings.get('supabase-backup-session:'+project),before);
    assert.equal(settings.get('backup-owner:'+project),owner);assert.equal(settings.get('backup-recovery-code:'+project),'MLB1.'+owner+'.'+'A'.repeat(43));
    let deleted=false;const deletion=queue.deleteScansWithCloudQueue([local.id]).then(()=>{deleted=true});
    for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(deleted,true);assert.equal(jobs.size,1);assert.equal(user.id,owner);
    release();await connecting;await deletion;
    assert.equal(user.id,other);assert.equal(jobs.size,0);assert.equal(manifests.size,0);
    assert.equal(candidateOptions.auth.persistSession,true);assert.equal(candidateOptions.auth.autoRefreshToken,true);
    assert.notEqual(candidateOptions.auth.storageKey,activeOptions.auth.storageKey);
  `);
});

// dispose does not cancel an older HTTP response: its storage adapter must independently reject that late write.
test("a retired refresh waiting on host validation cannot overwrite or remove the promoted recovery session", () => {
  run(`
    await backedUp();const retired=activeStorage;let release;
    holdInitialization=new Promise(resolve=>{release=resolve});
    const late=retired.setItem('ignored',JSON.stringify({...session,access_token:'late-old-owner'}));
    await cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));
    const promoted=settings.get('supabase-backup-session:'+project);
    release();await late;await retired.removeItem('ignored');
    assert.equal(settings.get('supabase-backup-session:'+project),promoted);
    assert.equal(user.id,other);assert.equal(await cloud.savedRecoveryCode(),'MLB1.'+other+'.'+'A'.repeat(43));
    await candidateStorage.setItem('ignored',JSON.stringify({...session,access_token:'fresh-new-owner'}));
    assert.equal(JSON.parse(settings.get('supabase-backup-session:'+project)).access_token,'fresh-new-owner');
  `);
});

test("a retired session read finishing after promotion cannot receive the new owner's refresh token", () => {
  run(`
    await backedUp();const retired=activeStorage;let release;
    const original=await retired.getItem('ignored');
    holdInitialization=new Promise(resolve=>{release=resolve});const late=retired.getItem('ignored');
    await cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));
    const promoted=settings.get('supabase-backup-session:'+project);
    release();assert.equal(await late,original);
    assert.notEqual(promoted,original);assert.equal(JSON.parse(promoted).user.id,other);
  `);
});

test("a candidate failing server ownership verification never persists and its later refresh stays isolated", () => {
  run(`
    await backedUp();const before=settings.get('supabase-backup-session:'+project);
    candidate.auth.getUser=async()=>({data:{user:{...candidateUser,app_metadata:{}}}});
    await assert.rejects(cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43)),/verified/);
    assert.equal(settings.get('supabase-backup-session:'+project),before);assert.equal(user.id,owner);
    await candidateStorage.setItem('ignored',JSON.stringify({access_token:'failed-candidate'}));await candidateStorage.removeItem('ignored');
    assert.equal(settings.get('supabase-backup-session:'+project),before);
    assert.equal(settings.get('backup-owner:'+project),owner);assert.equal(settings.get('backup-recovery-code:'+project),'MLB1.'+owner+'.'+'A'.repeat(43));
  `);
});

test("a failed local promotion restores prior credentials and keeps the prior session adapter usable", () => {
  run(`
    await backedUp();const before=settings.get('supabase-backup-session:'+project);const previous=activeStorage;
    failSetting='supabase-backup-session:'+project;
    await assert.rejects(cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43)),/persistence failure/);
    assert.equal(settings.get('supabase-backup-session:'+project),before);assert.equal(user.id,owner);
    assert.equal(settings.get('backup-owner:'+project),owner);assert.equal(settings.get('backup-recovery-code:'+project),'MLB1.'+owner+'.'+'A'.repeat(43));
    await candidateStorage.setItem('ignored',JSON.stringify({access_token:'failed-promotion'}));
    assert.equal(settings.get('supabase-backup-session:'+project),before);
    await previous.setItem('ignored',JSON.stringify({...session,access_token:'refreshed-original-owner'}));
    assert.equal(JSON.parse(settings.get('supabase-backup-session:'+project)).access_token,'refreshed-original-owner');
  `);
});

test("a settling original-owner refresh is retained when candidate promotion rolls back", () => {
  run(`
    await backedUp();const previous=activeStorage;const original={...session};
    let settled=false;
    beforeSetting=async p=>{
      if(!settled&&p.key==='backup-owner:'+project&&p.value===owner){
        settled=true;await previous.setItem('ignored',JSON.stringify({...original,access_token:'rotated-original-owner'}));
      }
    };
    failSetting='supabase-backup-session:'+project;
    await assert.rejects(cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43)),/persistence failure/);
    assert.equal(settled,true);assert.equal(settings.get('backup-owner:'+project),owner);
    const saved=JSON.parse(settings.get('supabase-backup-session:'+project));
    assert.equal(saved.user.id,owner);assert.equal(saved.access_token,'rotated-original-owner');
    assert.equal(settings.get('backup-recovery-code:'+project),'MLB1.'+owner+'.'+'A'.repeat(43));
  `);
});

// Keep one real SDK contract check: mocked Auth methods alone cannot prove persisted session compatibility.
test("the installed Supabase SDK promotes the staged session without Auth HTTP during the local commit", () => {
  run(
    `
    await cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));
    const saved=JSON.parse(settings.get('supabase-backup-session:'+project));
    assert.equal(saved.user.id,other);assert.equal(saved.access_token,newSession.access_token);
    assert.equal(settings.get('backup-owner:'+project),other);
    assert.equal(await cloud.savedRecoveryCode(),'MLB1.'+other+'.'+'A'.repeat(43));
    assert.equal(passwordRequests,1);assert.equal(userRequests,1);assert.equal(commitStarted,true);
    process.exit(0);
  `,
    false,
    String.raw`
import assert from 'node:assert/strict';
import {mock} from 'bun:test';
const project='ajwlojaclehxupntnsve',origin='https://'+project+'.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const expires=Math.floor(Date.now()/1000)+3600;
const user=id=>({id,email:id+'@backup.mangoleaf.invalid',aud:'authenticated',role:'authenticated',app_metadata:{android_backup_vault:true},user_metadata:{},created_at:'2026-10-21T00:00:00.000Z'});
const token=id=>[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:id,exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),Buffer.from('synthetic-signature-not-a-real-credential').toString('base64url')].join('.');
const session=id=>({access_token:token(id),refresh_token:'synthetic-refresh-'+id,token_type:'bearer',expires_in:3600,expires_at:expires,user:user(id)});
const newSession=session(other),settings=new Map([['supabase-backup-session:'+project,JSON.stringify(session(owner))],['backup-owner:'+project,owner]]);
let commitStarted=false,passwordRequests=0,userRequests=0;
globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
globalThis.fetch=async(input,init)=>{
  assert.equal(commitStarted,false,'Auth network must finish before local credential writes');
  const request=new Request(input,init),url=new URL(request.url);assert.equal(url.origin,origin);
  if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='password'){
    passwordRequests++;const body=await request.json();assert.equal(body.email,user(other).email);assert.equal(body.password,'A'.repeat(43));
    return Response.json(newSession);
  }
  if(url.pathname==='/auth/v1/user'){
    userRequests++;assert.equal(request.headers.get('Authorization'),'Bearer '+newSession.access_token);return Response.json(user(other));
  }
  throw new Error('Unexpected HTTP path in isolated SDK contract');
};
mock.module('dexie',()=>({liveQuery:()=>{throw new Error('No browser storage')}}));
mock.module('./src/lib/db.ts',()=>({db:{}}));
mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>true,connectionHint:()=>true,subscribeConnection:()=>()=>{},
  initializeNativeRuntime:async()=>({cloudEnvironment:'testing',hostVersion:4}),
  nativeRequest:async(method,p={})=>{
    if(method==='storage.settings.get')return settings.get(p.key)??null;
    if(method==='storage.settings.set'){commitStarted=true;p.value===null?settings.delete(p.key):settings.set(p.key,p.value);return true}
    if(method==='storage.cloudDelete.list')return[];
    throw new Error('Unexpected local method '+method);
  }}));
const cloud=await import('./src/lib/cloud-backup.ts');
`,
  );
});

// Two real-SDK subprocesses verify separate variants; startup is not a five-second performance gate.
test("the installed SDK reads a temporary source and the real native adapter verifies its imported count", () => {
  for (const production of [false, true])
    run(
      `
    const cloud=await import('./src/lib/cloud-backup.ts');
    const before=[...settings];assert.equal(await cloud.restoreCloudBackup(sourceCode),2);
    assert.equal(stored.size,3);assert.deepEqual([...settings],before);assert.equal(browserStorage.size,0);
    assert.equal(passwordRequests,1);assert.equal(userRequests,1);assert.equal(photoRequests,2);
    assert.equal(await cloud.restoreCloudBackup(sourceCode),0);assert.equal(stored.size,3);
    assert.deepEqual([...settings],before);assert.equal(browserStorage.size,0);assert.equal(photoRequests,2);
    assert.equal(passwordRequests,2);assert.equal(userRequests,2);assert.equal(cloud.isCloudBackupRunning(),false);
    // The real SDK must pass caller cancellation through to the in-flight source fetch.
    stored.delete(rows[0].record_id);const controller=new AbortController(),forward=globalThis.fetch;
    let heldSignal;globalThis.fetch=async(input,init)=>{
      const request=new Request(input,init);
      if(new URL(request.url).pathname.startsWith('/storage/v1/object/scans/')){
        heldSignal=request.signal;return new Promise((resolve,reject)=>request.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
      }
      return forward(input,init);
    };
    const restoring=cloud.restoreCloudBackup(sourceCode,controller.signal);
    while(!heldSignal)await new Promise(resolve=>setImmediate(resolve));
    controller.abort();await assert.rejects(restoring);assert.equal(heldSignal.aborted,true);
    assert.deepEqual([...settings],before);assert.equal(stored.size,2);assert.equal(cloud.isCloudBackupRunning(),false);
  `,
      production,
      String.raw`
import assert from 'node:assert/strict';import {mock} from 'bun:test';
const project=process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT==='testing'?'ajwlojaclehxupntnsve':'uuvvvoznajjqknedxpdg',origin='https://'+project+'.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const sourceCode='MLB1.'+other+'.'+'A'.repeat(43),ownCode='MLB1.'+owner+'.'+'B'.repeat(43);
const expires=Math.floor(Date.now()/1000)+3600;
const sourceUser={id:other,email:other+'@backup.mangoleaf.invalid',aud:'authenticated',role:'authenticated',app_metadata:{android_backup_vault:true},user_metadata:{},created_at:'2026-10-25T00:00:00.000Z'};
const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:other,exp:expires,aud:'authenticated',role:'authenticated'})).toString('base64url'),Buffer.from('synthetic-signature-not-a-real-credential').toString('base64url')].join('.');
const sourceSession={access_token:token,refresh_token:'synthetic-source-refresh',token_type:'bearer',expires_in:3600,expires_at:expires,user:sourceUser};
const settings=new Map([['backup-owner:'+project,owner],['backup-recovery-code:'+project,ownCode],['supabase-backup-session:'+project,'unchanged-own-session']]);
const browserStorage=new Map();globalThis.localStorage={getItem:key=>browserStorage.get(key)??null,setItem:(key,value)=>browserStorage.set(key,value),removeItem:key=>browserStorage.delete(key)};
globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
globalThis.window=Object.assign(new EventTarget(),{location:{origin:'https://appassets.androidplatform.net'}});
const photo=new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'});
const report=id=>({id,disease_name:'fixture',confidence:0.5,model_version:'v4.5.0',updated_at:'2026-10-25T00:00:00.000Z',_status:'local-only',image_blob:photo});
const stored=new Map([['33333333-3333-4333-8333-333333333333',report('33333333-3333-4333-8333-333333333333')]]);
const {prepareBackupRow}=await import('./src/lib/cloud-backup-format.ts');const rows=[];
for(const id of ['44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555'])rows.push({...await prepareBackupRow(other,report(id)),completed:true});
let passwordRequests=0,userRequests=0,photoRequests=0;
globalThis.fetch=async(input,init)=>{
  const request=new Request(input,init),url=new URL(request.url);assert.equal(url.origin,origin);
  if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='password'){
    passwordRequests++;const body=await request.json();assert.equal(body.email,sourceUser.email);assert.equal(body.password,'A'.repeat(43));return Response.json(sourceSession);
  }
  assert.equal(request.headers.get('Authorization'),'Bearer '+token);
  if(url.pathname==='/auth/v1/user'){userRequests++;return Response.json(sourceUser)}
  if(url.pathname==='/rest/v1/android_backup_reports'){
    assert.equal(request.method,'GET');assert.equal(url.searchParams.get('owner_id'),'eq.'+other);assert.equal(url.searchParams.get('completed'),'eq.true');return Response.json(rows);
  }
  if(url.pathname.startsWith('/storage/v1/object/scans/'+other+'/')){
    assert.equal(request.method,'GET');photoRequests++;return new Response(photo,{headers:{'Content-Type':'image/jpeg'}});
  }
  throw Error('Unexpected HTTP operation: source access must only authenticate and read');
};
mock.module('dexie',()=>({liveQuery:()=>{throw Error('No browser storage')}}));mock.module('./src/lib/db.ts',()=>({db:{}}));
mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>true,connectionHint:()=>true,subscribeConnection:()=>()=>{},
  initializeNativeRuntime:async()=>({cloudEnvironment:process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT,hostVersion:8}),
  nativeRequest:async(method,p={})=>{
    if(method==='storage.settings.get')return settings.get(p.key)??null;
    if(method==='storage.settings.set')throw Error('Typed source credentials must never persist locally');
    if(method==='storage.cloudDelete.list'){assert.equal(p.scope,project+':'+owner);return[]}
    if(method==='storage.report.list')return [...stored.values()];
    if(method==='storage.report.get')return stored.get(p.id)??null;
    if(method==='storage.import'){
      assert.equal(p.records.length,1);const payload=p.records[0];assert.equal(payload.image.base64,'/9j/AA==');
      if(!stored.has(payload.record.id))stored.set(payload.record.id,{...payload.record,photoUri:'https://appassets.androidplatform.net/_native/photos/fixture'});
      return{imported:0};
    }
    throw Error('Unexpected native operation '+method);
  }}));
`,
    );
}, 15_000);

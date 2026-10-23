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
}

const fixture = String.raw`
import assert from 'node:assert/strict';
import {mock} from 'bun:test';
globalThis.fetch=()=>{throw new Error('No real network is permitted')};
globalThis.document={visibilityState:'visible'};
globalThis.setTimeout=()=>0;globalThis.clearTimeout=()=>{};
const owner='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
const project=process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT==='testing'?'ajwlojaclehxupntnsve':'uuvvvoznajjqknedxpdg';
const settings=new Map(), records=new Map(), jobs=new Map(), manifests=new Map();
const photo=new Blob([new Uint8Array([255,216,255,0])],{type:'image/jpeg'});
const report=(id,date='2026-10-21T00:00:00.000Z')=>({id,disease_name:'Healthy Leaf',confidence:0.974321987,updated_at:date,_status:'local-only',image_url:null,image_blob:photo,model_version:'v4.5.0'});
const local=report('33333333-3333-4333-8333-333333333333'); records.set(local.id,local);
let online=true;
let user=null, session=null, candidateUser=null, anonymous=0, creates=0, enrolls=0, sessionChanges=0, uploads=0;
let activeStorage,candidateStorage,activeOptions,candidateOptions,failSetting,holdInitialization,beforeSetting;
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
    if(method==='storage.report.delete'){for(const id of p.ids)records.delete(id);return true;}
    if(method==='storage.cloudDelete.list')return [...jobs.values()].filter(j=>j.scope===p.scope);
    if(method==='storage.cloudDelete.ack')return jobs.delete(p.scope+'/'+p.record_id);
    if(method==='storage.report.deleteSynced'){for(const id of p.ids){records.delete(id);jobs.set(p.scope+'/'+id,{scope:p.scope,record_id:id})}return true;}
    throw new Error('Unexpected native method '+method);
  }}));
mock.module('./src/lib/native-storage.ts',()=>({hydrateNativeRecord:async row=>row,subscribeStorageChange:()=>()=>{},notifyStorageChange(){},
  importNativeRecords:async rows=>{let count=0;for(const row of rows){if(!records.has(row.id)){records.set(row.id,row);count++}}return count}}));
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
}}, storage:{from:()=>({upload:async()=>{uploads++;return{}},download:async()=>({data:photo}),remove:async()=>({})})},
  rpc:async(name,p)=>{
    if(name==='begin_android_backup_report'){const key=p.p_manifest.owner_id+'/'+p.p_manifest.record_id;const row=manifests.get(key)||p.p_manifest;manifests.set(key,row);return{data:row}};
    if(name==='complete_android_backup_report'){manifests.get(user.id+'/'+p.p_record_id).completed=true;return{data:true}};
    if(name==='delete_android_backup_report'){manifests.delete(user.id+'/'+p.p_record_id);return{data:true}};
    throw new Error('Unexpected RPC');
  },
  from:()=>{const filters={};const query={select:()=>query,eq:(k,v)=>{filters[k]=v;return query},order:()=>query,
    range:async(start,end)=>({data:[...manifests.values()].filter(row=>row.owner_id===filters.owner_id).slice(start,end+1)}),
    maybeSingle:async()=>({data:manifests.get(filters.owner_id+'/'+filters.record_id)??null})};return query;}
};
const candidate={...active,auth:{...active.auth,
  signInWithPassword:async({email,password})=>{
    if(password!=='A'.repeat(43))return{data:{session:null},error:{code:'invalid_credentials'}};
    candidateUser={id:email.startsWith(other)?other:owner,email,is_anonymous:false,app_metadata:{android_backup_vault:true}};
    const staged={access_token:'verified',refresh_token:'verified-refresh',user:candidateUser};
    await candidateStorage.setItem('ignored',JSON.stringify(staged));
    return{data:{session:staged}};
  },getUser:async()=>({data:{user:candidateUser}}),stopAutoRefresh(){},dispose:async()=>{},
}};
mock.module('@supabase/supabase-js',()=>({createClient:(_url,_key,options)=>{
  if(options.auth.storageKey.includes(':candidate:')){candidateStorage=options.auth.storage;candidateOptions=options;return candidate;}
  activeStorage=options.auth.storage;activeOptions=options;return active;
}}));
const cloud=await import('./src/lib/cloud-backup.ts');
const {prepareBackupRow}=await import('./src/lib/cloud-backup-format.ts');
`;

test("Debug APK uploads anonymously without a recovery code, then keeps the same owner when creating one", () => {
  run(`
    assert.equal((await cloud.backupPreferences()).enabled,true);
    assert.equal(await cloud.backUpScans(),1);
    assert.equal(anonymous,1);assert.equal(enrolls,1);assert.equal(creates,0);
    assert.equal((await cloud.backupPreferences()).hasCode,false);
    const uploaded=[...manifests.values()][0];assert.equal(uploaded.owner_id,owner);
    const code=await cloud.createBackupVault();assert.ok(code.startsWith('MLB1.'+owner+'.'));
    assert.equal(user.id,owner);assert.equal(anonymous,1);assert.equal(creates,1);
    assert.equal(await cloud.savedRecoveryCode(),code);
    assert.equal(uploaded.owner_id,user.id);
  `);
});

test("wrong recovery credentials preserve the connected session; valid recovery merges five reports with the new local report", () => {
  run(`
    await cloud.backUpScans();const before=session;
    await assert.rejects(cloud.restoreCloudBackup('MLB1.'+other+'.'+'B'.repeat(43)));
    assert.equal(session,before);assert.equal(sessionChanges,0);assert.equal(user.id,owner);
    for(let i=4;i<=8;i++){
      const row=await prepareBackupRow(other,report(String(i).repeat(8)+'-4444-4444-8444-444444444444','2026-10-19T00:00:00.000Z'));
      row.completed=true;manifests.set(other+'/'+row.record_id,row);
    }
    assert.equal(await cloud.restoreCloudBackup('MLB1.'+other+'.'+'A'.repeat(43)),5);
    assert.equal(records.size,6);assert.equal(records.get(local.id),local);
    assert.equal(user.id,other);assert.equal(await cloud.restoreCloudBackup(),0);
    assert.equal([...records.values()].filter(r=>r.updated_at==='2026-10-19T00:00:00.000Z').length,5);
  `);
});

test("anonymous-owner History deletion removes only its own backup before any recovery code exists", () => {
  run(`
    await cloud.backUpScans();
    const {deleteScansWithCloudQueue}=await import('./src/lib/cloud-history-delete.ts');
    await deleteScansWithCloudQueue([local.id]);assert.equal(jobs.size,1);
    assert.equal([...jobs.values()][0].scope,project+':'+owner);
    await cloud.backUpScans();assert.equal(jobs.size,0);assert.equal(manifests.size,0);
    assert.equal(anonymous,1);assert.equal(creates,0);
  `);
});

test("Production APK starts automatic backup, waits offline and keeps the anonymous owner when creating recovery", () => {
  run(
    `
    settings.set('backup-enabled:'+project,'false');
    assert.equal((await cloud.backupPreferences()).enabled,true);
    records.clear();await cloud.backUpScans();assert.equal(anonymous,0);assert.equal(enrolls,0);
    records.set(local.id,{...local,_status:'pending-delete'});await cloud.backUpScans();assert.equal(anonymous,0);
    records.set(local.id,local);online=false;await cloud.backUpScans();assert.equal(uploads,0);assert.equal(anonymous,0);
    online=true;assert.equal(await cloud.backUpScans(),1);assert.equal(anonymous,1);assert.equal(enrolls,1);
    assert.equal((await cloud.backupPreferences()).hasCode,false);
    const code=await cloud.createBackupVault();assert.equal(user.id,owner);assert.equal(anonymous,1);
    assert.equal(await cloud.savedRecoveryCode(),code);assert.equal((await cloud.backupPreferences()).enabled,true);
    assert.ok([...settings.keys()].every(key=>key.endsWith(':'+project)));
  `,
    true,
  );
});

test("Production automatic backup preserves explicit pauses and refuses to silently replace a lost owner session", () => {
  run(
    `
    await cloud.setBackupEnabled(false);assert.equal(settings.get('backup-enabled:'+project),'paused');
    assert.equal((await cloud.backupPreferences()).enabled,false);await cloud.backUpScans();assert.equal(anonymous,0);
    await cloud.setBackupEnabled(true);await cloud.backUpScans();assert.equal(anonymous,1);
    session=null;await assert.rejects(cloud.backUpScans(),/existing backup owner/);assert.equal(anonymous,1);
  `,
    true,
  );
});

test("a missing session reconnects its saved recovery code and continues with the promoted client", () => {
  run(`
    await cloud.backUpScans();
    const code='MLB1.'+owner+'.'+'A'.repeat(43);settings.set('backup-recovery-code:'+project,code);
    const next=report('44444444-4444-4444-8444-444444444444');records.set(next.id,next);
    session=null;settings.delete('supabase-backup-session:'+project);
    let retired=false;const getUser=active.auth.getUser;
    active.auth.dispose=async()=>{retired=true};
    active.auth.getUser=async()=>{assert.equal(retired,false,'must use the promoted Auth client');return getUser()};
    assert.equal(await cloud.backUpScans(),1);assert.equal(retired,true);
    assert.equal(anonymous,1);assert.equal(creates,0);assert.equal(user.id,owner);
    assert.equal(manifests.get(owner+'/'+next.id).completed,true);
    assert.equal(await cloud.savedRecoveryCode(),code);
  `);
});

test("Production wrong-code recovery preserves its current owner and valid recovery merges local reports", () => {
  run(
    `
    await cloud.backUpScans();const before=session;
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

test("recovery-code creation and reconnection preserve an explicit upload pause in both APK variants", () => {
  for (const production of [false, true])
    run(
      `
    await cloud.backUpScans();await cloud.setBackupEnabled(false);
    const code=await cloud.createBackupVault();assert.equal((await cloud.backupPreferences()).enabled,false);
    await cloud.restoreCloudBackup(code);assert.equal((await cloud.backupPreferences()).enabled,false);
    await cloud.setBackupEnabled(true);assert.equal((await cloud.backupPreferences()).enabled,true);
  `,
      production,
    );
});

// Backgrounding must allow an in-flight photo/commit to settle, then yield before the next report.
test("automatic backup finishes its current photo but waits for foreground before the next report", () => {
  run(`
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
    await cloud.backUpScans();
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
    await cloud.backUpScans();const before=session;
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
    await cloud.backUpScans();assert.equal(jobs.size,0);assert.equal(manifests.size,0);
    await cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));assert.equal(user.id,other);
  `);
});

test("deletion during first anonymous sign-in cannot upload the removed in-memory report", () => {
  run(`
    const queue=await import('./src/lib/cloud-history-delete.ts');
    const signIn=active.auth.signInAnonymously;
    active.auth.signInAnonymously=async()=>{const result=await signIn();await queue.deleteScansWithCloudQueue([local.id]);return result};
    assert.equal(await cloud.backUpScans(),0);
    assert.equal(records.size,0);assert.equal(jobs.size,0);assert.equal(manifests.size,0);assert.equal(uploads,0);
  `);
});

test("candidate verification uses memory only and leaves local History deletion available", () => {
  run(`
    await cloud.backUpScans();const before=settings.get('supabase-backup-session:'+project);
    const queue=await import('./src/lib/cloud-history-delete.ts');
    const getUser=candidate.auth.getUser;let release;
    candidate.auth.getUser=async()=>{await new Promise(resolve=>{release=resolve});return getUser()};
    const connecting=cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43));
    for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve));
    assert.equal(typeof release,'function');assert.equal(settings.get('supabase-backup-session:'+project),before);
    assert.equal(settings.get('backup-owner:'+project),owner);assert.equal(settings.has('backup-recovery-code:'+project),false);
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
    await cloud.backUpScans();const retired=activeStorage;let release;
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
    await cloud.backUpScans();const retired=activeStorage;let release;
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
    await cloud.backUpScans();const before=settings.get('supabase-backup-session:'+project);
    candidate.auth.getUser=async()=>({data:{user:{...candidateUser,app_metadata:{}}}});
    await assert.rejects(cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43)),/verified/);
    assert.equal(settings.get('supabase-backup-session:'+project),before);assert.equal(user.id,owner);
    await candidateStorage.setItem('ignored',JSON.stringify({access_token:'failed-candidate'}));await candidateStorage.removeItem('ignored');
    assert.equal(settings.get('supabase-backup-session:'+project),before);
    assert.equal(settings.get('backup-owner:'+project),owner);assert.equal(settings.has('backup-recovery-code:'+project),false);
  `);
});

test("a failed local promotion restores prior credentials and keeps the prior session adapter usable", () => {
  run(`
    await cloud.backUpScans();const before=settings.get('supabase-backup-session:'+project);const previous=activeStorage;
    failSetting='supabase-backup-session:'+project;
    await assert.rejects(cloud.connectBackupVault('MLB1.'+other+'.'+'A'.repeat(43)),/persistence failure/);
    assert.equal(settings.get('supabase-backup-session:'+project),before);assert.equal(user.id,owner);
    assert.equal(settings.get('backup-owner:'+project),owner);assert.equal(settings.has('backup-recovery-code:'+project),false);
    await candidateStorage.setItem('ignored',JSON.stringify({access_token:'failed-promotion'}));
    assert.equal(settings.get('supabase-backup-session:'+project),before);
    await previous.setItem('ignored',JSON.stringify({...session,access_token:'refreshed-original-owner'}));
    assert.equal(JSON.parse(settings.get('supabase-backup-session:'+project)).access_token,'refreshed-original-owner');
  `);
});

test("a settling original-owner refresh is retained when candidate promotion rolls back", () => {
  run(`
    await cloud.backUpScans();const previous=activeStorage;const original={...session};
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
    assert.equal(settings.has('backup-recovery-code:'+project),false);
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

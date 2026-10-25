import { expect, test } from "bun:test";

// Fresh workers isolate native ports, lifecycle and time. Every HTTP request is forbidden.
function run(check) {
  const result = Bun.spawnSync([process.execPath, "--eval", fixture + check], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NEXT_PUBLIC_CLOUD_ENVIRONMENT: "production" },
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}

const fixture = String.raw`
import assert from 'node:assert/strict';import {mock} from 'bun:test';
globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
globalThis.fetch=()=>{throw new Error('No HTTP is allowed')};
let android=true,online=true,idle=true,capable=true,environment='production',host='0.1.8',wake;
let phase='downloading',downloaded=0,total=100,heldMethod,hold,badReply,attempt;
const calls=[],states=[],timers=new Map();let timerId=0,now=1;Date.now=()=>now;
globalThis.setTimeout=fn=>{timers.set(++timerId,fn);return timerId};globalThis.clearTimeout=id=>timers.delete(id);
const tick=async()=>{for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve))};
const fire=async()=>{const first=[...timers][0];assert.ok(first,'expected scheduled native poll');timers.delete(first[0]);first[1]();await tick()};
const snapshot=id=>({id,version:'0.1.9',status:phase,downloaded,total,...badReply});
mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>android,connectionHint:()=>online,
 initializeNativeRuntime:async()=>({cloudEnvironment:environment,apkUpdateSupported:capable,hostVersionName:host}),
 subscribeConnection:fn=>{wake=fn;return()=>{wake=undefined}},
 nativeRequest:async(method,payload)=>{calls.push({method,payload});
  if(method==='apkUpdate.start'){attempt=payload.id;const reply=snapshot(payload.id);if(method===heldMethod)await hold;return reply}
  if(method===heldMethod)await hold;
  assert.equal(payload.id,attempt);
  if(method==='apkUpdate.status')return snapshot(payload.id);
  if(method==='apkUpdate.install'){phase='installing';return snapshot(payload.id)}
  if(method==='apkUpdate.cancel')return{...snapshot(payload.id),status:'cancelled'};
  throw new Error('Unexpected native method');}
}));
const {createAndroidApkInstaller}=await import('./src/lib/android-apk-install.ts');
const controller=createAndroidApkInstaller(value=>states.push(value),()=>idle);
const offer={tag:'v0.12.0',version:'0.1.9'};
const count=method=>calls.filter(c=>c.method===method).length;
const last=()=>states.at(-1);
`;

test("one Update Now starts native download by ID/tag/version and automatically hands a verified APK to Android once", () => {
  run(`await controller.start({...offer,href:'https://untrusted.example/file.apk'});
    assert.equal(last().status,'downloading');assert.equal(count('apkUpdate.start'),1);
    assert.deepEqual(Object.keys(calls[0].payload).sort(),['id','tag','version']);
    assert.match(attempt,/^[0-9a-f-]{36}$/);downloaded=40;await fire();assert.equal(last().downloaded,40);
    phase='verifying';downloaded=100;await fire();assert.equal(last().status,'verifying');assert.equal(count('apkUpdate.install'),0);
    phase='ready';await fire();assert.equal(last().status,'installing');assert.equal(count('apkUpdate.install'),1);
    await fire();assert.equal(count('apkUpdate.install'),1);assert.equal(controller.isInstalling(),true);
    phase='cancelled';await fire();assert.equal(last().status,'cancelled');assert.equal(timers.size,0);controller.dispose();`);
});

test("X cancels the same in-flight attempt; a delayed start reply cannot revive it or install anything", () => {
  run(`let settle;heldMethod='apkUpdate.start';hold=new Promise(resolve=>settle=resolve);
    const pending=controller.start(offer);await tick();await controller.start(offer);assert.equal(count('apkUpdate.start'),1);
    controller.cancel();assert.equal(last().status,'cancelled');assert.equal(count('apkUpdate.cancel'),1);
    settle();await pending;await tick();assert.equal(last().status,'cancelled');assert.equal(count('apkUpdate.install'),0);
    assert.equal(timers.size,0);controller.dispose();`);
});

test("network failure, real backgrounding and caller deadline abort pre-install work without installation", () => {
  for (const trigger of [
    "online=false;wake();",
    "document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));",
    "now+=16*60_000;await fire();",
  ])
    run(`await controller.start(offer);${trigger}await tick();assert.ok(['failed','cancelled'].includes(last().status));
    assert.equal(count('apkUpdate.cancel'),1);assert.equal(count('apkUpdate.install'),0);assert.equal(timers.size,0);controller.dispose();`);
});

test("Debug, browsers, unsupported hosts, invalid releases and unavailable foreground never start a native download", () => {
  for (const change of [
    "android=false",
    "process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT='testing'",
    "environment='testing'",
    "capable=false",
    "host='0.1.8-dev'",
    "host='0.1.9'",
    "offer.tag='https://other.example/a.apk'",
    "offer.tag='../secret'",
    "offer.version='0.1.9-dev'",
    "idle=false",
    "online=false",
    "document.visibilityState='hidden'",
  ])
    run(
      `${change};await controller.start(offer);assert.equal(last().status,'failed');assert.equal(calls.length,0);controller.dispose();`,
    );
});

test("a ready APK waits for actual idle work; partial or mismatched native acknowledgments fail closed", () => {
  run(`await controller.start(offer);phase='ready';downloaded=100;idle=false;await fire();assert.equal(last().status,'ready');
    assert.equal(count('apkUpdate.install'),0);idle=true;await fire();assert.equal(count('apkUpdate.install'),1);controller.dispose();`);
  for (const corrupt of [
    "badReply={id:'other-attempt'}",
    "badReply={version:'0.2.0'}",
    "total=129*1024*1024",
    "downloaded=101",
    "phase='ready';downloaded=50",
    "phase='installing'",
    "phase='installed'",
  ])
    run(
      `await controller.start(offer);${corrupt};await fire();assert.equal(last().status,'failed');assert.equal(count('apkUpdate.install'),0);controller.dispose();`,
    );
});

test("permission/installer handoff survives expected hidden/offline events and Cancel never reports completion", () => {
  run(`await controller.start(offer);phase='ready';downloaded=100;await fire();
    document.visibilityState='hidden';online=false;document.dispatchEvent(new Event('visibilitychange'));wake();await tick();
    assert.equal(count('apkUpdate.cancel'),0);assert.equal(last().status,'installing');
    online=true;document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));phase='cancelled';await fire();
    assert.equal(last().status,'cancelled');assert.equal(count('apkUpdate.start'),1);assert.equal(count('apkUpdate.install'),1);controller.dispose();`);
});

test("foreground wakes do not overlap a pending native poll and disposal suppresses late results", () => {
  run(`await controller.start(offer);let settle;heldMethod='apkUpdate.status';hold=new Promise(resolve=>settle=resolve);
    await fire();assert.equal(count('apkUpdate.status'),1);wake();await fire();assert.equal(count('apkUpdate.status'),1);
    const previous=states.length;controller.dispose();settle();await tick();assert.equal(states.length,previous);
    assert.equal(count('apkUpdate.cancel'),1);assert.equal(timers.size,0);`);
});

test("an explicit retry gets a fresh operation ID after failure; native-only errors never become user text", () => {
  run(`await controller.start(offer);const old=attempt;phase='failed';badReply={error:'untrusted private raw native details'};await fire();
    assert.equal(last().status,'failed');assert.equal(last().error,undefined);controller.dismiss();assert.equal(last(),null);
    badReply=undefined;phase='downloading';await controller.start(offer);assert.notEqual(attempt,old);assert.equal(count('apkUpdate.start'),2);controller.cancel();controller.dispose();`);
});

test("a cancelled attempt's late acknowledgment cannot remove its replacement's polling timer", () => {
  run(`let settle;heldMethod='apkUpdate.start';hold=new Promise(resolve=>settle=resolve);
    const old=controller.start(offer);await tick();const oldId=attempt;controller.cancel();heldMethod=undefined;
    await controller.start(offer);const replacement=attempt;assert.notEqual(replacement,oldId);assert.equal(timers.size,1);
    settle();await old;await tick();assert.equal(timers.size,1);assert.equal(last().id,replacement);
    phase='ready';downloaded=100;await fire();assert.equal(last().status,'installing');assert.equal(count('apkUpdate.install'),1);controller.dispose();`);
});

test("only a completed native installation ends the accepted handoff without retry or restart", () => {
  run(`await controller.start(offer);phase='ready';downloaded=100;await fire();assert.equal(last().status,'installing');
    phase='installed';await fire();assert.equal(last().status,'installed');assert.equal(timers.size,0);
    assert.equal(count('apkUpdate.install'),1);assert.equal(count('apkUpdate.cancel'),0);controller.dismiss();assert.equal(last(),null);controller.dispose();`);
});

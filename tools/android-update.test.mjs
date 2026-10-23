import { expect, test } from "bun:test";

// Fresh workers isolate visibility, native replies and timers. No Android or cloud connection is made.
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
globalThis.fetch=()=>{throw new Error('No network is allowed')};
globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
let status='checking',idle=true,online=true,android=true,wake,checks=0,reads=0,offers=0,restart=false,pendingReply;
const timers=new Map();let id=0;
globalThis.setTimeout=fn=>{timers.set(++id,fn);return id};globalThis.clearTimeout=id=>timers.delete(id);
const tick=async()=>{for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve))};
const fire=async()=>{const item=[...timers.entries()][0];assert.ok(item);timers.delete(item[0]);await item[1]();await tick()};
mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>android,connectionHint:()=>online,
  initializeNativeRuntime:async()=>({updateRestartSupported:true}),subscribeConnection:fn=>{wake=fn;return()=>{wake=undefined}},
  nativeRequest:async method=>{if(method==='ota.check'){checks++;return true}assert.equal(method,'ota.status');reads++;if(pendingReply)await pendingReply;return{status}}
}));
const {watchAndroidUpdate}=await import('./src/lib/android-update.ts');
const observe=()=>watchAndroidUpdate(value=>{offers++;restart=value},()=>idle);
`;

test("update offer waits for verified staged status and coalesces automatic checks", () => {
  run(`const stop=observe();await tick();assert.equal(offers,0);assert.equal(checks,1);
    for(const value of ['downloading','verifying','check-failed','up-to-date']){status=value;await fire();assert.equal(offers,0)}
    assert.equal(checks,1);status='staged';await fire();assert.equal(offers,1);assert.equal(restart,true);
    assert.equal(timers.size,0);wake();await tick();assert.equal(offers,1);stop();assert.equal(wake,undefined);`);
});

test("camera/recovery, background and offline states defer the offer without requiring a network to apply staged files", () => {
  run(`idle=false;status='staged';const stop=observe();await tick();assert.equal(reads,0);
    idle=true;document.visibilityState='hidden';await fire();assert.equal(reads,0);
    document.visibilityState='visible';online=false;document.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(offers,1);assert.equal(checks,0);stop();`);
});

test("a scan starting during a native reply defers presentation and cleanup ignores late replies", () => {
  run(`let settle;pendingReply=new Promise(resolve=>settle=resolve);status='staged';const stop=observe();await tick();
    idle=false;settle();await tick();assert.equal(offers,0);pendingReply=undefined;idle=true;await fire();assert.equal(offers,1);stop();
    let later;pendingReply=new Promise(resolve=>later=resolve);const close=observe();await tick();close();later();await tick();assert.equal(offers,1);assert.equal(timers.size,0);`);
});

test("Debug disabled status and website runtime never trigger an update modal", () => {
  run(`status='disabled';const stop=observe();await tick();assert.equal(offers,0);assert.equal(checks,0);assert.equal(timers.size,0);
    wake();await tick();assert.equal(reads,1);stop();android=false;const close=observe();await tick();assert.equal(reads,1);close();`);
});

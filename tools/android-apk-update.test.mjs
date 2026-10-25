import { expect, test } from "bun:test";
import { isNewerAndroidApk } from "../src/lib/android-version.mjs";

// Each worker owns its bridge, clock and HTTP fixture. Public GitHub discovery never reaches the network.
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
let android=true,idle=true,online=true,environment='production',supported=true,version='0.1.8',wake,reads=0,requests=0,offers=[],hold,signal;
let now=1;Date.now=()=>now;
const timers=new Map();let counter=0;
globalThis.setTimeout=(fn,delay)=>{timers.set(++counter,{fn,delay});return counter};globalThis.clearTimeout=id=>timers.delete(id);
const tick=async()=>{for(let i=0;i<15;i++)await new Promise(resolve=>setImmediate(resolve))};
const fire=async()=>{const [id,item]=[...timers.entries()].find(([,v])=>v.delay===15000);timers.delete(id);await item.fn();await tick()};
let release={draft:false,prerelease:false,published_at:'2026-10-25T00:38:55Z',tag_name:'v0.12.0',
 html_url:'https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v0.12.0',assets:[{name:'mangoleaf-ai.apk',state:'uploaded',size:100,
 content_type:'application/vnd.android.package-archive',label:'Android APK v0.1.9',
 browser_download_url:'https://github.com/RANDAAAALL/mangoleaf-ai/releases/download/v0.12.0/mangoleaf-ai.apk'}]};
globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.github.com/repos/RANDAAAALL/mangoleaf-ai/releases/latest');
 assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');requests++;signal=options.signal;
 if(hold)await hold;return new Response(JSON.stringify(release),{headers:{'Content-Type':'application/json'}})};
mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>android,connectionHint:()=>online,
 initializeNativeRuntime:async()=>{reads++;return{cloudEnvironment:environment,apkUpdateSupported:supported,hostVersionName:version}},
 subscribeConnection:fn=>{wake=fn;return()=>{wake=undefined}},nativeRequest:()=>{throw new Error('No installer or OTA bridge command expected')}}));
const {watchAndroidApkUpdate}=await import('./src/lib/android-update.ts');
const observe=()=>watchAndroidApkUpdate(value=>offers.push(value),()=>idle);
`;

test("native version comparison rejects Debug/invalid versions and compares numeric components exactly", () => {
  expect(isNewerAndroidApk("0.1.9", "0.1.8")).toBe(true);
  expect(isNewerAndroidApk("0.10.0", "0.9.99")).toBe(true);
  expect(
    isNewerAndroidApk("9007199254740993.0.0", "9007199254740992.0.0"),
  ).toBe(true);
  for (const [available, installed] of [
    ["0.1.8", "0.1.8"],
    ["0.1.7", "0.1.8"],
    ["0.1.9-dev", "0.1.8"],
    ["0.1.9", "0.1.8-dev"],
    ["v0.1.9", "0.1.8"],
    ["0.1.9", undefined],
  ])
    expect(isNewerAndroidApk(available, installed)).toBe(false);
});

test("a newer labelled native APK offers its validated tag and version without a download URL", () => {
  run(`const stop=observe();await tick();assert.equal(requests,1);assert.deepEqual(offers,[{tag:'v0.12.0',version:'0.1.9'}]);
    assert.equal(timers.size,0);wake();await tick();assert.equal(offers.length,1);stop();assert.equal(wake,undefined);`);
});

test("unlabelled, Debug, malformed, equal, older and unverified release assets never offer an APK update", () => {
  for (const label of [
    undefined,
    "Android APK v0.1.9-dev",
    "v0.1.9",
    "Android APK v0.1.8",
    "Android APK v0.1.7",
  ])
    run(
      `release.assets[0].label=${JSON.stringify(label) ?? "undefined"};const stop=observe();await tick();assert.equal(offers.length,0);stop();`,
    );
  for (const change of [
    "release.draft=true",
    "release.prerelease=true",
    "release.assets[0].browser_download_url='https://other.example/app.apk'",
  ])
    run(
      `${change};const stop=observe();await tick();assert.equal(offers.length,0);stop();`,
    );
});

test("websites and Debug/testing never request a production installer", () => {
  for (const change of [
    "android=false",
    "process.env.NEXT_PUBLIC_CLOUD_ENVIRONMENT='testing'",
    "environment='testing'",
    "supported=false",
    "version='0.1.8-dev'",
  ])
    run(
      `${change};const stop=observe();await tick();assert.equal(requests,0);assert.equal(offers.length,0);stop();`,
    );
});

test("busy work delays discovery and a scan starting during discovery delays presentation", () => {
  run(`idle=false;const stop=observe();await tick();assert.equal(requests,0);let settle;hold=new Promise(resolve=>settle=resolve);
    idle=true;wake();await tick();assert.equal(requests,1);idle=false;settle();await tick();assert.equal(offers.length,0);
    idle=true;hold=undefined;await fire();assert.equal(offers.length,1);assert.equal(requests,1);stop();`);
});

test("backgrounding and disposal abort discovery and ignore late HTTP replies", () => {
  for (const close of [false, true])
    run(`let settle;hold=new Promise(resolve=>settle=resolve);const stop=observe();await tick();assert.equal(requests,1);
      ${close ? "stop();" : "document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));"}
      assert.equal(signal.aborted,true);settle();await tick();assert.equal(offers.length,0);assert.equal(timers.size,0);stop();`);
});

test("offline state makes no request and equal releases are throttled across idle ticks", () => {
  run(`online=false;release.assets[0].label='Android APK v0.1.8';const stop=observe();await tick();assert.equal(requests,0);
    online=true;wake();await tick();assert.equal(requests,1);await fire();assert.equal(requests,1);
    now+=15*60_000;await fire();assert.equal(requests,2);assert.equal(offers.length,0);stop();`);
});

test("an already verified offer waits until the connection returns before presentation", () => {
  run(`let settle;hold=new Promise(resolve=>settle=resolve);const stop=observe();await tick();assert.equal(requests,1);
    online=false;settle();await tick();assert.equal(offers.length,0);hold=undefined;await fire();assert.equal(offers.length,0);
    online=true;wake();await tick();assert.equal(offers.length,1);assert.equal(requests,1);stop();`);
});

import { expect, test } from "bun:test";

// Fresh processes isolate the cache clock/storage; requests are local Response fixtures only.
function run(source) {
  const result = Bun.spawnSync([process.execPath, "--eval", fixture + source], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}
const fixture = String.raw`
import assert from 'node:assert/strict';
let now=1_000_000,requests=0,status=200,stored=null;
Date.now=()=>now;
globalThis.sessionStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value}};
const metadata={draft:false,prerelease:false,published_at:'2026-11-01T00:00:00Z',tag_name:'v9.8.7',
 html_url:'https://github.com/RANDAAAALL/mangoleaf-ai/releases/tag/v9.8.7',assets:[{name:'mangoleaf-ai.apk',state:'uploaded',size:100,
 content_type:'application/octet-stream',label:'Android APK v0.1.10',browser_download_url:'https://github.com/RANDAAAALL/mangoleaf-ai/releases/download/v9.8.7/mangoleaf-ai.apk'}]};
globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify(metadata),{status,headers:{'Content-Type':'application/json'}})};
const {loadCachedAndroidRelease:load,readCachedAndroidRelease:read}=await import('./src/lib/android-release-cache.ts');
`;

test("availability shares concurrent requests and expires successful public metadata after five minutes", () => {
  run(`const values=await Promise.all([load(),load(),load()]);assert.equal(requests,1);assert.equal(values[0].apkVersion,'0.1.10');
    assert.equal(read().release.tag,'v9.8.7');await load();assert.equal(requests,1);now+=300001;await load();assert.equal(requests,2);`);
});

test("rate-limit failures back off for thirty seconds and recover without losing the release policy", () => {
  run(`status=429;assert.equal(await load(),null);await load();assert.equal(requests,1);
    now+=30001;status=200;assert.equal((await load()).tag,'v9.8.7');assert.equal(requests,2);`);
});

test("session cache rejects injected origins, invalid versions, oversized data and invalid expiry", () => {
  for (const change of [
    "release.downloadUrl='https://other.invalid/app.apk'",
    "release.apkVersion='0.1.10-dev'",
    "until=now+9999999",
    "until=now-1",
  ])
    run(`let until=now+10000;let release={tag:'v9.8.7',apkVersion:'0.1.10',downloadUrl:metadata.assets[0].browser_download_url};
    ${change};stored=JSON.stringify({until,release});assert.equal(read(),null);await load();assert.equal(requests,1);`);
  run(`stored='x'.repeat(2049);assert.equal(read(),null);`);
});

test("blocked session storage still coalesces requests in memory", () => {
  run(`globalThis.sessionStorage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};
    await load();await load();assert.equal(requests,1);`);
});

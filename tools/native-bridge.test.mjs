import { expect, test } from "bun:test";

// A child process gives each case its own native port, pending-request map and build flag.
function run(source) {
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `import assert from 'node:assert/strict';\n${source}`,
    ],
    {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, NEXT_PUBLIC_APP_TARGET: "android" },
    },
  );
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}

test("native builds reject a missing port or an untrusted page origin", () => {
  run(`
    globalThis.window={location:{origin:'https://untrusted.invalid'},MangoLeafNative:{postMessage(){throw new Error('must not send')}}};
    const bridge=await import('./src/lib/native-bridge.ts');
    await assert.rejects(bridge.nativeRequest('storage.report.list'), {name:'NativeBridgeError'});
    window.location.origin='https://appassets.androidplatform.net'; delete window.MangoLeafNative;
    await assert.rejects(bridge.nativeRequest('storage.report.list'), {name:'NativeBridgeError'});
  `);
});

test("native replies match request IDs and redact raw error messages", () => {
  run(`
    const sent=[]; const port={postMessage(value){sent.push(JSON.parse(value))}};
    globalThis.window={location:{origin:'https://appassets.androidplatform.net'},MangoLeafNative:port};
    const bridge=await import('./src/lib/native-bridge.ts');
    const first=bridge.nativeRequest('one'); const second=bridge.nativeRequest('two');
    port.onmessage({data:'malformed'}); port.onmessage({data:JSON.stringify({id:'unknown',result:'bad'})});
    port.onmessage({data:JSON.stringify({id:sent[1].id,result:2})});
    port.onmessage({data:JSON.stringify({id:sent[0].id,error:{code:'QUOTA_EXCEEDED',message:'secret'}})});
    assert.equal(await second,2);
    await assert.rejects(first,error=>error.name==='QuotaExceededError'&&!error.message.includes('secret'));
  `);
});

test("caller timeout ignores a late reply and leaves the next request usable", () => {
  run(`
    const sent=[]; const port={postMessage(value){sent.push(JSON.parse(value))}};
    globalThis.window={location:{origin:'https://appassets.androidplatform.net'},MangoLeafNative:port};
    const bridge=await import('./src/lib/native-bridge.ts');
    await assert.rejects(bridge.nativeRequest('save',{},5),{name:'NativeBridgeError'});
    port.onmessage({data:JSON.stringify({id:sent[0].id,result:'late'})});
    const next=bridge.nativeRequest('read'); port.onmessage({data:JSON.stringify({id:sent[1].id,result:'ok'})});
    assert.equal(await next,'ok');
  `);
});

test("validated native connectivity replaces browser hints and isolates observers", () => {
  run(`
    const port={postMessage(value){const request=JSON.parse(value);queueMicrotask(()=>port.onmessage({data:JSON.stringify({id:request.id,result:{bridgeVersion:1,schemaVersion:1,connected:true,validated:false}})}))}};
    globalThis.window={location:{origin:'https://appassets.androidplatform.net'},MangoLeafNative:port};
    const bridge=await import('./src/lib/native-bridge.ts');
    let updates=0;bridge.subscribeNativeEvents(()=>{throw new Error('observer')});
    const unsubscribe=bridge.subscribeConnection(()=>updates++);
    await bridge.initializeNativeRuntime(); assert.equal(bridge.connectionHint(),false);
    port.onmessage({data:JSON.stringify({event:'connectivity',payload:{connected:true,validated:true}})});
    assert.equal(bridge.connectionHint(),true); assert.equal(updates,2); unsubscribe();
  `);
});

import { expect, test } from "bun:test";

function run(source) {
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `import assert from 'node:assert/strict';import {mock} from 'bun:test';\n${source}`,
    ],
    { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" },
  );
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}

test("Android diagnostics export waits for native document completion and propagates cancellation", () => {
  run(`
    let finish;let fail;const calls=[];
    mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>true,nativeRequest:(...args)=>{calls.push(args);return new Promise((resolve,reject)=>{finish=resolve;fail=reject})}}));
    const {downloadDiagnosticLog}=await import('./src/lib/diagnostics-export.ts');
    let completed=false;const first=downloadDiagnosticLog('MangoLeafAI diagnostics').then(()=>completed=true);
    await Promise.resolve();assert.equal(completed,false);
    assert.deepEqual(calls[0],['diagnostics.export',{text:'MangoLeafAI diagnostics'},120000]);
    finish(true);await first;assert.equal(completed,true);
    const second=downloadDiagnosticLog('safe technical log');fail(new Error('cancelled'));await assert.rejects(second);
  `);
});

test("browser diagnostics keeps text download, removes link and releases Blob URL", () => {
  run(`
    mock.module('./src/lib/native-bridge.ts',()=>({isAndroidBuild:()=>false,nativeRequest:()=>{throw new Error('must not call native')}}));
    let saved;let removed=false;let revoked=false;let cleanup;
    const link={click(){saved=this.download},remove(){removed=true}};
    globalThis.document={body:{appendChild(value){assert.equal(value,link)}},createElement:()=>link};
    URL.createObjectURL=blob=>{assert.equal(blob.type,'text/plain;charset=utf-8');return 'blob:fixture'};
    URL.revokeObjectURL=value=>{assert.equal(value,'blob:fixture');revoked=true};
    globalThis.setTimeout=fn=>{cleanup=fn};
    const {downloadDiagnosticLog}=await import('./src/lib/diagnostics-export.ts');
    await downloadDiagnosticLog('safe technical log');
    assert.match(saved,/^MangoLeafAI-diagnostics-\\d+\\.txt$/);assert.equal(removed,true);assert.equal(revoked,false);cleanup();assert.equal(revoked,true);
  `);
});

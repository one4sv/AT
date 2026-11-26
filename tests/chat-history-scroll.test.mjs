import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { runInNewContext } from "node:vm";

const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("history waits for touch release and momentum, and abort interrupts waiting", async () => {
    const source = read("src/pages/Chat/utils/historyScrollIdle.ts");
    const exports = {};
    let now = 0, seq = 0;
    const timers = new Map();
    runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
        exports, performance:{now:()=>now},
        window:{setTimeout:(fn,ms)=>{timers.set(++seq,{fn,at:now+ms});return seq;},clearTimeout:id=>timers.delete(id)}
    });
    const advance = ms => {
        const end=now+ms;
        for (;;) {
            const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
            if (!next) break;
            now=next[1].at;timers.delete(next[0]);next[1].fn();
        }
        now=end;
    };
    const el={isConnected:true};
    exports.setHistoryTouching(el,true);
    let done=false;
    const controller=new AbortController();
    const promise=exports.waitForHistoryIdle(el,controller.signal).then(()=>{done=true;});
    advance(600);await Promise.resolve();assert.equal(done,false);
    exports.setHistoryTouching(el,false);
    advance(120);exports.markHistoryScroll(el);
    advance(120);await Promise.resolve();assert.equal(done,false);
    advance(120);await promise;assert.equal(done,true);
    exports.setHistoryTouching(el,true);
    const abort=new AbortController();
    const pending=exports.waitForHistoryIdle(el,abort.signal);
    abort.abort();await pending;assert.equal(timers.size,0);
});

test("prefetch is buffered, skeleton does not contribute to scroll height, documents have compact tiles",()=>{
    const chat=read("src/pages/Chat/Chat.tsx");
    const context=read("src/components/context/ChatContext.tsx");
    const message=read("src/pages/Chat/components/Message.tsx");
    const css=read("src/pages/Chat/scss/message.scss");
    assert.match(chat,/HISTORY_PREFETCH_REMAINING = 50/);
    assert.match(chat,/loadOlderMessages\(signal => waitForHistoryIdle\(el, signal\)\)/);
    assert.match(context,/await beforeInsert\(controller.signal\)/);
    assert.ok(chat.indexOf('className="chatHistoryLoading"')>chat.indexOf("</HistoryViewport>"));
    assert.match(message,/const mediaOnly[^;]*m\.files\.every/);
    assert.match(css,/\.messageFile\.documentFile\s*\{[^}]*width: 104px;[^}]*height: 104px;/);
});

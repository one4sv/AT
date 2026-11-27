import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {parseQuickInput} from "../src/components/ts/utils/quickCreateCommand.ts";
const read = path => readFileSync(new URL("../" + path, import.meta.url),"utf8");
test("every command in help has localized syntax, description, examples and close", () => {
    const commands = ["act","do","todo","set","settings","goal","habit","plan","user","post","group","invite","help"];
    for (const lang of ["ru","en"]) {
        const ui = JSON.parse(read("src/i18n/locales/"+lang+"/common.json")).chatUi;
        assert.ok(ui.quickCommands.close);
        for (const command of commands) {
            const item = ui.commandHelpDetails[command];
            assert.ok(item.syntax.startsWith("/"+command));
            assert.ok(item.body.length > 10);
            assert.ok(item.examples.length);
            for (const example of item.examples) assert.ok(example.startsWith("/"+command));
            if (command==="act" || command==="do" || command==="todo") for (const example of item.examples) {
                const parsed = parseQuickInput(example);
                assert.ok(parsed.draft.name && !parsed.overflow && !parsed.quoted);
                if(command==="do") assert.ok(parsed.draft.date);
            }
        }
        assert.ok(ui.commandHelpDetails.set.examples.includes("/set interface background add"));
        assert.ok(!ui.commandHelpDetails.settings.examples.includes("/settings interface background add"));
    }
    assert.match(read("src/components/modules/CommandHelp.tsx"), /useModalSlider\(page, current \? 2 : 1/);
});


test("command help uses two sliding panels and applies the selected command without sending", () => {
    const help = read("src/components/modules/CommandHelp.tsx");
    const chat = read("src/pages/Chat/components/ChatTa/ChatTextArea.tsx");
    const css = read("src/components/modules/scss/CommandHelp.scss");
    assert.match(help, /blackout\.commandHelp\?\.commands/);
    assert.match(help, /onClick=\{\(\) => setPage\(0\)\}/);
    assert.match(help, /onApply\(current\.label\)/);
    assert.match(help, /inert=\{page !== 0\}/);
    assert.match(help, /inert=\{page !== 1\}/);
    assert.match(css, /transition: transform \.32s cubic-bezier/);
    const handler = chat.slice(chat.indexOf("const openCommandHelp"), chat.indexOf("const chooseShare"));
    assert.match(handler, /setMess\(command \+ \(command === "\/help" \? "" : " "\)\)/);
    assert.match(handler, /routeRef\.current !== sourceRoute/);
    assert.doesNotMatch(handler, /sendMess\(/);
    for (const lang of ["ru","en"]) {
        const ui = JSON.parse(read("src/i18n/locales/"+lang+"/common.json")).chatUi;
        assert.ok(ui.commandHelpApply && ui.commandHelpBack);
    }
});

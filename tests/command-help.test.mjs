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
            if (command==="act" || command==="do") for (const example of item.examples) {
                const parsed = parseQuickInput(example);
                assert.ok(parsed.draft.name && !parsed.overflow && !parsed.quoted);
                if(command==="do") assert.ok(parsed.draft.date);
            }
        }
        assert.ok(ui.commandHelpDetails.set.examples.includes("/set interface background add"));
        assert.ok(!ui.commandHelpDetails.settings.examples.includes("/settings interface background add"));
    }
    assert.match(read("src/components/modules/CommandHelp.tsx"), /aria-expanded=\{open\}/);
});

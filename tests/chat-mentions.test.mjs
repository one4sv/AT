import test from "node:test";
import assert from "node:assert/strict";
import { findMentionToken } from "../src/components/ts/utils/chatMentions.ts";

test("mentions are detected only next to a valid caret token", () => {
    assert.deepEqual(findMentionToken("Привет @iv", 10), {start: 7,end: 10,query:"iv"});
    assert.deepEqual(findMentionToken("(@", 2), {start: 1,end: 2,query:""});
    assert.equal(findMentionToken("mail@host", 9), null);
    assert.equal(findMentionToken("hi @nick world", 13), null);
    assert.equal(findMentionToken("hi @nick", -1), null);
});

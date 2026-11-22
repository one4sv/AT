import assert from "node:assert/strict";
import test from "node:test";
import { parseSMSearchQuery, searchFilters } from "../src/components/ts/utils/globalSearchQuery.ts";

test("all search filters preserve query terms", () => {
    for (const name of searchFilters) {
        const text = "/" + name + " врач";
        assert.deepEqual(parseSMSearchQuery(text), {filter:name,query:"врач"});
    }
    assert.deepEqual(parseSMSearchQuery("врач"), {filter:"every",query:"врач"});
    assert.deepEqual(parseSMSearchQuery("/ms"), {filter:"ms",query:""});
});

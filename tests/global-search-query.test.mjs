import assert from "node:assert/strict";
import test from "node:test";
import { formatSMSearchQuery, parseSMSearchQuery, searchFilters, searchTabFilters, searchTabForFilter } from "../src/components/ts/utils/globalSearchQuery.ts";

test("search filters preserve query terms and keep one owning section", () => {
    for (const name of searchFilters) {
        const text = "/" + name + " врач";
        assert.deepEqual(parseSMSearchQuery(text), {filter:name,query:"врач"});
        assert.ok(searchTabFilters[searchTabForFilter(name)].includes(name));
    }
    assert.deepEqual(parseSMSearchQuery("врач"), {filter:null,query:"врач"});
    assert.deepEqual(parseSMSearchQuery("/ms"), {filter:"ms",query:""});
    assert.deepEqual(parseSMSearchQuery("/"), {filter:null,query:""});
    assert.deepEqual(parseSMSearchQuery("/com врач"), {filter:null,query:""});
    assert.deepEqual(parseSMSearchQuery("/every врач"), {filter:null,query:""});
    assert.equal(formatSMSearchQuery(null,"врач"),"врач");
    assert.equal(formatSMSearchQuery("plan","врач"),"/plan врач");
    assert.equal(new Set(Object.values(searchTabFilters).flat()).size,searchFilters.length);
    assert.deepEqual(searchTabFilters.spots,[]);
});

import assert from "node:assert/strict";
import test from "node:test";
import { formatSMSearchQuery, parseSMSearchQuery, searchFilters, searchTabFilters, searchTabForFilter, searchSourceFilters, searchResultRank } from "../src/components/ts/utils/globalSearchQuery.ts";

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
    assert.equal(searchTabForFilter("user"), "chats");
    assert.equal(searchTabFilters.user.includes("user"), false);
});

test("unfiltered search loads section-specific categories and only expands when typed", () => {
    assert.deepEqual(searchSourceFilters("chats", null, ""), ["user"]);
    assert.deepEqual(searchSourceFilters("chats", null, "врач"), ["user", "ms"]);
    assert.deepEqual(searchSourceFilters("habits", null, ""), ["habit", "plan"]);
    assert.deepEqual(searchSourceFilters("user", null, ""), ["setting"]);
    assert.deepEqual(searchSourceFilters("user", null, "новости"), ["post", "setting"]);
    assert.deepEqual(searchSourceFilters("user", "post", ""), []);
    assert.deepEqual(searchSourceFilters("chats", "group", ""), ["group"]);
});

test("unfiltered search groups contacts and owned entities before other entities", () => {
    for (const [tab, data, expected] of [
        ["chats", [{kind:"ms"}, {kind:"user"}, {kind:"contact"}], ["contact","user","ms"]],
        ["habits", [
            {kind:"plan", mine:false}, {kind:"habit", mine:false},
            {kind:"plan", mine:true}, {kind:"habit", mine:true}
        ], ["habit","plan","habit","plan"]],
        ["user", [{kind:"post", mine:false}, {kind:"post", mine:true}, {kind:"setting"}], ["setting","post","post"]]
    ]) {
        const sorted = data.slice().sort((a,b) => searchResultRank(tab,a)-searchResultRank(tab,b));
        assert.deepEqual(sorted.map(x=>x.kind), expected);
        if (tab === "habits") assert.deepEqual(sorted.map(x=>x.mine), [true,true,false,false]);
        if (tab === "user") assert.deepEqual(sorted.map(x=>x.mine), [undefined,true,false]);
    }
});

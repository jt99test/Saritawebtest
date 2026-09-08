import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/synastry-reading-cache.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const loaded = { exports: {} };
new Function("exports", "module", compiled)(loaded.exports, loaded);
const key = loaded.exports.synastryReadingCacheKey;

// Reproduce the reported sequence: save another reversed partner first, then Julie.
const cache = new Map();
cache.set(key("partner-one", "account-chart", "en", "female", "male"), "other partner reading");
assert.equal(cache.get(key("partner-two", "account-chart", "en", "female", "male")), undefined);
cache.set(key("partner-two", "account-chart", "en", "female", "male"), "Julie's reading");
assert.equal(cache.get(key("partner-two", "account-chart", "en", "female", "male")), "Julie's reading");

const keys = [];
for (const partner of ["partner-one", "partner-two"]) {
  for (const locale of ["es", "en", "it"]) {
    keys.push(key("account-chart", partner, locale, "male", "female"));
    keys.push(key(partner, "account-chart", locale, "female", "male"));
  }
}
assert.equal(new Set(keys).size, 12, "Both partners, all languages and both directions must be isolated");
assert.notEqual(key("a", "b", "en", "female", "male"), key("a", "b", "en", "male", "male"));
assert.equal(key("a", "b"), key("a", "b", "es"));
assert.ok(keys.every((value) => value.startsWith("synastry:v7:")), "Bypass old browser and server entries");
console.log("Synastry cache regression checks passed.");

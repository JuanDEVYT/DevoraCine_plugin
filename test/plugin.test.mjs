import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
const exec = promisify(execFile);

describe("DevoraCine Plugin v1.2.0", () => {
  it("plugin validation passes Kino SDK", async () => {
    const { stdout, stderr } = await exec("node", ["sdk/validate.mjs", ".", "--repo", "JuanDEVYT/DevoraCine_plugin"]);
    const out = (stdout || "") + "\n" + (stderr || "");
    assert.match(out, /✓ Kino would accept this plugin/);
  });

  it("search returns results for 'batman'", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "search", '{"q":"batman"}']);
    const res = JSON.parse(stdout);
    assert.ok(res.items.length > 0, "must find results");
    assert.ok(res.items[0].title, "first result must have title");
  });

  it("home returns hero and rails", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "home"]);
    const res = JSON.parse(stdout);
    assert.ok(Array.isArray(res), "home must return array of rails");
    assert.ok(res.length >= 2, "must have at least 2 rails");
    assert.ok(res[0].items.length > 0, "first rail must have items");
  });

  it("browse paginates movies", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "browse", "peliculas", "1"]);
    const res = JSON.parse(stdout);
    assert.ok(res.items.length > 0, "must have items");
  });

  it("screen returns a Scaffold with appBar and body", async () => {
    const { stdout } = await exec("node", ["sdk/run.mjs", ".", "screen"]);
    const res = JSON.parse(stdout);
    assert.equal(res.type?.toLowerCase(), "scaffold", "must be a Scaffold");
    assert.ok(res.appBar, "must have appBar");
    assert.ok(res.body, "must have body");
  });

  it("source code uses kino.fetch, not bare fetch", async () => {
    const src = await readFile("src/devoracine.js", "utf8");
    assert.match(src, /kino\.fetch/, "must use kino.fetch");
  });

  it("banner appears exactly once per module load", async () => {
    const src = await readFile("src/plugin.js", "utf8");
    const bannerCalls = (src.match(/Creado por JuandreXter/g) || []).length;
    assert.equal(bannerCalls, 1, "banner must appear once");
  });
});

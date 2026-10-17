import test from "node:test";
import assert from "node:assert/strict";
import { equal, digest } from "../apps/api/src/auth/auth.crypto";
test("token comparison rejects non-ASCII byte-length mismatches without throwing", () => {
  assert.equal(equal("a".repeat(64), "ñ".repeat(64)), false);
  assert.equal(equal("ñ".repeat(64), "a".repeat(64)), false);
  assert.equal(equal("same-ascii-token", "same-ascii-token"), true);
  assert.equal(equal("same-ascii-token", "other-token"), false);
});
test("opaque tokens are stored as deterministic hashes rather than raw values", () => {
  assert.equal(digest("test-only-token").length, 64);
  assert.equal(digest("test-only-token"), digest("test-only-token"));
  assert.notEqual(digest("test-only-token"), digest("different-test-token"));
});

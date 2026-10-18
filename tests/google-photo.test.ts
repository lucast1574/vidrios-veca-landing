import test from "node:test";
import assert from "node:assert/strict";
import { googlePhotoUrl } from "../apps/api/src/profile/google-photo";
test("Google avatar URLs accept only HTTPS Google photo hosts without credentials or custom ports", () => {
  assert.equal(
    googlePhotoUrl("https://lh3.googleusercontent.com/a/photo=s256-c"),
    "https://lh3.googleusercontent.com/a/photo=s256-c",
  );
  for (const value of [
    undefined,
    "javascript:alert(1)",
    "data:image/png;base64,a",
    "http://lh3.googleusercontent.com/a",
    "https://lh3.googleusercontent.com.evil.invalid/a",
    "https://evil.invalid/lh3.googleusercontent.com/a",
    "https://user:pass@lh3.googleusercontent.com/a",
    "https://lh3.googleusercontent.com:8443/a",
    "https://127.0.0.1/a",
  ])
    assert.equal(googlePhotoUrl(value), null);
});

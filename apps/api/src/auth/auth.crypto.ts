import { createHash, timingSafeEqual } from "node:crypto";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
/** Compare bytes, including malformed non-ASCII input, without throwing. */
export function equal(left: string, right: string) {
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

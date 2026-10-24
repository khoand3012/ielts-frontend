import { expect, test } from "vitest";
import { safeNext } from "./safe-next";

test("keeps same-site relative paths", () => {
  expect(safeNext("/sessions/1")).toBe("/sessions/1");
  expect(safeNext("/tests?skill=reading")).toBe("/tests?skill=reading");
});

test("rejects anything that could leave the site", () => {
  for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", "", null, undefined]) {
    expect(safeNext(bad)).toBe("/tests");
  }
});

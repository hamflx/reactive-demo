import { assertEquals } from "https://deno.land/std@0.154.0/testing/asserts.ts";
import { collect, Construct, reactive } from "./index.ts";

Deno.test("basic", () => {
  const changes = collect();
  const o = reactive({
    a: 1,
    b: 2,
  }, changes.collector);
  o.a = 3;
  o.b = 4;
  assertEquals(changes.changes(), [
    { before: 1, value: 3, paths: ["a"] },
    { before: 2, value: 4, paths: ["b"] },
  ]);
});

Deno.test("nested", () => {
  const changes = collect();
  const o = reactive({
    a: {
      b: {
        c: {
          value: 3,
        },
      },
    },
  }, changes.collector);
  o.a.b.c.value = 12345;
  assertEquals(changes.changes(), [
    { before: 3, value: 12345, paths: "a.b.c.value".split(".") },
  ]);
});

Deno.test("constructor", () => {
  const changes = collect();
  const A = reactive(
    class AImpl {
      hello = "typescript";
    },
    changes.collector,
  );
  const a = new A();
  a.hello = "rust";

  assertEquals(changes.changes(), [
    { before: "typescript", value: "rust", paths: [Construct, "hello"] },
  ]);
});

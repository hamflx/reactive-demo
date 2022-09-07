const Construct = Symbol("construct");

type Construct = typeof Construct;

type Property = string | symbol | Construct;
type Paths = Property[];

type Collector = (
  paths: Paths,
  value: any,
  before: any,
) => void;

const magicProperties = ["prototype"];

const chain =
  (property: Property, collector: Collector): Collector =>
  (paths, value, before) => collector([property, ...paths], value, before);

const reactive = <T extends object>(
  obj: T,
  collector: Collector,
): T => {
  const proxyObject = new Proxy(obj, {
    construct(target, argArray, newTarget) {
      console.log("==> construct", target);
      const obj = Reflect.construct(target as any, argArray, newTarget);
      if (Object(obj) === obj) {
        return reactive(obj, chain(Construct, collector));
      }
      return obj;
    },
    set(target, property, value, receiver) {
      try {
        collector([property], value, Reflect.get(target, property, receiver));
      } catch (ex) {
        console.warn("user function error", ex);
      }
      return Reflect.set(target, property, value, receiver);
    },
    get(target, property: Property, receiver: any) {
      const value = Reflect.get(target, property, receiver);
      const isMagicProperty = typeof property === "string" &&
        magicProperties.includes(property);
      if (Object(value) === value && !isMagicProperty) {
        return reactive(value, chain(property, collector));
      }
      return value;
    },
  });
  return proxyObject;
};

const collect = () => {
  const changes: Array<{ before: any; value: any; paths: Paths }> = [];
  const collector = (
    paths: Paths,
    value: any,
    before: any,
  ) => {
    changes.push({ value, before, paths });
  };
  return {
    collector,
    changes: () => changes,
  };
};

const changes = collect();
const o = reactive({
  a: {
    b: {
      c: {
        value: 3,
      },
    },
  },
  sss: "3",
  aaa: "some value",
}, changes.collector);

const c = o.a.b.c;
c.value = 5423;
o.aaa = "hello typescript";

const A = reactive(
  class AImpl {
    hello = "typescript";
  },
  changes.collector,
);
const a = new A();
a.hello = "rust";

console.log(changes.changes());

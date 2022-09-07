const reactive = <T extends object>(
  obj: T,
  collector: (paths: Array<string | symbol>, value: any, before: any) => void,
): T => {
  const proxyObject = new Proxy(obj, {
    set(target, property, value, receiver) {
      try {
        collector([property], value, Reflect.get(target, property, receiver));
      } catch (ex) {
        console.warn("user function error", ex);
      }
      return Reflect.set(target, property, value, receiver);
    },
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (Object(value) === value) {
        return reactive(
          value,
          (paths, value, before) =>
            collector([property, ...paths], value, before),
        );
      }
      return value;
    },
  });
  return proxyObject;
};

const collect = () => {
  const changes: Array<{ before: any; value: any; path: string }> = [];
  const collector = (
    paths: Array<string | symbol>,
    value: any,
    before: any,
  ) => {
    changes.push({ value, before, path: paths.join(".") });
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

console.log(changes.changes());

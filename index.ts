export const Construct = Symbol("construct");

export type Construct = typeof Construct;

export type Property = string | symbol | Construct;
export type Paths = Property[];

export type Collector = (
  paths: Paths,
  value: any,
  before: any,
) => void;

export const magicProperties = ["prototype"];

export const chain =
  (property: Property, collector: Collector): Collector =>
  (paths, value, before) => collector([property, ...paths], value, before);

export const reactive = <T extends object>(
  obj: T,
  collector: Collector,
): T => {
  const proxyObject = new Proxy(obj, {
    construct(target, argArray, newTarget) {
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

export const collect = () => {
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

import { useEffect, useMemo, useState } from "react";

type AnnotationsMap<T, V> = {
  [P in Exclude<keyof T, "toString">]?: V;
};

export type UseStoreHook<T> = (disabledUpdate?:boolean) => T

const evener = new EventTarget();
const observableMap:WeakMap<object, Record<PropertyKey, boolean | undefined>> = new WeakMap();
const storeEventMap:WeakMap<object, string> = new WeakMap();
const storeMap:Map<string, any> = new Map()

let timer:any = null;

export function createStore<T extends object>(stores:T, name?:string):{useStore:UseStoreHook<T>, stores:T}{
  const storeSelf:any = stores;
  const allStores:any = {};
  const storeName = getStoreName(name);
  Object.keys(storeSelf).forEach(key =>{
    storeEventMap.set(storeSelf[key], storeName);
    allStores[key] = new Proxy(storeSelf[key], {
      set(target, property, value, reciver){
        if(Reflect.get(target, property, reciver) === value) return true;
        const rel = Reflect.set(target, property, value, reciver);
        if(observableMap.has(target) && observableMap.get(target)![property] === false) return rel;
        if(rel){
          const eventName = storeEventMap.get(target)
          if(eventName){
            emit(`$$fertile_emit_${eventName}`);
          }
        }
        return rel;
      }
    });
  });
  storeMap.set(storeName, allStores);
  return {
    useStore: ((disabledUpdate?:boolean)=>useStore(disabledUpdate, storeName)) as UseStoreHook<T>, 
    stores: 
    allStores
  };
}

export function useCreateLocalStore<T extends object>(stores:T, name:string){
  return useMemo(() => {
		const rel =
			getStore<T>(name) ??
			createLocalStore(stores, name);
		return {
			...rel,
			destroyStore: removeStore.bind(null, name),
		};
	}, [name]);
}

export function removeStore(name:string | "default"){
  storeMap.delete(name);
}

export function hasStore(name:string | "default"){
  return storeMap.has(name);
}

/**
 * 返回指定名称的store
 * @param name 默认 "default"
 * @returns 
 */
export function getStore<T extends object>(name:string | "default"):{useStore:UseStoreHook<T>, stores:T} | undefined{
  if(hasStore(name)){
    const stores = storeMap.get(name);
    return {useStore: ((disabledUpdate?:boolean)=>useStore(disabledUpdate, name)) as UseStoreHook<T>, stores: stores}
  }
}

// 可以指定那些属性不触发更新
export function makeObservable<T extends object>(target:T, overrides: AnnotationsMap<T, boolean> ){
  observableMap.set(target, overrides);
}

function useStore<T=any>(disabledUpdate?:boolean, name?:string):T{
  const [, setForceUpdate] = useState({});
  useEffect(()=>{
    const eventName = `$$fertile_emit_${getStoreName(name)}`
    // disabledUpdate为ture时就不会触发组件更新，适合只调用了store方法但没用store值的组件
    if(!disabledUpdate){
      const callback = ()=>{setForceUpdate({})}
      evener.addEventListener(eventName, callback);
      return ()=>{
        evener.removeEventListener(eventName, callback);
      }
    }
  }, [])

  return storeMap.get(getStoreName(name));
}

function getStoreName(name?:string){
  return name || "default"
}

function emit(event:string){
  if(timer){
    clearTimeout(timer);
  }
  timer = setTimeout(dispatch, 0, event);
}

function dispatch(event:string){
  evener.dispatchEvent(new Event(event));
}

function createLocalStore<T extends object>(stores:T, name:string){
  return createStore(stores, name)
}
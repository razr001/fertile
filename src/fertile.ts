import { useCallback, useEffect, useMemo, useState } from "react";

type AnnotationsMap<T, V> = {
  [P in Exclude<keyof T, "toString">]?: V;
};

export type StoreName = string | symbol;
export type Property = string | symbol;
export type StoreEffectCallback = (()=>any);
export type DesMap = Map<Property, Set<StoreEffectCallback>>;
export type ReactiveObject = object;

export type UseStoreHook<T> = (disabledUpdate?:boolean) => T

// 不需要响应的值
const observableMap:WeakMap<ReactiveObject, Record<PropertyKey, boolean | undefined>> = new WeakMap();
// 多个store，通过名称关联
const storeMap:Map<StoreName, any> = new Map();
// 响应数据时对应执行所有更新函数
const storeEffectMap:WeakMap<ReactiveObject, DesMap> = new WeakMap();
// 更新函数对应响应对象，主要用于更新函数销毁,并对storeEffectMap的相关数据进行删除
const effectCallbackTargets:WeakMap<StoreEffectCallback, Set<ReactiveObject>> = new WeakMap();

const triggerCallbacks:Set<StoreEffectCallback> = new Set();

let currStoreEffectCallback:StoreEffectCallback | null = null;

let pending = false;

function createLocalStore<T extends object>(stores:T, name:string){
  return createStore(stores, name)
}

/**
 * 绑定响应数据和更新函数
 * @param target 
 * @param property 
 * @returns 
 */
function track(target:any, property:Property){
  if(!currStoreEffectCallback || typeof target[property] === "function") return;

  let desMap:DesMap | undefined = storeEffectMap.get(target);
  if(!desMap){
    desMap = new Map();
    storeEffectMap.set(target, desMap);
  }
  let effectCallbacks = desMap.get(property);
  if(!effectCallbacks){
    effectCallbacks = new Set();
    desMap.set(property, effectCallbacks);
  }
  effectCallbacks.add(currStoreEffectCallback);

  if(!effectCallbackTargets.has(currStoreEffectCallback)){
    const targetSet = new Set<object>();
    targetSet.add(target);
    effectCallbackTargets.set(currStoreEffectCallback, targetSet);
  }else{
    effectCallbackTargets.get(currStoreEffectCallback)!.add(target)
  }
}

/**
 * 触发响应更新
 * @param target 
 * @param property 
 * @returns 
 */
function trigger(target:any, property:Property){
  const desMap = storeEffectMap.get(target);
  if(!desMap) return;

  // 获取所有副作用函数
  const effectCallbacks = desMap.get(property);
  if(effectCallbacks){
    effectCallbacks.forEach(callback =>{
      if(callback){
        triggerCallbacks.add(callback);
      }
    });
  }

  if(!pending){
    pending = true;
    Promise.resolve(null).then(runUpdate).catch((error)=>console.error(error));
  }
}

/**
 * 执行更新
 */
function runUpdate(){
  pending = false;
  triggerCallbacks.forEach(callback =>{
    callback();
  });
  triggerCallbacks.clear();
}

function removeProperty(target:any, property:Property){
  const desMap = storeEffectMap.get(target);
  if(!desMap) return;

  desMap.delete(property)
}

/**
 * 组件销毁时移除副作用函数
 * @param effectCallback 
 */
function removeCallback(effectCallback:StoreEffectCallback){
  const targets = effectCallbackTargets.get(effectCallback);
  if(targets){
    targets.forEach(target =>{
      const desMap = storeEffectMap.get(target);
      if(desMap){
        desMap.forEach((effectSet)=>{
          effectSet.delete(effectCallback)
        });
      }
    });
    effectCallbackTargets.delete(effectCallback)
  }
  if(currStoreEffectCallback === effectCallback){
    currStoreEffectCallback = null;
  }
}

export function createStore<T extends object>(stores:T, name?:string){
  const storeSelf:any = stores;
  const allStores:any = {};
  const storeName = name || "default";
  Object.keys(storeSelf).forEach(key =>{
      allStores[key] = new Proxy(storeSelf[key], {
      get(target, property){
        const value = Reflect.get(target, property);
        const observableTarget = observableMap.get(target);
        if(!observableTarget || observableTarget[property] === undefined || observableTarget[property]){
          track(target, property)
        }
        return value;
      },

      set(target, property, value, reciver){
        if(Reflect.get(target, property, reciver) === value) return true;
        const rel = Reflect.set(target, property, value, reciver);
        if(rel){
          trigger(target, property)
        }
        return rel;
      },

      deleteProperty(target, property){
        removeProperty(target, property)
        return Reflect.deleteProperty(target, property);
      }
    });
  });
  storeMap.set(storeName, allStores);
  return getStore<T>(storeName);
}

/**
 * 创建组件范围里的store, 其他组件可以通过name获取
 * @param stores 
 * @param name 
 * @returns 
 */
export function useCreateLocalStore<T extends object>(stores:()=>T | T, name:string){
  return useMemo(() => {
    return hasStore(name) ? getStore<T>(name) : createLocalStore(typeof stores === "function" ? stores() : stores, name);
	}, [name]);
}

export function removeStore(name:StoreName){
  storeMap.delete(name);
}

export function hasStore(name:StoreName){
  return storeMap.has(name);
}

/**
 * 返回指定名称的store
 * @param name 默认 "default"
 * @returns 
 */
export function getStore<T = any>(name:StoreName):{useStore:UseStoreHook<T>, stores:T | undefined, destroyStore: () => void}{
    const stores = storeMap.get(name);
    return {
      useStore: ((disabledUpdate?:boolean)=>useStore(disabledUpdate, name)) as UseStoreHook<T>,
      destroyStore: removeStore.bind(null, name), 
      stores: stores
    }
}

// 可以指定哪些属性作为或者不作为响应数据
export function makeObservable<T extends object>(target:T, overrides: AnnotationsMap<T, boolean> ){
  observableMap.set(target, overrides);
}

function useStore<T=any>(disabledAutoUpdate?:boolean, name?:StoreName):T{
  const [, setForceUpdate] = useState({});
  useEffect(()=>{
    return ()=> removeCallback(storeEffectCallback);
  }, []);

  const storeEffectCallback = useCallback(()=>{
    if(!disabledAutoUpdate){
      setForceUpdate({});
    }
  }, []);

  currStoreEffectCallback = storeEffectCallback;

  return storeMap.get(name || "default")
}
import { useEffect, useState } from "react";

type AnnotationsMap<T, V> = {
  [P in Exclude<keyof T, "toString">]?: V;
};

const evener = new EventTarget();
const event = `$$emit${performance.now()}`;
const allStores:any = {};
const observableMap:WeakMap<object, Record<PropertyKey, boolean | undefined>> = new WeakMap();

let isRunAction = false;
let timer:any = null;

function emit(){
  if(timer){
    clearTimeout(timer);
  }
  timer = setTimeout(dispatch, 0);
}

function dispatch(){
  evener.dispatchEvent(new Event(event));
}

export function createStore<T extends object>(stores:T):typeof useStore<T>{
  const storeSelf:any = stores
  Object.keys(storeSelf).forEach(key =>{
    allStores[key] = new Proxy(storeSelf[key], {
      set(target, property, value, reciver){
        if(Reflect.get(target, property, reciver) === value) return true;
        const rel = Reflect.set(target, property, value, reciver);
        if(observableMap.has(target) && observableMap.get(target)![property] === false) return rel;
        if(!isRunAction && rel){
          emit();
        }
        return rel;
      }
    });
  });
  return useStore;
}

export function makeObservable<T extends object>(target:T, overrides: AnnotationsMap<T, boolean> ){
  observableMap.set(target, overrides);
}

export const runAction = (action:()=>void)=>{
  isRunAction = true;
  try{
    action();
    dispatch();
  }finally{
    isRunAction = false;
  }
}

export function useStore<T=any>():T{
  const [, setForceUpdate] = useState(0);
  useEffect(()=>{
    const callback = ()=>{setForceUpdate((pre) => pre + 1)}
    evener.addEventListener(event, callback);
      return ()=>{
        evener.removeEventListener(event, callback);
      }
  }, [])

  return allStores;
}
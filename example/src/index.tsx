import ReactDOM from 'react-dom/client'
import React, { useEffect, useMemo, useState } from 'react'
import {createStore, getStore, removeStore, useCreateLocalStore, useStore} from "../../src/fertile"
import MyStore from "./MyStore"


const {useStore: useGlobalStore} = createStore({myStore: new MyStore()});


function App(){
  const {myStore} = useGlobalStore();
  return <div>{myStore.count}<button onClick={()=>{myStore.add()}}>add global</button></div>
}

function App2(){
  const {useStore} = useCreateLocalStore(()=>({myStore: new MyStore()}), "App2");
  const {myStore} = useGlobalStore();
  const localStore = useStore().myStore
  return <div>{myStore.count}<button onClick={()=>{localStore.add()}}>add local</button>local: {localStore.count}</div>
}

function UseLocal(){
  const localStore = useStore(false, "App2").myStore;
  const {count, test} = localStore;
  return  <div>app1 local: {count} {test?.total}</div>
}

function Root(){
  const [show, setShow] = useState(true)
  return <>{show && <App />}<App2 /><UseLocal /><button onClick={()=>setShow(!show)}>show</button></>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Root />)

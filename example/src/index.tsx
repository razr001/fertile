import ReactDOM from 'react-dom/client'
import React, { useEffect, useMemo, useState } from 'react'
import {createStore, getStore, removeStore} from "../../src/fertile"
import MyStore from "./MyStore"



function App(){
  const {useStore} = useMemo(()=>createStore({myStore: new MyStore()}, "app1"), [])
  const {myStore} = useStore();
  useEffect(()=>{
    return ()=>{
      removeStore("app1")
    }   
  }, [])
  return <div>{myStore.count}<button onClick={()=>{myStore.add()}}>add</button></div>
}

function App2(){
  const {useStore} = useMemo(()=>createStore({myStore: new MyStore()}, "app2"), []);
  const {myStore} = useStore();
  return <div>{myStore.count}<button onClick={()=>{myStore.add()}}>add</button></div>
}

function Root(){
  const [show, setShow] = useState(true)
  return <>{show && <App />}<App2 /><button onClick={()=>setShow(!show)}>show</button></>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Root />)

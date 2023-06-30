import React from "react";
import { createStore } from "../src/fertile"
import TodoStore from "./TodoStore"

export const stores = {
  todo: new TodoStore()
}

const {useStore} = createStore(stores)

export default ()=>{
  const {todo} = useStore();

  return (
    <div>
      <button onClick={()=>todo.add({name:""+Math.random(), complete:false})}>Add</button>
      {
        todo.todoList.map(v =><p key={v.id} onClick={()=>{todo.complete(v, !v.complete)}}>{`${v.name} ${v.complete ? "ok" : "progress"}`}</p>)
      }
    </div>
  )
}
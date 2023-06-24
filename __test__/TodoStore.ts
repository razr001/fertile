type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

type TodoItem = {id:number, name:string, complete:boolean}

let _id = 1

export default class TodoStore{
  todoList:TodoItem[] = [{id:_id, name:"first test", complete:true}]

  add(item:Omit<TodoItem, "id">){
    this.todoList.push({
      ...item,
      id: ++_id,
    });

    this.todoList = [
      ...this.todoList,
    ]
  }

  complete(item:TodoItem, isComplete:boolean){
    const val = this.todoList.find((v) => v.id === item.id);
    if(val){
      val.complete = isComplete;
      this.todoList = [
        ...this.todoList
      ]
    }
  }

  remove(item:TodoItem){
    this.todoList = this.todoList.filter((v)=> v.id !== item.id)
  }
}
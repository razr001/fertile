import { makeObservable } from "../../src/fertile";

export default class MyStore {
  count = 1;
  test:any = undefined

  // constructor(){
  //   makeObservable(this, {count: false})
  // }

  add(){
    this.count++
    this.test = {total:this.count + 3}
  }
}
import '@testing-library/jest-dom'
import {render, screen, act, fireEvent} from "@testing-library/react"
import user from "@testing-library/user-event"
import React from 'react';
import App, {stores} from './App';

 const {todo} = stores;

 async function sleep(ms:number) {
  return new Promise((resolve) => setTimeout(resolve, 1000))
 }

describe("fertile app", ()=>{
  test("test render", ()=>{
    const {container} = render(<App />)
    const list = container.querySelectorAll("p");
    list.forEach((el, index) =>{
      const todoItem = todo.todoList[index];
      expect(el.textContent).toBe(`${todoItem.name} ${todoItem.complete ? "ok" : "progress"}`)
    });
  })

  test("test add", async ()=>{
    const {container} = render(<App />)

    const btn = screen.getByText("Add");
    user.click(btn);
    await sleep(50)

    const list = container.querySelectorAll("p");
    expect(list.length).toBe(2);
    list.forEach((el, index) =>{
      const todoItem = todo.todoList[index];
      expect(el.textContent).toBe(`${todoItem.name} ${todoItem.complete ? "ok" : "progress"}`)
    });
  })

  test("test complete", async ()=>{
    const {container} = render(<App />)

    const btn = screen.getByText("Add");
    
    user.click(btn);
    await sleep(500)
    const list = container.querySelectorAll("p");
    user.click(list[1]);
    await sleep(500);

    const todoItem = todo.todoList[1];
    expect(list[1].textContent).toBe(`${todoItem.name} ok`)
  })
})
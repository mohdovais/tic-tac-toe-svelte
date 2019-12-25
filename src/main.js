import App from "./components/App.svelte";
import { createStore } from "./store";
import { initialState, reducer } from "./state";

const app = new App({
  target: document.body,
  props: {
    store: createStore(reducer, initialState)
  }
});

export default app;

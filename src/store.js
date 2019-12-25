import { writable, get } from "svelte/store";

/**
 * Svelte does not compare objects
 * https://github.com/sveltejs/svelte/issues/2171
 * and therefore store.update notifies subscribers, even if same object is
 * returned. Otherwise the method could be much simpler:
 * const dispatch = action => update(state => reducer(state, action));
 *
 * @param {function} reducer
 * @param {*} initialState
 */
export function createStore(reducer, initialState = {}) {
  const store = writable(initialState);

  const dispatch = action => {
    const current_state = get(store);
    const next_state = reducer(current_state, action);
    const promise = Promise.resolve(next_state);

    if (promise == next_state) {
      promise.then(state => {
        if (get(store) !== state) {
          store.set(state);
        }
      });
    }

    if (current_state !== next_state) {
      store.set(next_state);
    }
  };

  return {
    subscribe: store.subscribe,
    dispatch
  };
}

import { tweened } from "svelte/motion";
import { cubicOut } from "svelte/easing";
import { ANIMATION_TIME } from "./constants";

export function createTweenedStore(value, duration = ANIMATION_TIME) {
  return tweened(value, {
    duration,
    easing: cubicOut
  });
}

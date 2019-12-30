<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import { arc } from '../path';

    export let x = 0;
    export let y = 0;
    export let animate = true;

    const cx = x + 50;
    const cy = y + 50;
    const r = 25;

    const sweep = createTweenedStore(animate ? 0 : 361);
    $: path = arc(cx, cy, r, 0, $sweep);

    onMount(() => {
        if (animate) {
            $sweep = 361;
        }
    });
</script>

<path d="{path}" stroke-width="10" stroke="#f2ebd3" fill="none" />
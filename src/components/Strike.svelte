<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import { ANIMATION_TIME } from '../constants';

    export let pattern = [0, 0, 0];

    const start = pattern[0];
    const end = pattern[2];

    let x1 = (start % 3) * 100 + 50;
    let y1 = Math.floor(start / 3) * 100 + 50;
    let x2 = createTweenedStore(x1);
    let y2 = createTweenedStore(y1);

    onMount(() => {
        const timeout = setTimeout(() => {
            $x2 = (end % 3) * 100 + 50;
            $y2 = Math.floor(end / 3) * 100 + 50;
        }, ANIMATION_TIME);

        return () => clearTimeout(timeout);
    });
</script>

<line x1="{x1}" y1="{y1}" x2="{$x2}" y2="{$y2}" stroke-width="5" stroke="#033" />
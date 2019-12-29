<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import { ANIMATION_TIME } from '../constants';

    export let x = 0;
    export let y = 0;
    const duration = ANIMATION_TIME / 2;
    const x12 = createTweenedStore(x + 75);
    const y12 = createTweenedStore(y + 25);
    const x22 = createTweenedStore(x + 25);
    const y22 = createTweenedStore(y + 25);

    onMount(() => {
        $x12 = x + 25;
        $y12 = y + 75;

        const timeout = setTimeout(() => {
            $x22 = x + 75;
            $y22 = y + 75;
        }, duration);

        return () => clearTimeout(timeout);
    });
</script>

<g stroke="#545454" stroke-width="10">
    <line x1="{x+75}" y1="{y+25}" x2="{$x12}" y2="{$y12}" />
    <line x1="{x+25}" y1="{y+25}" x2="{$x22}" y2="{$y22}" />
</g>
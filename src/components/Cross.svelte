<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import { ANIMATION_TIME } from '../constants';

    export let x = 0;
    export let y = 0;
    export let animate = true;

    const duration = ANIMATION_TIME / 2;
    const x12 = createTweenedStore(x + (animate ? 75 : 25));
    const y12 = createTweenedStore(y + (animate ? 25 : 75));
    const x22 = createTweenedStore(x + (animate ? 25 : 75));
    const y22 = createTweenedStore(y + (animate ? 25 : 75));

    onMount(() => {
        if (animate) {
            $x12 = x + 25;
            $y12 = y + 75;

            const timeout = setTimeout(() => {
                $x22 = x + 75;
                $y22 = y + 75;
            }, duration);

            return () => clearTimeout(timeout);
        }
    });
</script>

<g stroke="#545454" stroke-width="10">
    <line x1="{x+75}" y1="{y+25}" x2="{$x12}" y2="{$y12}" />
    <line x1="{x+25}" y1="{y+25}" x2="{$x22}" y2="{$y22}" />
</g>
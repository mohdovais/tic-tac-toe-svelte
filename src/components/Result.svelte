<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import Cross from './Cross.svelte';
    import Circle from './Circle.svelte';
    import { CROSS, CIRCLE, EMPTY_STRING } from '../constants';

    export let finished = false;
    export let winner = "";

    const textY = createTweenedStore(300);

    onMount(() => {
        $textY = 200;
    });

</script>

<g class:show="{finished}">
{#if finished}
{#if winner === EMPTY_STRING}
    <Cross x="{50}" y="{50}" animate="{false}"></Cross>
    <Circle x="{150}" y="{50}" animate="{false}"></Circle>
    <text text-anchor="middle" x="150" y="{$textY}">Draw!</text>
{:else}
    {#if winner === CROSS}
    <Cross x="{100}" y="{50}" animate="{false}"></Cross>
    {/if}
    {#if winner === CIRCLE}
    <Circle x="{100}" y="{50}" animate="{false}"></Circle>
    {/if}
    <text text-anchor="middle" x="150" y="{$textY}">Won!</text>
{/if}
{/if}
</g>

<style>
g {
    transform: translateY(100%);
    transform-origin: center top;
    will-change: transform;
    transition: all 0.3s ease-in;
    transition-delay: 1s;
}
.show {
    transform: translateY(0);
}

text {
    font-size: 4rem;
    font-weight: 700;
}
</style>
<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import Cross from './Cross.svelte';
    import Circle from './Circle.svelte';
    import { CROSS, CIRCLE, EMPTY_STRING } from '../constants';

    export let store;

    const textY = createTweenedStore(300);

    onMount(() => {
        $textY = 200;
    })

</script>

{#if $store.winner === EMPTY_STRING}
<g>
    <Cross x="{50}" y="{50}" animate="{false}"></Cross>
    <Circle x="{150}" y="{50}" animate="{false}"></Circle>
    <text text-anchor="middle" x="150" y="{$textY}">Draw!</text>
</g>
{:else}
<g>
    {#if $store.winner === CROSS}
    <Cross x="{100}" y="{50}" animate="{false}"></Cross>
    {/if}
    {#if $store.winner === CIRCLE}
    <Circle x="{100}" y="{50}" animate="{false}"></Circle>
    {/if}
    <text text-anchor="middle" x="150" y="{$textY}">Won!</text>
</g>
{/if}

<style>
text {
    font-size: 4rem;
    font-weight: 700;
}
</style>
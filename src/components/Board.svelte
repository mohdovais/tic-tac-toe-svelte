<script>
    import { onDestroy } from 'svelte';
    import Grid from './Grid.svelte';
    import Button from './BoardButton.svelte';
    import Cross from './Cross.svelte';
    import Circle from './Circle.svelte';
    import Strike from './Strike.svelte';
    import { EMPTY_STRING, CROSS, CIRCLE } from '../constants';

    export let board = [];
    export let finished = false;
    export let winningPattern = [];
    export let onComplete = function () { }
    export let onSelect = function () { }

    $: if (finished) {
        setTimeout(onComplete, 2000);
    }
</script>

<g class:hide={finished}>
    <Grid />
    <g fill="transparent">
        {#each board as label, index}
        {#if label === EMPTY_STRING}
            <Button 
                x="{(index %3) * 100}" 
                y="{Math.floor(index /3) * 100}" 
                onClick="{()=> onSelect(index)}" />
        {/if}
        {#if label === CROSS}
            <Cross x="{(index %3) * 100}" y="{Math.floor(index /3) * 100}" />
        {/if}
        {#if label === CIRCLE}
            <Circle x="{(index %3) * 100}" y="{Math.floor(index /3) * 100}" />
        {/if}
    {/each}
    </g>
    {#if winningPattern.length === 3}
        <Strike pattern="{winningPattern}" />
    {/if}
</g>

<style>
g {
    transform: translateY(0);
    transform-origin: center top;
    will-change: transform;
    transition: all 0.3s ease-in;
    transition-delay: 1s;
}
.hide {
    transform: translateY(-100%);
}
</style>
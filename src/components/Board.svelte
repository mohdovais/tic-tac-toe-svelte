<script>
    import Grid from './Grid.svelte';
    import Button from './BoardButton.svelte';
    import Cross from './Cross.svelte';
    import Circle from './Circle.svelte';
    import Strike from './Strike.svelte';
    import { ACTION_TYPE_SELECT } from '../state';
    import { EMPTY_STRING, CROSS, CIRCLE } from '../constants';

    export let store;

    function onClick(position) {
        store.dispatch({
            type: ACTION_TYPE_SELECT,
            position,
        });
    }
</script>

<g>
    <Grid />
    <g fill="transparent">
    {#each $store.board as label, index}
        {#if label === EMPTY_STRING}
            <Button x="{(index %3) * 100}" y="{Math.floor(index /3) * 100}" onClick="{()=> onClick(index)}" />
        {/if}
        {#if label === CROSS}
            <Cross x="{(index %3) * 100}" y="{Math.floor(index /3) * 100}" />
        {/if}
        {#if label === CIRCLE}
            <Circle x="{(index %3) * 100}" y="{Math.floor(index /3) * 100}" />
        {/if}
    {/each}
    </g>
    {#if $store.winner !== EMPTY_STRING}
        <Strike pattern="{$store.winningPattern}" />
    {/if}
</g>
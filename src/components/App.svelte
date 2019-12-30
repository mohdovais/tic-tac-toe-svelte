<script>
    import { draw } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    import Board from './Board.svelte';
    import Players from './Players.svelte';
    import Reset from './Reset.svelte';
    import Result from './Result.svelte';

    export let store;
</script>

<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <Board store="{store}" hide="{$store.finished}"/>
    {#if $store.finished}
    <Result store="{store}" />
    {/if}
</svg>
{#if !$store.finished}
<Players store="{store}" />
{/if}
{#if $store.history.length > 0}
<Reset store="{store}" />
{/if}


<style>
    :global(body) {
        min-height: 100vh;
        background-color: #14bdac;
        padding: 0;
        margin: 0;
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;
        color:#212529;
        text-align: left;
    }

    svg {
        min-width: 100%;
        height: auto;
        max-height: 100vh;
    }
</style>
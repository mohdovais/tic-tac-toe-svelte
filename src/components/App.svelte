<script>
    import Board from './Board.svelte';
    import Players from './Players.svelte';
    import Reset from './Reset.svelte';

    export let store;
</script>

<h1>Tic Tac Toe</h1>
<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <Board store="{store}" />
</svg>
{#if !$store.finished}
<Players store="{store}" />
{/if}
<Reset store="{store}" />


<style>
    :global(body) {
        min-height: 100vh;
        background-color: #14bdac;
        padding: 0;
        margin: 0;
    }

    h1{
        text-align: center;
    }

    svg {
        min-width: 100%;
        height: auto;
        max-height: 100vh;
    }
</style>
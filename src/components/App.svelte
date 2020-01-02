<script>
    import { writable } from 'svelte/store';
    import { draw } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import Board from './Board.svelte';
    import Players from './Players.svelte';
    import Reset from './Reset.svelte';
    import Result from './Result.svelte';
    import { ACTION_TYPE_RESET, ACTION_TYPE_UNDO, ACTION_TYPE_SELECT } from '../state';

    export let store;

    const completed = writable(false);
    const setComplete = () => completed.set(true);

    const select = (position) => store.dispatch({
        type: ACTION_TYPE_SELECT,
        position,
    });
    const undo = () => store.dispatch({ type: ACTION_TYPE_UNDO });
    const reset = () => {
        store.dispatch({ type: ACTION_TYPE_RESET });
        completed.set(false);
    }
</script>

<div class="app">
    <div class="board">
        <svg 
        viewBox="0 0 300 300" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMinYMin meet"
        width="300" 
        height="300" >
            {#if !$completed}
            <Board
                board="{$store.board}"
                finished="{$store.finished}"
                winningPattern="{$store.winningPattern}"
                onSelect="{select}"
                onComplete="{setComplete}" />
            {/if}
            <Result 
                finished="{$store.finished}" 
                winner="{$store.winner}" />
        </svg>
    </div>
    <div class="toolbar">
        {#if !$store.finished}
        <Players 
            player="{$store.player}" 
            hasHistory="{$store.history.length !== 0}" 
            onUndo="{undo}" />
        {/if}
        {#if $store.history.length > 0}
        <Reset onReset="{reset}" />
        {/if}
    </div>
</div>


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
        width: 100%;
        height: auto;
        max-height: 100vh;
    }

    .app {
        display: flex;
    }

    .board {
        flex: 1;
    }

    @media (orientation: landscape) {
        .app {
            flex-direction: row;
        }
    }

    @media (orientation: portrait) {
        .app {
            flex-direction: column;
        }
    }
</style>
<script>
    import { CROSS, CIRCLE } from '../constants';
    import { ACTION_TYPE_RESET, ACTION_TYPE_UNDO } from '../state';
    import Button from './Button.svelte';
    import Cross from './Cross.svelte';

    export let store;
    const reset = () => store.dispatch({ type: ACTION_TYPE_RESET });
    const undo = () => store.dispatch({ type: ACTION_TYPE_UNDO })
</script>

<div class="c">
    <div>
        Next Move: 
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64">
            {#if $store.player === CROSS}
            <g stroke="#545454" stroke-width="10">
                <line x1="75" y1="25" x2="25" y2="75"></line>
                <line x1="25" y1="25" x2="75" y2="75"></line>
            </g>
            {/if}
            {#if $store.player === CIRCLE}
            <circle cx="50" cy="50" r="25" stroke="#f2ebd3" stroke-width="10" fill="none"></circle>
            {/if}
        </svg>
    </div>
    {#if $store.history.length !== 0}
    <Button onClick="{undo}">Undo Last Move</Button>
    {/if}
</div>

<style>
    .c {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: .75rem 1.25rem;
        margin: 0.5rem 0;
    }

    svg {
        vertical-align: middle;
    }
</style>
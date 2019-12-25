<script>
    import { CROSS, CIRCLE } from '../constants';
    import { ACTION_TYPE_RESET, ACTION_TYPE_UNDO } from '../state';
    import Button from './Button.svelte';

    export let store;
    const reset = () => store.dispatch({ type: ACTION_TYPE_RESET });
    const undo = () => store.dispatch({ type: ACTION_TYPE_UNDO })
</script>

<div class="c">
    <div>Next Move: <span>Player {@html $store.player}</span></div>
    <Button onClick="{undo}">Undo Last Move</Button>
</div>

<style>
    .c {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: .75rem 1.25rem;
        margin: 0.5rem 0;
    }

    span {
        color: red;
    }
</style>
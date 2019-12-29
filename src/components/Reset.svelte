<script>
    import { ACTION_TYPE_RESET } from '../state';
    import Button from './Button.svelte';
    export let store;

    const reset = () => store.dispatch({ type: ACTION_TYPE_RESET });
</script>

<div>
    <Button onClick="{reset}">New Game</Button>
</div>

<style>
div {
    padding: 1em;
    text-align: center;
}
</style>
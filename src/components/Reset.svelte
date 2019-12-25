<script>
    import { ACTION_TYPE_RESET } from '../state';
    import Button from './Button.svelte';
    export let store;

    const reset = () => store.dispatch({ type: ACTION_TYPE_RESET });
    $: RESET = $store.finished ? 'New ' : 'Reset ';
</script>

<div>
    <Button onClick="{reset}">{RESET}Game</Button>
</div>

<style>
div {
    padding: 1em;
    text-align: center;
}
</style>
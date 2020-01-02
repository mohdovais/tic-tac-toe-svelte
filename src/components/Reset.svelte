<script>
    import Button from './Button.svelte';
    export let onReset;
</script>

<div>
    <Button onClick="{onReset}">New Game</Button>
</div>

<style>
div {
    padding: 1em;
    text-align: center;
}
</style>
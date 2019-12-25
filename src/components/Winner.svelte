<script>
    import { EMPTY_STRING } from '../constants';
    export let store;
</script>

{#if $store.finished && $store.winner === EMPTY_STRING}
<div class="alert tie">Game Tie!</div>
{/if}
{#if $store.finished && $store.winner !== EMPTY_STRING}
<div class="alert winner">Player <span>{@html $store.winner}</span> wins!</div>
{/if}

<style>
.alert {
    border-radius: .25rem;
    padding: .75rem 1.25rem;
    margin: 0.5rem;
    --position: fixed;
    z-index: 1;
}
.tie{
    color:#856404;
    background-color: rgba(255, 243, 205, 0.9);
    border: 1px solid #ffeeba;
}

.winner {
    color:#155724;
    background-color:rgba(212, 237, 218, 0.9);
    border: 1px solid #c3e6cb;
}
</style>
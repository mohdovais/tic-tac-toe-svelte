<script>
    import { CROSS, CIRCLE } from '../constants';
    import Button from './Button.svelte';
    import Cross from './Cross.svelte';

    export let player = '';
    export let hasHistory = false;
    export let onUndo;
</script>

<div class="c">
    <div>
        Next Move:
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64">
            {#if player === CROSS}
            <g stroke="#545454" stroke-width="10">
                <line x1="75" y1="25" x2="25" y2="75"></line>
                <line x1="25" y1="25" x2="75" y2="75"></line>
            </g>
            {/if}
            {#if player === CIRCLE}
            <circle cx="50" cy="50" r="25" stroke="#f2ebd3" stroke-width="10" fill="none"></circle>
            {/if}
        </svg>
    </div>
    <Button onClick="{onUndo}" hidden="{!hasHistory}">Undo Last Move</Button>
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
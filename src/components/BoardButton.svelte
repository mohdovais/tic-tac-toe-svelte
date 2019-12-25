<script>
    export let onClick;
    export let disabled = false;
    export let highlight = false;
</script>

<button type="button" class:highlight={highlight} disabled={disabled} on:click="{onClick}">
    <slot></slot>
</button>

<style>
    button {
        width: 33.3333333333333333%;
        height: 33.3333333333333333%;
        padding: 0;
        margin: 0;

        background: transparent;
        border: 1px solid transparent;
        border-radius: 0;
        font-size: calc(7vh + 7vw);

        vertical-align: middle;
    }

    button:not(:disabled):empty {
        cursor: pointer;
    }

    button:not(:disabled):empty:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    button:disabled {
        color: initial;
    }

    button * {
        pointer-events: none;
    }

    .highlight {
        background-color: gold;
    }
</style>
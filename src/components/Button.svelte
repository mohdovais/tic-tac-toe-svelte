<script>
    export let onClick;
</script>

<button type="button" on:click="{onClick}">
    <slot></slot>
</button>

<style>
    button {
        font-size: 1rem;
        border: 1px solid rgba(238, 238, 238, 0.3);
        background-color: rgba(238, 238, 238, 0.5);
        border-radius: 3px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
    }

    button:focus{
        border-color: #fff;
        background-color: rgba(238, 238, 238, 0.7);
    }

    button * {
        pointer-events: none;
    }
</style>
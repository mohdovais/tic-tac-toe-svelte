<script>
    export let onClick;
</script>

<button type="button" on:click="{onClick}">
    <slot></slot>
</button>

<style>
    button {
        font-size: 1rem;
        border: 1px solid #ddd;
        background-color: #eee;
        border-radius: 3px;
        padding: 0.5rem 0.75rem;
    }

    button * {
        pointer-events: none;
    }
</style>
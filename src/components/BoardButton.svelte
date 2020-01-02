<script>
    export let x = 0;
    export let y = 0;
    export let onClick;
</script>

<rect width="100" height="100" x="{x}" y="{y}" on:click="{onClick}" />

<style>
rect {
    cursor: pointer;
}
</style>
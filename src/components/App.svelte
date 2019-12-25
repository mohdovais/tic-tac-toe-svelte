<script>
	import Winner from './Winner.svelte';
	import Board from './Board.svelte';
	import Players from './Players.svelte';
	import Reset from './Reset.svelte'

	export let store;
</script>

<main>
	{#if $store.finished}
	<Winner store="{store}"/>
	{:else}
	<Players store="{store}"/>
	{/if}
	<Board store="{store}"/>
	<Reset store="{store}"/>
</main>

<style>
	:global(body){
		padding: 0;
		margin: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}
</style>
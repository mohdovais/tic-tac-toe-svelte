<script>
  import Button from './BoardButton.svelte';
  import { ACTION_TYPE_SELECT } from '../state';
  import { EMPTY_STRING } from '../constants';

  export let store;

  function onClick(position) {
    store.dispatch({
      type: ACTION_TYPE_SELECT,
      position,
    });
  }

</script>

<div>
  <fieldset disabled="{$store.finished}">
    {#each $store.board as label, index}
      <Button 
        onClick="{()=> onClick(index)}" 
        highlight={$store.finished && $store.winningPattern.indexOf(index) !== -1}
      >
      {#if label!==EMPTY_STRING}
      <span>{@html label}</span>
      {:else}
      <span>&nbsp;</span>
      {/if}
    </Button>
    {/each}
  </fieldset>
</div>

<style>
  div {
    position: relative;
    width: 100%;
    max-width: calc(100vh);
    margin: 0 auto;
  }

  div:after {
    content: "";
    display: block;
    padding-bottom: 100%;
  }

  fieldset {
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    border: none;
    font-size: 0;
  }

  fieldset :global(button:nth-child(3n-1)),
  fieldset :global(button:nth-child(3n)) {
    border-left-color: #000;
  }

  fieldset :global(button:nth-child(3n-1)),
  fieldset :global(button:nth-child(3n-2)) {
    border-right-color: #000;
  }

  fieldset :global(button:nth-child(n+4)) {
    border-top-color: #000;
  }

  fieldset :global(button:nth-child(1)),
  fieldset :global(button:nth-child(2)),
  fieldset :global(button:nth-child(3)),
  fieldset :global(button:nth-child(4)),
  fieldset :global(button:nth-child(5)),
  fieldset :global(button:nth-child(6)) {
    border-bottom-color: #000;
  }

  span{
    display: inline-block;
    animation: slidein 0.1s ease-in-out;
  }

  @keyframes slidein {
    from {
      transform: scale(0.2);
    }

    to {
      transform: scale(1);
    }
  }
</style>
<script>
    import { onMount } from 'svelte';
    import { createTweenedStore } from '../tweened-store';
    import { ANIMATION_TIME } from '../constants';

    const HUNDRED = 100;
    const TWO_HUNDRED = 200;
    const THREE_HUNDRED = 300;

    function createStore() {
        return createTweenedStore(150);
    }

    const l1x1 = createStore();
    const l1y1 = createStore();
    const l1x2 = createStore();
    const l1y2 = createStore();

    const l2x1 = createStore();
    const l2y1 = createStore();
    const l2x2 = createStore();
    const l2y2 = createStore();

    const l3x1 = createStore();
    const l3y1 = createStore();
    const l3x2 = createStore();
    const l3y2 = createStore();

    const l4x1 = createStore();
    const l4y1 = createStore();
    const l4x2 = createStore();
    const l4y2 = createStore();

    function animate() {
        $l1x1 = HUNDRED;
        $l1y1 = HUNDRED;
        $l1x2 = TWO_HUNDRED;
        $l1y2 = HUNDRED;

        $l2x1 = HUNDRED;
        $l2y1 = TWO_HUNDRED;
        $l2x2 = TWO_HUNDRED;
        $l2y2 = TWO_HUNDRED;

        $l3x1 = HUNDRED;
        $l3y1 = HUNDRED;
        $l3x2 = HUNDRED;
        $l3y2 = TWO_HUNDRED;

        $l4x1 = TWO_HUNDRED;
        $l4y1 = HUNDRED;
        $l4x2 = TWO_HUNDRED;
        $l4y2 = TWO_HUNDRED;

        const timeout = setTimeout(() => {
            $l1x1 = 0;
            $l1x2 = THREE_HUNDRED;

            $l2x1 = 0;
            $l2x2 = THREE_HUNDRED;

            $l3y1 = 0;
            $l3y2 = THREE_HUNDRED;

            $l4y1 = 0;
            $l4y2 = THREE_HUNDRED;
        }, ANIMATION_TIME);

        return () => clearTimeout(timeout);
    }

    onMount(animate);
</script>

<g stroke="rgba(0,0,0,0.2)" stroke-width="5">
    <line x1="{$l1x1}" y1="{$l1y1}" x2="{$l1x2}" y2="{$l1y2}" />
    <line x1="{$l2x1}" y1="{$l2y1}" x2="{$l2x2}" y2="{$l2y2}" />
    <line x1="{$l3x1}" y1="{$l3y1}" x2="{$l3x2}" y2="{$l3y2}" />
    <line x1="{$l4x1}" y1="{$l4y1}" x2="{$l4x2}" y2="{$l4y2}" />
</g>
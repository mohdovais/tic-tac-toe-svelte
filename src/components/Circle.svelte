<script>

	import { draw } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

    import { f_svg_ellipse_arc } from '../path';
    export let x = 0;
    export let y = 0;

    const cx = x + 50;
    const cy = y + 50;
    const r = 25;

</script>

<path d="{f_svg_ellipse_arc([cx,cy], [r,r], [359, 358], 0)+ 'Z'}" stroke-width="10" stroke="#f2ebd3" transition:draw="{{duration: 300, delay: 0, easing: quintOut}}" />
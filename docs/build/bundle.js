
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    const EMPTY_STRING = "";

    const CROSS = "&#10005;";
    const CIRCLE = "&#9675;";

    const POSSIBLES = [
      [0, 1, 2],
      [0, 3, 6],
      [0, 4, 8],
      [1, 4, 7],
      [2, 4, 6],
      [2, 5, 8],
      [3, 4, 5],
      [6, 7, 8]
    ];

    const ANIMATION_TIME = 300;

    function createTweenedStore(value, duration = ANIMATION_TIME) {
      return tweened(value, {
        duration,
        easing: cubicOut
      });
    }

    /* src/components/Grid.svelte generated by Svelte v3.16.5 */
    const file = "src/components/Grid.svelte";

    function create_fragment(ctx) {
    	let g;
    	let line0;
    	let line1;
    	let line2;
    	let line3;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			line2 = svg_element("line");
    			line3 = svg_element("line");
    			attr_dev(line0, "x1", /*$l1x1*/ ctx[0]);
    			attr_dev(line0, "y1", /*$l1y1*/ ctx[1]);
    			attr_dev(line0, "x2", /*$l1x2*/ ctx[2]);
    			attr_dev(line0, "y2", /*$l1y2*/ ctx[3]);
    			add_location(line0, file, 75, 4, 1738);
    			attr_dev(line1, "x1", /*$l2x1*/ ctx[4]);
    			attr_dev(line1, "y1", /*$l2y1*/ ctx[5]);
    			attr_dev(line1, "x2", /*$l2x2*/ ctx[6]);
    			attr_dev(line1, "y2", /*$l2y2*/ ctx[7]);
    			add_location(line1, file, 76, 4, 1803);
    			attr_dev(line2, "x1", /*$l3x1*/ ctx[8]);
    			attr_dev(line2, "y1", /*$l3y1*/ ctx[9]);
    			attr_dev(line2, "x2", /*$l3x2*/ ctx[10]);
    			attr_dev(line2, "y2", /*$l3y2*/ ctx[11]);
    			add_location(line2, file, 77, 4, 1868);
    			attr_dev(line3, "x1", /*$l4x1*/ ctx[12]);
    			attr_dev(line3, "y1", /*$l4y1*/ ctx[13]);
    			attr_dev(line3, "x2", /*$l4x2*/ ctx[14]);
    			attr_dev(line3, "y2", /*$l4y2*/ ctx[15]);
    			add_location(line3, file, 78, 4, 1933);
    			attr_dev(g, "stroke", "rgba(0,0,0,0.2)");
    			attr_dev(g, "stroke-width", "5");
    			add_location(g, file, 74, 0, 1688);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, line0);
    			append_dev(g, line1);
    			append_dev(g, line2);
    			append_dev(g, line3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$l1x1*/ 1) {
    				attr_dev(line0, "x1", /*$l1x1*/ ctx[0]);
    			}

    			if (dirty[0] & /*$l1y1*/ 2) {
    				attr_dev(line0, "y1", /*$l1y1*/ ctx[1]);
    			}

    			if (dirty[0] & /*$l1x2*/ 4) {
    				attr_dev(line0, "x2", /*$l1x2*/ ctx[2]);
    			}

    			if (dirty[0] & /*$l1y2*/ 8) {
    				attr_dev(line0, "y2", /*$l1y2*/ ctx[3]);
    			}

    			if (dirty[0] & /*$l2x1*/ 16) {
    				attr_dev(line1, "x1", /*$l2x1*/ ctx[4]);
    			}

    			if (dirty[0] & /*$l2y1*/ 32) {
    				attr_dev(line1, "y1", /*$l2y1*/ ctx[5]);
    			}

    			if (dirty[0] & /*$l2x2*/ 64) {
    				attr_dev(line1, "x2", /*$l2x2*/ ctx[6]);
    			}

    			if (dirty[0] & /*$l2y2*/ 128) {
    				attr_dev(line1, "y2", /*$l2y2*/ ctx[7]);
    			}

    			if (dirty[0] & /*$l3x1*/ 256) {
    				attr_dev(line2, "x1", /*$l3x1*/ ctx[8]);
    			}

    			if (dirty[0] & /*$l3y1*/ 512) {
    				attr_dev(line2, "y1", /*$l3y1*/ ctx[9]);
    			}

    			if (dirty[0] & /*$l3x2*/ 1024) {
    				attr_dev(line2, "x2", /*$l3x2*/ ctx[10]);
    			}

    			if (dirty[0] & /*$l3y2*/ 2048) {
    				attr_dev(line2, "y2", /*$l3y2*/ ctx[11]);
    			}

    			if (dirty[0] & /*$l4x1*/ 4096) {
    				attr_dev(line3, "x1", /*$l4x1*/ ctx[12]);
    			}

    			if (dirty[0] & /*$l4y1*/ 8192) {
    				attr_dev(line3, "y1", /*$l4y1*/ ctx[13]);
    			}

    			if (dirty[0] & /*$l4x2*/ 16384) {
    				attr_dev(line3, "x2", /*$l4x2*/ ctx[14]);
    			}

    			if (dirty[0] & /*$l4y2*/ 32768) {
    				attr_dev(line3, "y2", /*$l4y2*/ ctx[15]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const HUNDRED = 100;
    const TWO_HUNDRED = 200;
    const THREE_HUNDRED = 300;

    function createStore() {
    	return createTweenedStore(150);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $l1x1;
    	let $l1y1;
    	let $l1x2;
    	let $l1y2;
    	let $l2x1;
    	let $l2y1;
    	let $l2x2;
    	let $l2y2;
    	let $l3x1;
    	let $l3y1;
    	let $l3x2;
    	let $l3y2;
    	let $l4x1;
    	let $l4y1;
    	let $l4x2;
    	let $l4y2;
    	const l1x1 = createStore();
    	validate_store(l1x1, "l1x1");
    	component_subscribe($$self, l1x1, value => $$invalidate(0, $l1x1 = value));
    	const l1y1 = createStore();
    	validate_store(l1y1, "l1y1");
    	component_subscribe($$self, l1y1, value => $$invalidate(1, $l1y1 = value));
    	const l1x2 = createStore();
    	validate_store(l1x2, "l1x2");
    	component_subscribe($$self, l1x2, value => $$invalidate(2, $l1x2 = value));
    	const l1y2 = createStore();
    	validate_store(l1y2, "l1y2");
    	component_subscribe($$self, l1y2, value => $$invalidate(3, $l1y2 = value));
    	const l2x1 = createStore();
    	validate_store(l2x1, "l2x1");
    	component_subscribe($$self, l2x1, value => $$invalidate(4, $l2x1 = value));
    	const l2y1 = createStore();
    	validate_store(l2y1, "l2y1");
    	component_subscribe($$self, l2y1, value => $$invalidate(5, $l2y1 = value));
    	const l2x2 = createStore();
    	validate_store(l2x2, "l2x2");
    	component_subscribe($$self, l2x2, value => $$invalidate(6, $l2x2 = value));
    	const l2y2 = createStore();
    	validate_store(l2y2, "l2y2");
    	component_subscribe($$self, l2y2, value => $$invalidate(7, $l2y2 = value));
    	const l3x1 = createStore();
    	validate_store(l3x1, "l3x1");
    	component_subscribe($$self, l3x1, value => $$invalidate(8, $l3x1 = value));
    	const l3y1 = createStore();
    	validate_store(l3y1, "l3y1");
    	component_subscribe($$self, l3y1, value => $$invalidate(9, $l3y1 = value));
    	const l3x2 = createStore();
    	validate_store(l3x2, "l3x2");
    	component_subscribe($$self, l3x2, value => $$invalidate(10, $l3x2 = value));
    	const l3y2 = createStore();
    	validate_store(l3y2, "l3y2");
    	component_subscribe($$self, l3y2, value => $$invalidate(11, $l3y2 = value));
    	const l4x1 = createStore();
    	validate_store(l4x1, "l4x1");
    	component_subscribe($$self, l4x1, value => $$invalidate(12, $l4x1 = value));
    	const l4y1 = createStore();
    	validate_store(l4y1, "l4y1");
    	component_subscribe($$self, l4y1, value => $$invalidate(13, $l4y1 = value));
    	const l4x2 = createStore();
    	validate_store(l4x2, "l4x2");
    	component_subscribe($$self, l4x2, value => $$invalidate(14, $l4x2 = value));
    	const l4y2 = createStore();
    	validate_store(l4y2, "l4y2");
    	component_subscribe($$self, l4y2, value => $$invalidate(15, $l4y2 = value));

    	function animate() {
    		set_store_value(l1x1, $l1x1 = HUNDRED);
    		set_store_value(l1y1, $l1y1 = HUNDRED);
    		set_store_value(l1x2, $l1x2 = TWO_HUNDRED);
    		set_store_value(l1y2, $l1y2 = HUNDRED);
    		set_store_value(l2x1, $l2x1 = HUNDRED);
    		set_store_value(l2y1, $l2y1 = TWO_HUNDRED);
    		set_store_value(l2x2, $l2x2 = TWO_HUNDRED);
    		set_store_value(l2y2, $l2y2 = TWO_HUNDRED);
    		set_store_value(l3x1, $l3x1 = HUNDRED);
    		set_store_value(l3y1, $l3y1 = HUNDRED);
    		set_store_value(l3x2, $l3x2 = HUNDRED);
    		set_store_value(l3y2, $l3y2 = TWO_HUNDRED);
    		set_store_value(l4x1, $l4x1 = TWO_HUNDRED);
    		set_store_value(l4y1, $l4y1 = HUNDRED);
    		set_store_value(l4x2, $l4x2 = TWO_HUNDRED);
    		set_store_value(l4y2, $l4y2 = TWO_HUNDRED);

    		const timeout = setTimeout(
    			() => {
    				set_store_value(l1x1, $l1x1 = 0);
    				set_store_value(l1x2, $l1x2 = THREE_HUNDRED);
    				set_store_value(l2x1, $l2x1 = 0);
    				set_store_value(l2x2, $l2x2 = THREE_HUNDRED);
    				set_store_value(l3y1, $l3y1 = 0);
    				set_store_value(l3y2, $l3y2 = THREE_HUNDRED);
    				set_store_value(l4y1, $l4y1 = 0);
    				set_store_value(l4y2, $l4y2 = THREE_HUNDRED);
    			},
    			ANIMATION_TIME
    		);

    		return () => clearTimeout(timeout);
    	}

    	onMount(animate);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$l1x1" in $$props) l1x1.set($l1x1 = $$props.$l1x1);
    		if ("$l1y1" in $$props) l1y1.set($l1y1 = $$props.$l1y1);
    		if ("$l1x2" in $$props) l1x2.set($l1x2 = $$props.$l1x2);
    		if ("$l1y2" in $$props) l1y2.set($l1y2 = $$props.$l1y2);
    		if ("$l2x1" in $$props) l2x1.set($l2x1 = $$props.$l2x1);
    		if ("$l2y1" in $$props) l2y1.set($l2y1 = $$props.$l2y1);
    		if ("$l2x2" in $$props) l2x2.set($l2x2 = $$props.$l2x2);
    		if ("$l2y2" in $$props) l2y2.set($l2y2 = $$props.$l2y2);
    		if ("$l3x1" in $$props) l3x1.set($l3x1 = $$props.$l3x1);
    		if ("$l3y1" in $$props) l3y1.set($l3y1 = $$props.$l3y1);
    		if ("$l3x2" in $$props) l3x2.set($l3x2 = $$props.$l3x2);
    		if ("$l3y2" in $$props) l3y2.set($l3y2 = $$props.$l3y2);
    		if ("$l4x1" in $$props) l4x1.set($l4x1 = $$props.$l4x1);
    		if ("$l4y1" in $$props) l4y1.set($l4y1 = $$props.$l4y1);
    		if ("$l4x2" in $$props) l4x2.set($l4x2 = $$props.$l4x2);
    		if ("$l4y2" in $$props) l4y2.set($l4y2 = $$props.$l4y2);
    	};

    	return [
    		$l1x1,
    		$l1y1,
    		$l1x2,
    		$l1y2,
    		$l2x1,
    		$l2y1,
    		$l2x2,
    		$l2y2,
    		$l3x1,
    		$l3y1,
    		$l3x2,
    		$l3y2,
    		$l4x1,
    		$l4y1,
    		$l4x2,
    		$l4y2,
    		l1x1,
    		l1y1,
    		l1x2,
    		l1y2,
    		l2x1,
    		l2y1,
    		l2x2,
    		l2y2,
    		l3x1,
    		l3y1,
    		l3x2,
    		l3y2,
    		l4x1,
    		l4y1,
    		l4x2,
    		l4y2
    	];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/BoardButton.svelte generated by Svelte v3.16.5 */

    const file$1 = "src/components/BoardButton.svelte";

    function create_fragment$1(ctx) {
    	let rect;
    	let dispose;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "width", "100");
    			attr_dev(rect, "height", "100");
    			attr_dev(rect, "x", /*x*/ ctx[0]);
    			attr_dev(rect, "y", /*y*/ ctx[1]);
    			attr_dev(rect, "class", "svelte-152zdin");
    			add_location(rect, file$1, 6, 0, 88);
    			dispose = listen_dev(rect, "click", /*onClick*/ ctx[2], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x*/ 1) {
    				attr_dev(rect, "x", /*x*/ ctx[0]);
    			}

    			if (dirty & /*y*/ 2) {
    				attr_dev(rect, "y", /*y*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { onClick } = $$props;
    	const writable_props = ["x", "y", "onClick"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BoardButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("onClick" in $$props) $$invalidate(2, onClick = $$props.onClick);
    	};

    	$$self.$capture_state = () => {
    		return { x, y, onClick };
    	};

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("onClick" in $$props) $$invalidate(2, onClick = $$props.onClick);
    	};

    	return [x, y, onClick];
    }

    class BoardButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { x: 0, y: 1, onClick: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BoardButton",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*onClick*/ ctx[2] === undefined && !("onClick" in props)) {
    			console.warn("<BoardButton> was created without expected prop 'onClick'");
    		}
    	}

    	get x() {
    		throw new Error("<BoardButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<BoardButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<BoardButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<BoardButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<BoardButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<BoardButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Cross.svelte generated by Svelte v3.16.5 */
    const file$2 = "src/components/Cross.svelte";

    function create_fragment$2(ctx) {
    	let g;
    	let line0;
    	let line0_x__value;
    	let line0_y__value;
    	let line1;
    	let line1_x__value;
    	let line1_y__value;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", line0_x__value = /*x*/ ctx[0] + 75);
    			attr_dev(line0, "y1", line0_y__value = /*y*/ ctx[1] + 25);
    			attr_dev(line0, "x2", /*$x12*/ ctx[2]);
    			attr_dev(line0, "y2", /*$y12*/ ctx[3]);
    			add_location(line0, file$2, 31, 4, 874);
    			attr_dev(line1, "x1", line1_x__value = /*x*/ ctx[0] + 25);
    			attr_dev(line1, "y1", line1_y__value = /*y*/ ctx[1] + 25);
    			attr_dev(line1, "x2", /*$x22*/ ctx[4]);
    			attr_dev(line1, "y2", /*$y22*/ ctx[5]);
    			add_location(line1, file$2, 32, 4, 935);
    			attr_dev(g, "stroke", "#545454");
    			attr_dev(g, "stroke-width", "10");
    			add_location(g, file$2, 30, 0, 831);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, line0);
    			append_dev(g, line1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x*/ 1 && line0_x__value !== (line0_x__value = /*x*/ ctx[0] + 75)) {
    				attr_dev(line0, "x1", line0_x__value);
    			}

    			if (dirty & /*y*/ 2 && line0_y__value !== (line0_y__value = /*y*/ ctx[1] + 25)) {
    				attr_dev(line0, "y1", line0_y__value);
    			}

    			if (dirty & /*$x12*/ 4) {
    				attr_dev(line0, "x2", /*$x12*/ ctx[2]);
    			}

    			if (dirty & /*$y12*/ 8) {
    				attr_dev(line0, "y2", /*$y12*/ ctx[3]);
    			}

    			if (dirty & /*x*/ 1 && line1_x__value !== (line1_x__value = /*x*/ ctx[0] + 25)) {
    				attr_dev(line1, "x1", line1_x__value);
    			}

    			if (dirty & /*y*/ 2 && line1_y__value !== (line1_y__value = /*y*/ ctx[1] + 25)) {
    				attr_dev(line1, "y1", line1_y__value);
    			}

    			if (dirty & /*$x22*/ 16) {
    				attr_dev(line1, "x2", /*$x22*/ ctx[4]);
    			}

    			if (dirty & /*$y22*/ 32) {
    				attr_dev(line1, "y2", /*$y22*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $x12;
    	let $y12;
    	let $x22;
    	let $y22;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { animate = true } = $$props;
    	const duration = ANIMATION_TIME / 2;
    	const x12 = createTweenedStore(x + (animate ? 75 : 25));
    	validate_store(x12, "x12");
    	component_subscribe($$self, x12, value => $$invalidate(2, $x12 = value));
    	const y12 = createTweenedStore(y + (animate ? 25 : 75));
    	validate_store(y12, "y12");
    	component_subscribe($$self, y12, value => $$invalidate(3, $y12 = value));
    	const x22 = createTweenedStore(x + (animate ? 25 : 75));
    	validate_store(x22, "x22");
    	component_subscribe($$self, x22, value => $$invalidate(4, $x22 = value));
    	const y22 = createTweenedStore(y + (animate ? 25 : 75));
    	validate_store(y22, "y22");
    	component_subscribe($$self, y22, value => $$invalidate(5, $y22 = value));

    	onMount(() => {
    		if (animate) {
    			set_store_value(x12, $x12 = x + 25);
    			set_store_value(y12, $y12 = y + 75);

    			const timeout = setTimeout(
    				() => {
    					set_store_value(x22, $x22 = x + 75);
    					set_store_value(y22, $y22 = y + 75);
    				},
    				duration
    			);

    			return () => clearTimeout(timeout);
    		}
    	});

    	const writable_props = ["x", "y", "animate"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cross> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("animate" in $$props) $$invalidate(10, animate = $$props.animate);
    	};

    	$$self.$capture_state = () => {
    		return { x, y, animate, $x12, $y12, $x22, $y22 };
    	};

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    		if ("animate" in $$props) $$invalidate(10, animate = $$props.animate);
    		if ("$x12" in $$props) x12.set($x12 = $$props.$x12);
    		if ("$y12" in $$props) y12.set($y12 = $$props.$y12);
    		if ("$x22" in $$props) x22.set($x22 = $$props.$x22);
    		if ("$y22" in $$props) y22.set($y22 = $$props.$y22);
    	};

    	return [x, y, $x12, $y12, $x22, $y22, x12, y12, x22, y22, animate];
    }

    class Cross extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { x: 0, y: 1, animate: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cross",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get x() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Cross>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Cross>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var _Math = Math;

    function round(number, precisionTo) {
      var precision = _Math.pow(10, precisionTo || 0);
      return _Math.round(number * precision) / precision;
    }

    /**
     *
     * @param {Number} degree
     * @returns {Number} radian
     */
    function radian(degree) {
      return (degree * _Math.PI) / 180 || 0;
    }

    /**
     *
     * @param {Number} cx X coordinate of center of circle
     * @param {Number} cy Y coordinate of center of circle
     * @param {Number} radius Radius of circle
     * @param {Number} degree Angle in Degrees for seeking point
     * @returns {Object} {x,y} coordinates
     */
    function getArcPoint(cx, cy, radius, degree) {
      var theta = radian(degree);
      return {
        x: round(cx + radius * _Math.cos(theta), 2),
        y: round(cy + radius * _Math.sin(theta), 2)
      };
    }

    /**
     *
     * @param {Number} cx X coordinate of center of circle
     * @param {Number} cy Y coordinate of center of circle
     * @param {Number} radius Radius of circle
     * @param {Number} startDegree Arc start angle in Degrees
     * @param {Number} endDegree Arc end angle in Degrees
     * @returns {String} SVG path definition `d`
     */
    function doArc(cx, cy, radius, startDegree, endDegree) {
      const start = getArcPoint(cx, cy, radius, startDegree);
      const end = getArcPoint(cx, cy, radius, endDegree);
      const largeArcFlag = _Math.abs(endDegree - startDegree) > 180 ? 1 : 0;
      let sweepFlag = 1;
      const M = `M ${start.x} ${start.y}`;
      const A = [
        "A",
        radius,
        radius,
        "0",
        largeArcFlag,
        sweepFlag,
        end.x,
        end.y
      ].join(" ");

      return M + A;
    }

    /**
     *
     * @param {Number} cx X coordinate of center of circle
     * @param {Number} cy Y coordinate of center of circle
     * @param {Number} radius Radius of circle
     * @param {Number} startDegree Arc start angle in Degrees
     * @param {Number} endDegree Arc end angle in Degrees
     * @returns {String} SVG path definition `d`
     */
    function arc(cx, cy, radius, startDegree, endDegree) {
      if (endDegree > 359) {
        return (
          doArc(cx, cy, radius, startDegree, 359) +
          doArc(cx, cy, radius, 359, endDegree)
        );
      }
      return doArc(cx, cy, radius, startDegree, endDegree);
    }

    /* src/components/Circle.svelte generated by Svelte v3.16.5 */
    const file$3 = "src/components/Circle.svelte";

    function create_fragment$3(ctx) {
    	let path_1;

    	const block = {
    		c: function create() {
    			path_1 = svg_element("path");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			attr_dev(path_1, "stroke-width", "10");
    			attr_dev(path_1, "stroke", "#f2ebd3");
    			attr_dev(path_1, "fill", "none");
    			add_location(path_1, file$3, 23, 0, 480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path_1, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*path*/ 1) {
    				attr_dev(path_1, "d", /*path*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const r = 25;

    function instance$3($$self, $$props, $$invalidate) {
    	let $sweep;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { animate = true } = $$props;
    	const cx = x + 50;
    	const cy = y + 50;
    	const sweep = createTweenedStore(animate ? 0 : 361);
    	validate_store(sweep, "sweep");
    	component_subscribe($$self, sweep, value => $$invalidate(5, $sweep = value));

    	onMount(() => {
    		if (animate) {
    			set_store_value(sweep, $sweep = 361);
    		}
    	});

    	const writable_props = ["x", "y", "animate"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("animate" in $$props) $$invalidate(4, animate = $$props.animate);
    	};

    	$$self.$capture_state = () => {
    		return { x, y, animate, path, $sweep };
    	};

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("animate" in $$props) $$invalidate(4, animate = $$props.animate);
    		if ("path" in $$props) $$invalidate(0, path = $$props.path);
    		if ("$sweep" in $$props) sweep.set($sweep = $$props.$sweep);
    	};

    	let path;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$sweep*/ 32) {
    			 $$invalidate(0, path = arc(cx, cy, r, 0, $sweep));
    		}
    	};

    	return [path, sweep, x, y, animate];
    }

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { x: 2, y: 3, animate: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get x() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animate() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animate(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Strike.svelte generated by Svelte v3.16.5 */
    const file$4 = "src/components/Strike.svelte";

    function create_fragment$4(ctx) {
    	let line;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", /*x1*/ ctx[2]);
    			attr_dev(line, "y1", /*y1*/ ctx[3]);
    			attr_dev(line, "x2", /*$x2*/ ctx[0]);
    			attr_dev(line, "y2", /*$y2*/ ctx[1]);
    			attr_dev(line, "stroke-width", "5");
    			attr_dev(line, "stroke", "#033");
    			add_location(line, file$4, 25, 0, 658);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$x2*/ 1) {
    				attr_dev(line, "x2", /*$x2*/ ctx[0]);
    			}

    			if (dirty & /*$y2*/ 2) {
    				attr_dev(line, "y2", /*$y2*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $x2;
    	let $y2;
    	let { pattern = [0, 0, 0] } = $$props;
    	const start = pattern[0];
    	const end = pattern[2];
    	let x1 = start % 3 * 100 + 50;
    	let y1 = Math.floor(start / 3) * 100 + 50;
    	let x2 = createTweenedStore(x1);
    	validate_store(x2, "x2");
    	component_subscribe($$self, x2, value => $$invalidate(0, $x2 = value));
    	let y2 = createTweenedStore(y1);
    	validate_store(y2, "y2");
    	component_subscribe($$self, y2, value => $$invalidate(1, $y2 = value));

    	onMount(() => {
    		const timeout = setTimeout(
    			() => {
    				set_store_value(x2, $x2 = end % 3 * 100 + 50);
    				set_store_value(y2, $y2 = Math.floor(end / 3) * 100 + 50);
    			},
    			ANIMATION_TIME
    		);

    		return () => clearTimeout(timeout);
    	});

    	const writable_props = ["pattern"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Strike> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("pattern" in $$props) $$invalidate(6, pattern = $$props.pattern);
    	};

    	$$self.$capture_state = () => {
    		return { pattern, x1, y1, x2, y2, $x2, $y2 };
    	};

    	$$self.$inject_state = $$props => {
    		if ("pattern" in $$props) $$invalidate(6, pattern = $$props.pattern);
    		if ("x1" in $$props) $$invalidate(2, x1 = $$props.x1);
    		if ("y1" in $$props) $$invalidate(3, y1 = $$props.y1);
    		if ("x2" in $$props) $$invalidate(4, x2 = $$props.x2);
    		if ("y2" in $$props) $$invalidate(5, y2 = $$props.y2);
    		if ("$x2" in $$props) x2.set($x2 = $$props.$x2);
    		if ("$y2" in $$props) y2.set($y2 = $$props.$y2);
    	};

    	return [$x2, $y2, x1, y1, x2, y2, pattern];
    }

    class Strike extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { pattern: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Strike",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get pattern() {
    		throw new Error("<Strike>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pattern(value) {
    		throw new Error("<Strike>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Board.svelte generated by Svelte v3.16.5 */
    const file$5 = "src/components/Board.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (25:8) {#if label === EMPTY_STRING}
    function create_if_block_3(ctx) {
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[5](/*index*/ ctx[8], ...args);
    	}

    	const button = new BoardButton({
    			props: {
    				x: /*index*/ ctx[8] % 3 * 100,
    				y: Math.floor(/*index*/ ctx[8] / 3) * 100,
    				onClick: func
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};
    			if (dirty & /*onSelect*/ 8) button_changes.onClick = func;
    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(25:8) {#if label === EMPTY_STRING}",
    		ctx
    	});

    	return block;
    }

    // (31:8) {#if label === CROSS}
    function create_if_block_2(ctx) {
    	let current;

    	const cross = new Cross({
    			props: {
    				x: /*index*/ ctx[8] % 3 * 100,
    				y: Math.floor(/*index*/ ctx[8] / 3) * 100
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cross.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cross, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cross, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(31:8) {#if label === CROSS}",
    		ctx
    	});

    	return block;
    }

    // (34:8) {#if label === CIRCLE}
    function create_if_block_1(ctx) {
    	let current;

    	const circle = new Circle({
    			props: {
    				x: /*index*/ ctx[8] % 3 * 100,
    				y: Math.floor(/*index*/ ctx[8] / 3) * 100
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(circle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(circle, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(circle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(34:8) {#if label === CIRCLE}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {#each board as label, index}
    function create_each_block(ctx) {
    	let if_block0_anchor;
    	let if_block1_anchor;
    	let if_block2_anchor;
    	let current;
    	let if_block0 = /*label*/ ctx[6] === EMPTY_STRING && create_if_block_3(ctx);
    	let if_block1 = /*label*/ ctx[6] === CROSS && create_if_block_2(ctx);
    	let if_block2 = /*label*/ ctx[6] === CIRCLE && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, if_block0_anchor, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*label*/ ctx[6] === EMPTY_STRING) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(if_block0_anchor.parentNode, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*label*/ ctx[6] === CROSS) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*label*/ ctx[6] === CIRCLE) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(if_block0_anchor);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:8) {#each board as label, index}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#if winningPattern.length === 3}
    function create_if_block(ctx) {
    	let current;

    	const strike = new Strike({
    			props: { pattern: /*winningPattern*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(strike.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(strike, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const strike_changes = {};
    			if (dirty & /*winningPattern*/ 4) strike_changes.pattern = /*winningPattern*/ ctx[2];
    			strike.$set(strike_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(strike.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(strike.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(strike, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(39:4) {#if winningPattern.length === 3}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let g1;
    	let g0;
    	let current;
    	const grid = new Grid({ $$inline: true });
    	let each_value = /*board*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*winningPattern*/ ctx[2].length === 3 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			g1 = svg_element("g");
    			create_component(grid.$$.fragment);
    			g0 = svg_element("g");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (if_block) if_block.c();
    			attr_dev(g0, "fill", "transparent");
    			attr_dev(g0, "class", "svelte-i34k5a");
    			add_location(g0, file$5, 22, 4, 627);
    			attr_dev(g1, "class", "svelte-i34k5a");
    			toggle_class(g1, "hide", /*finished*/ ctx[1]);
    			add_location(g1, file$5, 20, 0, 584);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g1, anchor);
    			mount_component(grid, g1, null);
    			append_dev(g1, g0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(g0, null);
    			}

    			if (if_block) if_block.m(g1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*board, CIRCLE, Math, CROSS, EMPTY_STRING, onSelect*/ 9) {
    				each_value = /*board*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(g0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*winningPattern*/ ctx[2].length === 3) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(g1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*finished*/ 2) {
    				toggle_class(g1, "hide", /*finished*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g1);
    			destroy_component(grid);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { board = [] } = $$props;
    	let { finished = false } = $$props;
    	let { winningPattern = [] } = $$props;

    	let { onComplete = function () {
    		
    	} } = $$props;

    	let { onSelect = function () {
    		
    	} } = $$props;

    	const writable_props = ["board", "finished", "winningPattern", "onComplete", "onSelect"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	const func = index => onSelect(index);

    	$$self.$set = $$props => {
    		if ("board" in $$props) $$invalidate(0, board = $$props.board);
    		if ("finished" in $$props) $$invalidate(1, finished = $$props.finished);
    		if ("winningPattern" in $$props) $$invalidate(2, winningPattern = $$props.winningPattern);
    		if ("onComplete" in $$props) $$invalidate(4, onComplete = $$props.onComplete);
    		if ("onSelect" in $$props) $$invalidate(3, onSelect = $$props.onSelect);
    	};

    	$$self.$capture_state = () => {
    		return {
    			board,
    			finished,
    			winningPattern,
    			onComplete,
    			onSelect
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("board" in $$props) $$invalidate(0, board = $$props.board);
    		if ("finished" in $$props) $$invalidate(1, finished = $$props.finished);
    		if ("winningPattern" in $$props) $$invalidate(2, winningPattern = $$props.winningPattern);
    		if ("onComplete" in $$props) $$invalidate(4, onComplete = $$props.onComplete);
    		if ("onSelect" in $$props) $$invalidate(3, onSelect = $$props.onSelect);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*finished, onComplete*/ 18) {
    			 if (finished) {
    				setTimeout(onComplete, 2000);
    			}
    		}
    	};

    	return [board, finished, winningPattern, onSelect, onComplete, func];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			board: 0,
    			finished: 1,
    			winningPattern: 2,
    			onComplete: 4,
    			onSelect: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get board() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set board(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get finished() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set finished(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winningPattern() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winningPattern(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onComplete() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onComplete(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSelect() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSelect(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.16.5 */

    const file$6 = "src/components/Button.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-1ylnz8n");
    			toggle_class(button, "hidden", /*hidden*/ ctx[1]);
    			add_location(button, file$6, 5, 0, 75);
    			dispose = listen_dev(button, "click", /*onClick*/ ctx[0], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}

    			if (dirty & /*hidden*/ 2) {
    				toggle_class(button, "hidden", /*hidden*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { onClick } = $$props;
    	let { hidden = false } = $$props;
    	const writable_props = ["onClick", "hidden"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("onClick" in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ("hidden" in $$props) $$invalidate(1, hidden = $$props.hidden);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { onClick, hidden };
    	};

    	$$self.$inject_state = $$props => {
    		if ("onClick" in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ("hidden" in $$props) $$invalidate(1, hidden = $$props.hidden);
    	};

    	return [onClick, hidden, $$scope, $$slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { onClick: 0, hidden: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*onClick*/ ctx[0] === undefined && !("onClick" in props)) {
    			console.warn("<Button> was created without expected prop 'onClick'");
    		}
    	}

    	get onClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hidden(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Players.svelte generated by Svelte v3.16.5 */
    const file$7 = "src/components/Players.svelte";

    // (15:12) {#if player === CROSS}
    function create_if_block_1$1(ctx) {
    	let g;
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "x1", "75");
    			attr_dev(line0, "y1", "25");
    			attr_dev(line0, "x2", "25");
    			attr_dev(line0, "y2", "75");
    			add_location(line0, file$7, 16, 16, 480);
    			attr_dev(line1, "x1", "25");
    			attr_dev(line1, "y1", "25");
    			attr_dev(line1, "x2", "75");
    			attr_dev(line1, "y2", "75");
    			add_location(line1, file$7, 17, 16, 542);
    			attr_dev(g, "stroke", "#545454");
    			attr_dev(g, "stroke-width", "10");
    			add_location(g, file$7, 15, 12, 425);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			append_dev(g, line0);
    			append_dev(g, line1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(15:12) {#if player === CROSS}",
    		ctx
    	});

    	return block;
    }

    // (21:12) {#if player === CIRCLE}
    function create_if_block$1(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", "50");
    			attr_dev(circle, "cy", "50");
    			attr_dev(circle, "r", "25");
    			attr_dev(circle, "stroke", "#f2ebd3");
    			attr_dev(circle, "stroke-width", "10");
    			attr_dev(circle, "fill", "none");
    			add_location(circle, file$7, 21, 12, 671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(21:12) {#if player === CIRCLE}",
    		ctx
    	});

    	return block;
    }

    // (26:4) <Button onClick="{onUndo}" hidden="{!hasHistory}">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Undo Last Move");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(26:4) <Button onClick=\\\"{onUndo}\\\" hidden=\\\"{!hasHistory}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let svg;
    	let if_block0_anchor;
    	let t1;
    	let current;
    	let if_block0 = /*player*/ ctx[0] === CROSS && create_if_block_1$1(ctx);
    	let if_block1 = /*player*/ ctx[0] === CIRCLE && create_if_block$1(ctx);

    	const button = new Button({
    			props: {
    				onClick: /*onUndo*/ ctx[2],
    				hidden: !/*hasHistory*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("Next Move:\n        ");
    			svg = svg_element("svg");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			create_component(button.$$.fragment);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 100 100");
    			attr_dev(svg, "width", "64");
    			attr_dev(svg, "height", "64");
    			attr_dev(svg, "class", "svelte-3heq98");
    			add_location(svg, file$7, 13, 8, 292);
    			add_location(div0, file$7, 11, 4, 259);
    			attr_dev(div1, "class", "c svelte-3heq98");
    			add_location(div1, file$7, 10, 0, 239);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, svg);
    			if (if_block0) if_block0.m(svg, null);
    			append_dev(svg, if_block0_anchor);
    			if (if_block1) if_block1.m(svg, null);
    			append_dev(div1, t1);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*player*/ ctx[0] === CROSS) {
    				if (!if_block0) {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(svg, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*player*/ ctx[0] === CIRCLE) {
    				if (!if_block1) {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(svg, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			const button_changes = {};
    			if (dirty & /*onUndo*/ 4) button_changes.onClick = /*onUndo*/ ctx[2];
    			if (dirty & /*hasHistory*/ 2) button_changes.hidden = !/*hasHistory*/ ctx[1];

    			if (dirty & /*$$scope*/ 8) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { player = "" } = $$props;
    	let { hasHistory = false } = $$props;
    	let { onUndo } = $$props;
    	const writable_props = ["player", "hasHistory", "onUndo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Players> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    		if ("hasHistory" in $$props) $$invalidate(1, hasHistory = $$props.hasHistory);
    		if ("onUndo" in $$props) $$invalidate(2, onUndo = $$props.onUndo);
    	};

    	$$self.$capture_state = () => {
    		return { player, hasHistory, onUndo };
    	};

    	$$self.$inject_state = $$props => {
    		if ("player" in $$props) $$invalidate(0, player = $$props.player);
    		if ("hasHistory" in $$props) $$invalidate(1, hasHistory = $$props.hasHistory);
    		if ("onUndo" in $$props) $$invalidate(2, onUndo = $$props.onUndo);
    	};

    	return [player, hasHistory, onUndo];
    }

    class Players extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { player: 0, hasHistory: 1, onUndo: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Players",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*onUndo*/ ctx[2] === undefined && !("onUndo" in props)) {
    			console.warn("<Players> was created without expected prop 'onUndo'");
    		}
    	}

    	get player() {
    		throw new Error("<Players>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set player(value) {
    		throw new Error("<Players>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasHistory() {
    		throw new Error("<Players>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasHistory(value) {
    		throw new Error("<Players>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onUndo() {
    		throw new Error("<Players>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onUndo(value) {
    		throw new Error("<Players>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Reset.svelte generated by Svelte v3.16.5 */
    const file$8 = "src/components/Reset.svelte";

    // (7:4) <Button onClick="{onReset}">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New Game");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(7:4) <Button onClick=\\\"{onReset}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let current;

    	const button = new Button({
    			props: {
    				onClick: /*onReset*/ ctx[0],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "svelte-1fty1b4");
    			add_location(div, file$8, 5, 0, 86);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};
    			if (dirty & /*onReset*/ 1) button_changes.onClick = /*onReset*/ ctx[0];

    			if (dirty & /*$$scope*/ 2) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { onReset } = $$props;
    	const writable_props = ["onReset"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Reset> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("onReset" in $$props) $$invalidate(0, onReset = $$props.onReset);
    	};

    	$$self.$capture_state = () => {
    		return { onReset };
    	};

    	$$self.$inject_state = $$props => {
    		if ("onReset" in $$props) $$invalidate(0, onReset = $$props.onReset);
    	};

    	return [onReset];
    }

    class Reset extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { onReset: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reset",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*onReset*/ ctx[0] === undefined && !("onReset" in props)) {
    			console.warn("<Reset> was created without expected prop 'onReset'");
    		}
    	}

    	get onReset() {
    		throw new Error("<Reset>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onReset(value) {
    		throw new Error("<Reset>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Result.svelte generated by Svelte v3.16.5 */
    const file$9 = "src/components/Result.svelte";

    // (20:0) {#if finished}
    function create_if_block$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*winner*/ ctx[1] === EMPTY_STRING) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(20:0) {#if finished}",
    		ctx
    	});

    	return block;
    }

    // (25:0) {:else}
    function create_else_block(ctx) {
    	let if_block0_anchor;
    	let text_1;
    	let t;
    	let current;
    	let if_block0 = /*winner*/ ctx[1] === CROSS && create_if_block_3$1(ctx);
    	let if_block1 = /*winner*/ ctx[1] === CIRCLE && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			text_1 = svg_element("text");
    			t = text("Won!");
    			attr_dev(text_1, "text-anchor", "middle");
    			attr_dev(text_1, "x", "150");
    			attr_dev(text_1, "y", /*$textY*/ ctx[2]);
    			attr_dev(text_1, "class", "svelte-1ou6dhf");
    			add_location(text_1, file$9, 31, 4, 877);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, if_block0_anchor, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*winner*/ ctx[1] === CROSS) {
    				if (!if_block0) {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(if_block0_anchor.parentNode, if_block0_anchor);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*winner*/ ctx[1] === CIRCLE) {
    				if (!if_block1) {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(text_1.parentNode, text_1);
    				} else {
    					transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*$textY*/ 4) {
    				attr_dev(text_1, "y", /*$textY*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(if_block0_anchor);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(25:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if winner === EMPTY_STRING}
    function create_if_block_1$2(ctx) {
    	let text_1;
    	let t;
    	let current;

    	const cross = new Cross({
    			props: { x: 50, y: 50, animate: false },
    			$$inline: true
    		});

    	const circle = new Circle({
    			props: { x: 150, y: 50, animate: false },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cross.$$.fragment);
    			create_component(circle.$$.fragment);
    			text_1 = svg_element("text");
    			t = text("Draw!");
    			attr_dev(text_1, "text-anchor", "middle");
    			attr_dev(text_1, "x", "150");
    			attr_dev(text_1, "y", /*$textY*/ ctx[2]);
    			attr_dev(text_1, "class", "svelte-1ou6dhf");
    			add_location(text_1, file$9, 23, 4, 613);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cross, target, anchor);
    			mount_component(circle, target, anchor);
    			insert_dev(target, text_1, anchor);
    			append_dev(text_1, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$textY*/ 4) {
    				attr_dev(text_1, "y", /*$textY*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross.$$.fragment, local);
    			transition_in(circle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross.$$.fragment, local);
    			transition_out(circle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cross, detaching);
    			destroy_component(circle, detaching);
    			if (detaching) detach_dev(text_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(21:0) {#if winner === EMPTY_STRING}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if winner === CROSS}
    function create_if_block_3$1(ctx) {
    	let current;

    	const cross = new Cross({
    			props: { x: 100, y: 50, animate: false },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cross.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cross, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cross, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(26:4) {#if winner === CROSS}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#if winner === CIRCLE}
    function create_if_block_2$1(ctx) {
    	let current;

    	const circle = new Circle({
    			props: { x: 100, y: 50, animate: false },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(circle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(circle, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(circle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(29:4) {#if winner === CIRCLE}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let g;
    	let current;
    	let if_block = /*finished*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			g = svg_element("g");
    			if (if_block) if_block.c();
    			attr_dev(g, "class", "svelte-1ou6dhf");
    			toggle_class(g, "show", /*finished*/ ctx[0]);
    			add_location(g, file$9, 18, 0, 421);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, g, anchor);
    			if (if_block) if_block.m(g, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*finished*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(g, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*finished*/ 1) {
    				toggle_class(g, "show", /*finished*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(g);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $textY;
    	let { finished = false } = $$props;
    	let { winner = "" } = $$props;
    	const textY = createTweenedStore(300);
    	validate_store(textY, "textY");
    	component_subscribe($$self, textY, value => $$invalidate(2, $textY = value));

    	onMount(() => {
    		set_store_value(textY, $textY = 200);
    	});

    	const writable_props = ["finished", "winner"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Result> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("finished" in $$props) $$invalidate(0, finished = $$props.finished);
    		if ("winner" in $$props) $$invalidate(1, winner = $$props.winner);
    	};

    	$$self.$capture_state = () => {
    		return { finished, winner, $textY };
    	};

    	$$self.$inject_state = $$props => {
    		if ("finished" in $$props) $$invalidate(0, finished = $$props.finished);
    		if ("winner" in $$props) $$invalidate(1, winner = $$props.winner);
    		if ("$textY" in $$props) textY.set($textY = $$props.$textY);
    	};

    	return [finished, winner, $textY, textY];
    }

    class Result extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { finished: 0, winner: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Result",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get finished() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set finished(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winner() {
    		throw new Error("<Result>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winner(value) {
    		throw new Error("<Result>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function do_winning_pattern(signature) {
      for (let i = 0, length = POSSIBLES.length; i < length; i++) {
        let possible = POSSIBLES[i];
        if (possible.every(value => signature.indexOf(value) !== -1)) {
          return possible;
        }
      }
      return EMPTY_STRING;
    }

    /**
     *
     * @param {string[]} board
     * @param {string} player
     * @returns {string}
     */
    function winning_pattern(board, player) {
      if (board.filter(x => x === player).length > 2) {
        return do_winning_pattern(
          board.reduce((accum, x, pos) => {
            if (x === player) {
              accum.push(pos);
            }
            return accum;
          }, [])
        );
      }
      return EMPTY_STRING;
    }

    const initialState = {
      winner: "",
      winningPattern: [],
      finished: false,
      player: CROSS,
      board: new Array(9).join("|").split("|"),
      history: []
    };

    const ACTION_TYPE_SELECT = 0;
    const ACTION_TYPE_RESET = 1;
    const ACTION_TYPE_UNDO = 2;

    function reducer(state, action) {
      switch (action.type) {
        case ACTION_TYPE_SELECT:
          return state.finished ? state : select(state, action.position);
        case ACTION_TYPE_RESET:
          return reset();
        case ACTION_TYPE_UNDO:
          return undo(state);
      }
      return state;
    }

    function select(state, position) {
      let { board, player, winner, winningPattern, finished } = state;

      if (finished || board[position] !== EMPTY_STRING) {
        return state;
      }

      // maintain history
      state.history.push({ board, player });

      board = board.slice();
      board[position] = player;

      const pattern = winning_pattern(board, player);
      const hasWinner = pattern !== EMPTY_STRING;

      return Object.assign({}, state, {
        winner: hasWinner ? player : winner,
        winningPattern: hasWinner ? pattern : winningPattern,
        player: player === CROSS ? CIRCLE : CROSS,
        board,
        finished: hasWinner || !board.some(x => x === EMPTY_STRING)
      });
    }

    function reset() {
      initialState.history = [];
      return initialState;
    }

    function undo(state) {
      const game = state.history.pop();
      return game === undefined ? state : Object.assign({}, initialState, game);
    }

    /* src/components/App.svelte generated by Svelte v3.16.5 */
    const file$a = "src/components/App.svelte";

    // (35:12) {#if !$completed}
    function create_if_block_2$2(ctx) {
    	let current;

    	const board = new Board({
    			props: {
    				board: /*$store*/ ctx[2].board,
    				finished: /*$store*/ ctx[2].finished,
    				winningPattern: /*$store*/ ctx[2].winningPattern,
    				onSelect: /*select*/ ctx[5],
    				onComplete: /*setComplete*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(board.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(board, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const board_changes = {};
    			if (dirty & /*$store*/ 4) board_changes.board = /*$store*/ ctx[2].board;
    			if (dirty & /*$store*/ 4) board_changes.finished = /*$store*/ ctx[2].finished;
    			if (dirty & /*$store*/ 4) board_changes.winningPattern = /*$store*/ ctx[2].winningPattern;
    			board.$set(board_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(board, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(35:12) {#if !$completed}",
    		ctx
    	});

    	return block;
    }

    // (49:8) {#if !$store.finished}
    function create_if_block_1$3(ctx) {
    	let current;

    	const players = new Players({
    			props: {
    				player: /*$store*/ ctx[2].player,
    				hasHistory: /*$store*/ ctx[2].history.length !== 0,
    				onUndo: /*undo*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(players.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(players, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const players_changes = {};
    			if (dirty & /*$store*/ 4) players_changes.player = /*$store*/ ctx[2].player;
    			if (dirty & /*$store*/ 4) players_changes.hasHistory = /*$store*/ ctx[2].history.length !== 0;
    			players.$set(players_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(players.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(players.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(players, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(49:8) {#if !$store.finished}",
    		ctx
    	});

    	return block;
    }

    // (55:8) {#if $store.history.length > 0}
    function create_if_block$3(ctx) {
    	let current;

    	const reset_1 = new Reset({
    			props: { onReset: /*reset*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(reset_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(reset_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(reset_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(reset_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(reset_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(55:8) {#if $store.history.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let div0;
    	let svg;
    	let if_block0_anchor;
    	let t0;
    	let div1;
    	let t1;
    	let current;
    	let if_block0 = !/*$completed*/ ctx[1] && create_if_block_2$2(ctx);

    	const result = new Result({
    			props: {
    				finished: /*$store*/ ctx[2].finished,
    				winner: /*$store*/ ctx[2].winner
    			},
    			$$inline: true
    		});

    	let if_block1 = !/*$store*/ ctx[2].finished && create_if_block_1$3(ctx);
    	let if_block2 = /*$store*/ ctx[2].history.length > 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			create_component(result.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(svg, "viewBox", "0 0 300 300");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "preserveAspectRatio", "xMinYMin meet");
    			attr_dev(svg, "width", "300");
    			attr_dev(svg, "height", "300");
    			attr_dev(svg, "class", "svelte-1k3foh7");
    			add_location(svg, file$a, 28, 8, 868);
    			attr_dev(div0, "class", "board svelte-1k3foh7");
    			add_location(div0, file$a, 27, 4, 840);
    			attr_dev(div1, "class", "toolbar");
    			add_location(div1, file$a, 47, 4, 1468);
    			attr_dev(div2, "class", "app svelte-1k3foh7");
    			add_location(div2, file$a, 26, 0, 818);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg);
    			if (if_block0) if_block0.m(svg, null);
    			append_dev(svg, if_block0_anchor);
    			mount_component(result, svg, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*$completed*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(svg, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const result_changes = {};
    			if (dirty & /*$store*/ 4) result_changes.finished = /*$store*/ ctx[2].finished;
    			if (dirty & /*$store*/ 4) result_changes.winner = /*$store*/ ctx[2].winner;
    			result.$set(result_changes);

    			if (!/*$store*/ ctx[2].finished) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$store*/ ctx[2].history.length > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(result.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(result.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			destroy_component(result);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $completed;

    	let $store,
    		$$unsubscribe_store = noop,
    		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(2, $store = $$value)), store);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
    	let { store } = $$props;
    	validate_store(store, "store");
    	$$subscribe_store();
    	const completed = writable(false);
    	validate_store(completed, "completed");
    	component_subscribe($$self, completed, value => $$invalidate(1, $completed = value));
    	const setComplete = () => completed.set(true);
    	const select = position => store.dispatch({ type: ACTION_TYPE_SELECT, position });
    	const undo = () => store.dispatch({ type: ACTION_TYPE_UNDO });

    	const reset = () => {
    		store.dispatch({ type: ACTION_TYPE_RESET });
    		completed.set(false);
    	};

    	const writable_props = ["store"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("store" in $$props) $$subscribe_store($$invalidate(0, store = $$props.store));
    	};

    	$$self.$capture_state = () => {
    		return { store, $completed, $store };
    	};

    	$$self.$inject_state = $$props => {
    		if ("store" in $$props) $$subscribe_store($$invalidate(0, store = $$props.store));
    		if ("$completed" in $$props) completed.set($completed = $$props.$completed);
    		if ("$store" in $$props) store.set($store = $$props.$store);
    	};

    	return [store, $completed, $store, completed, setComplete, select, undo, reset];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { store: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*store*/ ctx[0] === undefined && !("store" in props)) {
    			console.warn("<App> was created without expected prop 'store'");
    		}
    	}

    	get store() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set store(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Svelte does not compare objects
     * https://github.com/sveltejs/svelte/issues/2171
     * and therefore store.update notifies subscribers, even if same object is
     * returned. Otherwise the method could be much simpler:
     * const dispatch = action => update(state => reducer(state, action));
     *
     * @param {function} reducer
     * @param {*} initialState
     */
    function createStore$1(reducer, initialState = {}) {
      const store = writable(initialState);

      const dispatch = action => {
        const current_state = get_store_value(store);
        const next_state = reducer(current_state, action);
        const promise = Promise.resolve(next_state);

        if (promise == next_state) {
          promise.then(state => {
            if (get_store_value(store) !== state) {
              store.set(state);
            }
          });
        }

        if (current_state !== next_state) {
          store.set(next_state);
        }
      };

      return {
        subscribe: store.subscribe,
        dispatch
      };
    }

    const app = new App({
      target: document.body,
      props: {
        store: createStore$1(reducer, initialState)
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

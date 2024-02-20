<script lang="ts">
	import { onMount } from 'svelte';
	import { LD, type LDClentID, type LDContext } from './launchDarkly.js';

	export let clientID: LDClentID;
	export let context: LDContext;
	const { initialize, intializing } = LD;

	onMount(() => {
		initialize(clientID, context);
	});
</script>

{#if $$slots.initializing && $intializing}
	<slot name="initializing">Loading flags (default loading slot value)...</slot>
{:else}
	<slot />
{/if}

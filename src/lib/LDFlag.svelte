<script lang="ts">
    import { LD, type LDFlagsValue } from "./launchDarkly.js";
  
    export let flag: string;
    export let matches: LDFlagsValue = true;
  
    $: flagValue = LD.watch(flag);
  </script>
  
  {#if $flagValue === matches}
    <slot name="on" />
  {:else}
    <slot name="off" />
  {/if}
  
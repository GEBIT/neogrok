<script lang="ts">
  export let to: string;
  export let tooltip: string | undefined = undefined;
</script>

<a
  class="text-cyan-700 dark:text-cyan-400 hover:underline decoration-1"
  href={to} title={tooltip}
>
  <slot />
</a>

<script lang="ts">
  type Props = {
    class?: string;
  };

  let { class: className = "", children }: Props = $props();
</script>

<article class={`card ${className}`}>
  {@render children?.()}
</article>

<style>
  .card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--card) 94%, transparent);
    color: var(--card-foreground);
    box-shadow: var(--shadow);
  }
</style>

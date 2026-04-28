<script lang="ts">
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

  type Variant = "primary" | "secondary" | "ghost" | "outline";
  type Size = "sm" | "md" | "icon";

  type Props = {
    href?: string;
    variant?: Variant;
    size?: Size;
    class?: string;
    "aria-label"?: string;
    onclick?: HTMLButtonAttributes["onclick"];
  } & HTMLButtonAttributes &
    HTMLAnchorAttributes;

  let {
    href,
    variant = "primary",
    size = "md",
    class: className = "",
    children,
    ...rest
  }: Props = $props();
</script>

{#if href}
  <a class={`btn btn-${variant} btn-${size} ${className}`} href={href} {...rest}>
    {@render children?.()}
  </a>
{:else}
  <button class={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
    {@render children?.()}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px solid transparent;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 800;
    line-height: 1;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      background 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease;
    white-space: nowrap;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn:focus-visible {
    outline: 3px solid var(--ring);
    outline-offset: 2px;
  }

  .btn-md {
    min-height: 44px;
    padding: 0 1rem;
    font-size: 0.95rem;
  }

  .btn-sm {
    min-height: 38px;
    padding: 0 0.78rem;
    font-size: 0.88rem;
  }

  .btn-icon {
    width: 42px;
    height: 42px;
    padding: 0;
  }

  .btn-primary {
    background: var(--primary);
    color: var(--primary-foreground);
    box-shadow: 0 12px 28px rgba(17, 131, 67, 0.22);
  }

  .btn-primary:hover {
    background: var(--primary-strong);
  }

  .btn-secondary {
    background: var(--secondary);
    color: var(--secondary-foreground);
  }

  .btn-ghost {
    background: transparent;
    color: var(--foreground);
  }

  .btn-ghost:hover {
    background: var(--muted);
  }

  .btn-outline {
    background: color-mix(in srgb, var(--card) 72%, transparent);
    border-color: var(--border);
    color: var(--foreground);
  }

  .btn-outline:hover {
    border-color: var(--primary);
    color: var(--primary-strong);
  }
</style>

<script lang="ts">
  import { Moon, Sun } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";

  let dark = $state(false);

  function syncFromDocument() {
    dark = document.documentElement.classList.contains("dark");
  }

  function toggleTheme() {
    dark = !dark;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }

  $effect(() => {
    syncFromDocument();
  });
</script>

<Button
  variant="outline"
  size="icon"
  aria-label={dark ? "Açık moda geç" : "Koyu moda geç"}
  title={dark ? "Açık mod" : "Koyu mod"}
  onclick={toggleTheme}
>
  {#if dark}
    <Sun size={18} strokeWidth={2.4} />
  {:else}
    <Moon size={18} strokeWidth={2.4} />
  {/if}
</Button>

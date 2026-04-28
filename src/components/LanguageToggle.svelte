<script lang="ts">
  import Button from "@/components/ui/Button.svelte";
  import { getInitialLocale, setLocale, type Locale } from "@/lib/i18n";

  let locale = $state<Locale>("tr");

  function toggleLocale() {
    locale = locale === "tr" ? "en" : "tr";
    setLocale(locale);
  }

  $effect(() => {
    locale = getInitialLocale();
    document.documentElement.lang = locale;
  });
</script>

<Button
  variant="outline"
  size="sm"
  class="language-toggle"
  aria-label={locale === "tr" ? "Switch to English" : "Türkçeye geç"}
  title={locale === "tr" ? "English" : "Türkçe"}
  onclick={toggleLocale}
>
  {locale === "tr" ? "EN" : "TR"}
</Button>

<style>
  :global(.language-toggle) {
    min-width: 44px;
    padding-inline: 0.7rem;
  }
</style>

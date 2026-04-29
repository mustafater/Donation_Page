<script lang="ts">
  import { HandHeart, Menu, X } from "lucide-svelte";
  import LanguageToggle from "@/components/LanguageToggle.svelte";
  import Button from "@/components/ui/Button.svelte";
  import ThemeToggle from "@/components/ThemeToggle.svelte";
  import WalletNav from "@/components/WalletNav.svelte";
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const copy = {
    tr: {
      tagline: "Güvenli bağış köprüsü",
      login: "Giriş Yap",
      donate: "Bağış Yap",
      openMenu: "Menüyü aç",
      closeMenu: "Menüyü kapat",
      links: [
        { href: "#hikaye", label: "Hikaye" },
        { href: "#bagislar", label: "Bağışlar" },
        { href: "#guven", label: "Güven" },
        { href: "#iletisim", label: "İletişim" },
      ],
    },
    en: {
      tagline: "Trusted donation bridge",
      login: "Log In",
      donate: "Donate",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      links: [
        { href: "#hikaye", label: "Story" },
        { href: "#bagislar", label: "Donations" },
        { href: "#guven", label: "Trust" },
        { href: "#iletisim", label: "Contact" },
      ],
    },
  };

  let open = $state(false);
  let locale = $state<Locale>("tr");
  let t = $derived(copy[locale]);

  $effect(() => subscribeLocale((value) => (locale = value)));
</script>

<header class="site-header">
  <nav class="container nav" aria-label="Ana menü">
    <a class="brand" href="/" aria-label="Hilal Kurban ana sayfa">
      <span class="brand-mark"><HandHeart size={23} strokeWidth={2.5} /></span>
      <span>
        <strong>Hilal Kurban</strong>
        <small>{t.tagline}</small>
      </span>
    </a>

    <div class="desktop-links">
      {#each t.links as link}
        <a href={link.href}>{link.label}</a>
      {/each}
    </div>

    <div class="actions">
      <ThemeToggle />
      <LanguageToggle />
      <WalletNav />
      <Button href="#login" variant="ghost" class="login-btn">{t.login}</Button>
      <Button href="#bagislar">{t.donate}</Button>
      <span class="mobile-menu-control">
        <Button
          variant="outline"
          size="icon"
          aria-label={open ? t.closeMenu : t.openMenu}
          onclick={() => (open = !open)}
        >
          {#if open}
            <X size={20} />
          {:else}
            <Menu size={20} />
          {/if}
        </Button>
      </span>
    </div>
  </nav>

  {#if open}
    <div class="mobile-panel">
      <div class="container mobile-panel-inner">
        {#each t.links as link}
          <a href={link.href} onclick={() => (open = false)}>{link.label}</a>
        {/each}
        <Button href="#login" variant="outline">{t.login}</Button>
        <Button href="#bagislar">{t.donate}</Button>
      </div>
    </div>
  {/if}
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 72%, transparent);
    background: color-mix(in srgb, var(--background) 88%, transparent);
    backdrop-filter: blur(18px);
  }

  .nav {
    display: grid;
    grid-template-columns: auto minmax(300px, 1fr) auto;
    align-items: center;
    min-height: 76px;
    gap: clamp(10px, 1.5vw, 22px);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.74rem;
    width: fit-content;
  }

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius);
    background: var(--primary);
    color: var(--primary-foreground);
    box-shadow: 0 12px 28px rgba(17, 131, 67, 0.2);
  }

  .brand strong,
  .brand small {
    display: block;
  }

  .brand strong {
    font-size: 1rem;
  }

  .brand small {
    margin-top: 3px;
    color: var(--muted-foreground);
    font-size: 0.76rem;
    font-weight: 700;
  }

  .desktop-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: fit-content;
    justify-self: center;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--card) 78%, transparent);
  }

  .desktop-links a {
    border-radius: 6px;
    padding: 0.62rem 0.74rem;
    color: var(--muted-foreground);
    font-size: 0.92rem;
    font-weight: 800;
  }

  .desktop-links a:hover {
    background: var(--secondary);
    color: var(--secondary-foreground);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.38rem;
    min-width: 0;
    white-space: nowrap;
  }

  .mobile-menu-control {
    display: none;
  }

  .mobile-panel {
    border-top: 1px solid var(--border);
    background: var(--background);
  }

  .mobile-panel-inner {
    display: grid;
    gap: 10px;
    padding: 16px 0 18px;
  }

  .mobile-panel a:not(.btn) {
    border-radius: var(--radius);
    padding: 0.8rem 0.9rem;
    background: var(--muted);
    color: var(--foreground);
    font-weight: 800;
  }

  @media (max-width: 1240px) {
    :global(.login-btn) {
      display: none;
    }

    .brand small {
      display: none;
    }
  }

  @media (max-width: 1080px) {
    .nav {
      grid-template-columns: 1fr auto;
    }

    .desktop-links,
    :global(.login-btn),
    .actions > :global(.btn-primary) {
      display: none;
    }

    .mobile-menu-control {
      display: inline-flex;
    }
  }

  @media (max-width: 440px) {
    .brand small {
      display: none;
    }

    .brand-mark {
      width: 40px;
      height: 40px;
    }
  }
</style>

<script lang="ts">
  import { LogOut, RefreshCw, Wallet } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import { formatXlmBalance } from "@/lib/wallet/adapter";
  import { connectWallet, disconnectWallet, refreshBalance, walletState } from "@/lib/wallet/state";
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const copy = {
    tr: {
      connect: "Cüzdan Bağla",
      connecting: "Bağlanıyor",
      disconnect: "Bağlantıyı kes",
      refresh: "Bakiyeyi yenile",
      balance: "XLM",
      openInBrowser: "Chrome/Brave'de aç",
      chooseWallet: "Wallet seç",
      available: "Aktif",
      comingSoon: "Yakında",
      kitReady: "StellarWalletsKit",
      modalTitle: "Wallet Integration",
      modalText: "Stellar ekosistem cüzdanları",
    },
    en: {
      connect: "Connect Wallet",
      connecting: "Connecting",
      disconnect: "Disconnect wallet",
      refresh: "Refresh balance",
      balance: "XLM",
      openInBrowser: "Open in Chrome/Brave",
      chooseWallet: "Choose wallet",
      available: "Active",
      comingSoon: "Soon",
      kitReady: "StellarWalletsKit",
      modalTitle: "Wallet Integration",
      modalText: "Stellar ecosystem wallets",
    },
  };

  const walletOptions = [
    {
      id: "freighter",
      name: "Freighter",
      description: "Browser extension",
      enabled: true,
      url: "https://freighter.app/",
    },
    {
      id: "albedo",
      name: "Albedo",
      description: "Web wallet",
      enabled: false,
      url: "https://albedo.link/",
    },
    {
      id: "xbull",
      name: "xBull",
      description: "Stellar wallet",
      enabled: false,
      url: "https://xbull.app/",
    },
    {
      id: "lobstr",
      name: "LOBSTR",
      description: "Mobile wallet",
      enabled: false,
      url: "https://lobstr.co/",
    },
  ];

  let locale = $state<Locale>("tr");
  let pickerOpen = $state(false);
  let t = $derived(copy[locale]);
  let currentUrl = $state("http://127.0.0.1:4321/");
  let showBrowserHint = $derived(Boolean($walletState.errorCode === "wallet_unavailable"));

  async function connectSelectedWallet(id: string) {
    if (id !== "freighter") {
      return;
    }

    pickerOpen = false;
    await connectWallet();
  }

  $effect(() => subscribeLocale((value) => (locale = value)));

  $effect(() => {
    if (typeof window !== "undefined") {
      currentUrl = window.location.href;
    }
  });
</script>

<div class="wallet-nav">
  {#if $walletState.session}
    <div class="wallet-chip" title={$walletState.session.address}>
      <span>{$walletState.shortAddress}</span>
      {#if $walletState.balance}
        <strong>{formatXlmBalance($walletState.balance)} {t.balance}</strong>
      {/if}
    </div>
    <Button
      variant="outline"
      size="icon"
      aria-label={t.refresh}
      title={t.refresh}
      disabled={$walletState.status === "sending" || $walletState.status === "connecting"}
      onclick={refreshBalance}
    >
      <RefreshCw size={17} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      aria-label={t.disconnect}
      title={t.disconnect}
      onclick={disconnectWallet}
    >
      <LogOut size={17} />
    </Button>
  {:else}
    <div class="wallet-picker-wrap">
      <Button
        variant="outline"
        class="wallet-connect"
        disabled={$walletState.status === "connecting"}
        aria-expanded={pickerOpen}
        onclick={() => (pickerOpen = !pickerOpen)}
      >
        <Wallet size={17} />
        {$walletState.status === "connecting" ? t.connecting : t.connect}
      </Button>

      {#if pickerOpen}
        <div class="wallet-picker" role="menu" aria-label={t.chooseWallet}>
          <div class="wallet-picker-head">
            <span>{t.modalTitle}</span>
            <small>{t.modalText}</small>
          </div>
          {#each walletOptions as option}
            <button
              type="button"
              role="menuitem"
              class:disabled={!option.enabled}
              disabled={!option.enabled || $walletState.status === "connecting"}
              onclick={() => connectSelectedWallet(option.id)}
            >
              <span class="wallet-avatar">{option.name.slice(0, 1)}</span>
              <span>
                <strong>{option.name}</strong>
                <small>{option.description} · {t.kitReady}</small>
              </span>
              <em>{option.enabled ? t.available : t.comingSoon}</em>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if $walletState.error}
    <span class="wallet-error" title={$walletState.error} role="alert">{$walletState.error}</span>
  {/if}

  {#if showBrowserHint}
    <a class="wallet-open-link" href={currentUrl} target="_blank" rel="noreferrer">{t.openInBrowser}</a>
  {/if}
</div>

<style>
  .wallet-nav {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .wallet-picker-wrap {
    position: relative;
  }

  .wallet-picker {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    z-index: 60;
    display: grid;
    gap: 10px;
    width: min(360px, calc(100vw - 28px));
    border: 1px solid color-mix(in srgb, var(--border) 82%, #111827);
    border-radius: 12px;
    padding: 12px;
    background: var(--card);
    box-shadow: 0 18px 45px rgba(8, 17, 34, 0.16);
  }

  .wallet-picker::before {
    content: "";
    position: absolute;
    top: -6px;
    right: 30px;
    width: 10px;
    height: 10px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, #111827);
    border-left: 1px solid color-mix(in srgb, var(--border) 82%, #111827);
    background: var(--card);
    transform: rotate(45deg);
  }

  .wallet-picker-head {
    display: grid;
    gap: 3px;
    border-bottom: 1px solid var(--border);
    padding: 2px 4px 11px;
  }

  .wallet-picker-head span {
    color: var(--foreground);
    font-size: 0.92rem;
    font-weight: 900;
  }

  .wallet-picker-head small {
    color: var(--muted-foreground);
    font-size: 0.76rem;
    font-weight: 800;
  }

  .wallet-picker button {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 11px;
    align-items: center;
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--border) 86%, #111827);
    border-radius: 10px;
    padding: 11px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--card) 94%, #ffffff), var(--card));
    color: var(--foreground);
    text-align: left;
    cursor: pointer;
  }

  .wallet-picker button:hover:not(:disabled) {
    border-color: #5b6cff;
    background:
      linear-gradient(180deg, color-mix(in srgb, #eef2ff 58%, var(--card)), var(--card));
    box-shadow: 0 8px 22px rgba(70, 86, 220, 0.12);
  }

  .wallet-picker button.disabled,
  .wallet-picker button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .wallet-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid color-mix(in srgb, var(--border) 72%, #5b6cff);
    border-radius: 10px;
    background: color-mix(in srgb, #f6f8ff 74%, var(--card));
    color: #3444d8;
    font-weight: 900;
  }

  .wallet-picker strong,
  .wallet-picker small {
    display: block;
  }

  .wallet-picker small {
    margin-top: 3px;
    color: var(--muted-foreground);
    font-size: 0.76rem;
    font-weight: 800;
    white-space: normal;
  }

  .wallet-picker em {
    border: 1px solid color-mix(in srgb, var(--border) 80%, #111827);
    border-radius: 999px;
    padding: 0.25rem 0.44rem;
    color: var(--muted-foreground);
    font-size: 0.68rem;
    font-style: normal;
    font-weight: 900;
  }

  .wallet-picker button:not(:disabled) em {
    border-color: color-mix(in srgb, #5b6cff 45%, var(--border));
    background: color-mix(in srgb, #eef2ff 74%, var(--card));
    color: #3444d8;
  }

  .wallet-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    min-height: 40px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0 0.62rem;
    background: color-mix(in srgb, var(--card) 78%, transparent);
    color: var(--foreground);
    font-size: 0.86rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .wallet-chip strong {
    color: var(--primary-strong);
    font-size: 0.78rem;
  }

  .wallet-error {
    max-width: 220px;
    overflow: hidden;
    color: #dc2626;
    font-size: 0.78rem;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wallet-open-link {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.58rem 0.68rem;
    background: var(--secondary);
    color: var(--secondary-foreground);
    font-size: 0.78rem;
    font-weight: 900;
  }

  @media (max-width: 1320px) {
    .wallet-error {
      max-width: 180px;
    }
  }

  @media (max-width: 1180px) {
    .wallet-chip strong {
      display: none;
    }
  }

  @media (max-width: 1080px) {
    :global(.actions) > .wallet-nav {
      display: none;
    }
  }

  :global(.mobile-panel) .wallet-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
  }

  :global(.mobile-panel) .wallet-picker-wrap {
    width: 100%;
  }

  :global(.mobile-panel) .wallet-connect {
    width: 100%;
    justify-content: center;
  }

  :global(.mobile-panel) .wallet-picker {
    position: static;
    width: 100%;
    margin-top: 10px;
    box-shadow: none;
  }

  :global(.mobile-panel) .wallet-picker::before {
    display: none;
  }

  :global(.mobile-panel) .wallet-error {
    max-width: none;
    width: 100%;
    white-space: normal;
  }

  :global(.mobile-panel) .wallet-open-link {
    text-align: center;
  }
</style>

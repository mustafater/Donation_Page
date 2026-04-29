<script lang="ts">
  import { LogOut, RefreshCw, Wallet } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import { connectWallet, disconnectWallet, refreshBalance, walletState } from "@/lib/wallet/state";
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const copy = {
    tr: {
      connect: "Cüzdan Bağla",
      connecting: "Bağlanıyor",
      disconnect: "Bağlantıyı kes",
      refresh: "Bakiyeyi yenile",
      balance: "XLM",
    },
    en: {
      connect: "Connect Wallet",
      connecting: "Connecting",
      disconnect: "Disconnect wallet",
      refresh: "Refresh balance",
      balance: "XLM",
    },
  };

  let locale = $state<Locale>("tr");
  let t = $derived(copy[locale]);

  $effect(() => subscribeLocale((value) => (locale = value)));
</script>

<div class="wallet-nav">
  {#if $walletState.session}
    <div class="wallet-chip" title={$walletState.session.address}>
      <span>{$walletState.shortAddress}</span>
      {#if $walletState.balance}
        <strong>{Number($walletState.balance).toFixed(2)} {t.balance}</strong>
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
    <Button
      variant="outline"
      class="wallet-connect"
      disabled={$walletState.status === "connecting"}
      onclick={connectWallet}
    >
      <Wallet size={17} />
      {$walletState.status === "connecting" ? t.connecting : t.connect}
    </Button>
  {/if}

  {#if $walletState.error}
    <span class="wallet-error" title={$walletState.error}>{$walletState.error}</span>
  {/if}
</div>

<style>
  .wallet-nav {
    display: flex;
    align-items: center;
    gap: 0.45rem;
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

  @media (max-width: 1320px) {
    .wallet-error {
      display: none;
    }
  }

  @media (max-width: 1180px) {
    .wallet-chip strong {
      display: none;
    }
  }

  @media (max-width: 1080px) {
    .wallet-nav {
      display: none;
    }
  }
</style>

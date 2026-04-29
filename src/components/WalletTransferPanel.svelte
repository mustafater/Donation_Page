<script lang="ts">
  import { CheckCircle2, ExternalLink, RefreshCw, Send, TriangleAlert, Wallet } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import Card from "@/components/ui/Card.svelte";
  import {
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendPayment,
    walletState,
  } from "@/lib/wallet/state";
  import {
    NETWORK_FEE_BUFFER_XLM,
    STELLAR_TESTNET,
    formatXlmBalance,
    validateAmount,
    validatePublicKey,
    type WalletErrorCode,
  } from "@/lib/wallet/adapter";
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const copy = {
    tr: {
      eyebrow: "Stellar Testnet",
      title: "Stellar cüzdan ile Testnet XLM bağışı gönder",
      text: "Stellar cüzdanını Testnet ağına al, bakiyeni gör ve test amaçlı XLM transferi gönder.",
      install: "Cüzdan listesinde uygun bir Stellar wallet seçip Testnet ağına geçmelisin.",
      connect: "Cüzdan Bağla",
      connecting: "Bağlanıyor",
      disconnect: "Bağlantıyı Kes",
      refresh: "Bakiyeyi Yenile",
      connected: "Bağlı cüzdan",
      balance: "Bakiye",
      recipient: "Alıcı Stellar adresi",
      recipientPlaceholder: "G... ile başlayan testnet adresi",
      amount: "Miktar",
      amountPlaceholder: "Örn. 1.5",
      send: "XLM Gönder",
      sending: "Gönderiliyor",
      success: "İşlem başarıyla gönderildi.",
      txHash: "İşlem hash'i",
      network: "Ağ",
      explorer: "Explorer'da aç",
      needConnect: "Transfer göndermek için önce Stellar cüzdanını bağla.",
      ready: "Form hazır. Cüzdan imzasıyla Testnet XLM gönderebilirsin.",
      feeNote: "Ağ ücreti için küçük bir XLM payı ayrılır.",
      formErrors: {
        recipientRequired: "Alıcı Stellar adresini gir.",
        recipientInvalid: "Alıcı adresi G ile başlayan geçerli bir Stellar public key olmalı.",
        amountRequired: "Göndermek istediğin XLM miktarını gir.",
        amountInvalid: "Miktar pozitif olmalı ve en fazla 7 decimal içermeli.",
        insufficientBalance: "Miktar, ağ ücreti payı ayrıldıktan sonra kullanılabilir bakiyeyi aşıyor.",
      },
      errors: {
        wallet_unavailable: "Bu tarayıcıda desteklenen Stellar wallet bulunamadı. Wallet kurup tekrar dene.",
        wallet_rejected: "Cüzdan bağlantısı onaylanmadı. Cüzdan kilitliyse açıp tekrar dene.",
        wallet_address_missing: "Cüzdan adresi alınamadı. Cüzdanı açıp tekrar deneyebilirsin.",
        wrong_network: "Cüzdan ağını Stellar Testnet olarak değiştirip tekrar dene.",
        invalid_recipient: "Alıcı adresi geçerli bir Stellar public key değil.",
        invalid_amount: "Miktar pozitif olmalı ve en fazla 7 decimal içermeli.",
        insufficient_balance: "Bu transfer için XLM bakiyesi yetersiz.",
        sign_rejected: "İmzalama penceresi reddedildi veya kapatıldı.",
        destination_missing: "Alıcı Testnet hesabı bulunamadı. Önce alıcı hesabı fund edilmiş olmalı.",
        horizon_error: "İşlem Stellar Testnet'e gönderilemedi. Biraz sonra tekrar dene.",
        rpc_error: "Stellar RPC yanıt vermedi. Biraz sonra tekrar dene.",
        contract_error: "Contract işlemi tamamlanamadı. Yapılandırmayı kontrol et.",
        unknown: "İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar dene.",
      } satisfies Record<WalletErrorCode, string>,
    },
    en: {
      eyebrow: "Stellar Testnet",
      title: "Send Testnet XLM with a Stellar wallet",
      text: "Switch your Stellar wallet to Testnet, view your balance, and send a test XLM transfer.",
      install: "Pick a compatible Stellar wallet from the modal and switch it to Testnet.",
      connect: "Connect Wallet",
      connecting: "Connecting",
      disconnect: "Disconnect",
      refresh: "Refresh Balance",
      connected: "Connected wallet",
      balance: "Balance",
      recipient: "Recipient Stellar address",
      recipientPlaceholder: "Testnet address starting with G...",
      amount: "Amount",
      amountPlaceholder: "E.g. 1.5",
      send: "Send XLM",
      sending: "Sending",
      success: "Transaction submitted successfully.",
      txHash: "Transaction hash",
      network: "Network",
      explorer: "Open in explorer",
      needConnect: "Connect a Stellar wallet before sending a transfer.",
      ready: "Form is ready. You can send Testnet XLM with a wallet signature.",
      feeNote: "A small XLM buffer is reserved for the network fee.",
      formErrors: {
        recipientRequired: "Enter a recipient Stellar address.",
        recipientInvalid: "Recipient must be a valid Stellar public key starting with G.",
        amountRequired: "Enter the XLM amount you want to send.",
        amountInvalid: "Amount must be positive and use up to 7 decimal places.",
        insufficientBalance: "Amount exceeds the available balance after the network fee buffer.",
      },
      errors: {
        wallet_unavailable: "No supported Stellar wallet was found in this browser. Install a wallet and try again.",
        wallet_rejected: "Wallet access was not approved. Unlock the wallet and try again.",
        wallet_address_missing: "Could not read the wallet address. Open the wallet and try again.",
        wrong_network: "Switch your wallet to Stellar Testnet and try again.",
        invalid_recipient: "Recipient address is not a valid Stellar public key.",
        invalid_amount: "Amount must be positive and use up to 7 decimal places.",
        insufficient_balance: "The XLM balance is not enough for this transfer.",
        sign_rejected: "The signing prompt was rejected or closed.",
        destination_missing: "Recipient Testnet account was not found. The recipient must be funded first.",
        horizon_error: "The transaction could not be submitted to Stellar Testnet. Try again shortly.",
        rpc_error: "Stellar RPC did not respond. Try again shortly.",
        contract_error: "The contract action could not be completed. Check the configuration.",
        unknown: "The transaction could not be completed. Check the details and try again.",
      } satisfies Record<WalletErrorCode, string>,
    },
  };

  let locale = $state<Locale>("tr");
  let destination = $state("");
  let amount = $state("");
  let t = $derived(copy[locale]);
  let explorerUrl = $derived(
    $walletState.txHash
      ? `https://stellar.expert/explorer/testnet/tx/${$walletState.txHash}`
      : "",
  );
  let trimmedDestination = $derived(destination.trim());
  let trimmedAmount = $derived(amount.trim());
  let hasStartedForm = $derived(trimmedDestination.length > 0 || trimmedAmount.length > 0);
  let formError = $derived.by(() => {
    if (!$walletState.session || !hasStartedForm) {
      return "";
    }

    if (!trimmedDestination) {
      return t.formErrors.recipientRequired;
    }

    if (!validatePublicKey(trimmedDestination)) {
      return t.formErrors.recipientInvalid;
    }

    if (!trimmedAmount) {
      return t.formErrors.amountRequired;
    }

    if (!validateAmount(trimmedAmount)) {
      return t.formErrors.amountInvalid;
    }

    if (
      $walletState.balance !== null &&
      Number(trimmedAmount) + NETWORK_FEE_BUFFER_XLM > Number($walletState.balance)
    ) {
      return t.formErrors.insufficientBalance;
    }

    return "";
  });
  let canSend = $derived(Boolean($walletState.session) && !formError && $walletState.status !== "sending");
  let feedbackError = $derived(
    $walletState.errorCode ? t.errors[$walletState.errorCode] : $walletState.error,
  );

  async function submitPayment() {
    if (!canSend) {
      return;
    }

    await sendPayment(trimmedDestination, trimmedAmount);
  }

  $effect(() => subscribeLocale((value) => (locale = value)));

  $effect(() => {
    if (!$walletState.session) {
      destination = "";
      amount = "";
    }
  });
</script>

<Card class="wallet-panel">
  <div class="wallet-panel-head">
    <div>
      <p class="eyebrow">{t.eyebrow}</p>
      <h3>{t.title}</h3>
      <p>{t.text}</p>
    </div>
    <div class="network-pill">
      <span>{t.network}</span>
      <strong>{STELLAR_TESTNET.name}</strong>
    </div>
  </div>

  <div class="wallet-status-grid">
    <div class="status-box">
      <span>{t.connected}</span>
      <strong>{$walletState.shortAddress || "-"}</strong>
    </div>
    <div class="status-box">
      <span>{t.balance}</span>
      <strong>{$walletState.balance ? `${formatXlmBalance($walletState.balance)} XLM` : "-"}</strong>
    </div>
  </div>

  <div class="wallet-actions">
    {#if $walletState.session}
      <Button variant="outline" onclick={refreshBalance} disabled={$walletState.status === "sending"}>
        <RefreshCw size={17} />
        {t.refresh}
      </Button>
      <Button variant="ghost" onclick={disconnectWallet} disabled={$walletState.status === "sending"}>
        {t.disconnect}
      </Button>
    {:else}
      <Button onclick={connectWallet} disabled={$walletState.status === "connecting"}>
        <Wallet size={17} />
        {$walletState.status === "connecting" ? t.connecting : t.connect}
      </Button>
    {/if}
  </div>

  <form class="transfer-form" onsubmit={(event) => { event.preventDefault(); submitPayment(); }}>
    <label>
      <span>{t.recipient}</span>
      <input
        bind:value={destination}
        disabled={!$walletState.session || $walletState.status === "sending"}
        aria-invalid={Boolean(formError && trimmedDestination && !validatePublicKey(trimmedDestination))}
        placeholder={t.recipientPlaceholder}
        autocomplete="off"
      />
    </label>
    <label>
      <span>{t.amount}</span>
      <input
        bind:value={amount}
        disabled={!$walletState.session || $walletState.status === "sending"}
        aria-invalid={Boolean(formError && trimmedAmount && !validateAmount(trimmedAmount))}
        inputmode="decimal"
        placeholder={t.amountPlaceholder}
        autocomplete="off"
      />
    </label>
    <Button
      type="submit"
      disabled={!canSend}
      class="send-button"
    >
      <Send size={17} />
      {$walletState.status === "sending" ? t.sending : t.send}
    </Button>
  </form>

  {#if formError}
    <p class="form-note error" role="status"><TriangleAlert size={16} /> {formError}</p>
  {:else if $walletState.session}
    <p class="form-note ready"><CheckCircle2 size={16} /> {t.ready} {t.feeNote}</p>
  {/if}

  {#if !$walletState.session && $walletState.status !== "error"}
    <p class="hint"><TriangleAlert size={16} /> {t.needConnect} {t.install}</p>
  {/if}

  {#if feedbackError}
    <p class="feedback error" role="alert"><TriangleAlert size={17} /> {feedbackError}</p>
  {/if}

  {#if $walletState.status === "success" && $walletState.txHash}
    <div class="feedback success" role="status">
      <CheckCircle2 size={18} />
      <div>
        <strong>{t.success}</strong>
        <span>{t.txHash}: {$walletState.txHash}</span>
        <a href={explorerUrl} target="_blank" rel="noreferrer">
          {t.explorer}
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  {/if}
</Card>

<style>
  :global(.wallet-panel) {
    margin-top: 28px;
    padding: 24px;
  }

  .wallet-panel-head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
  }

  h3 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.3rem);
    line-height: 1.1;
  }

  p {
    margin: 12px 0 0;
    color: var(--muted-foreground);
    line-height: 1.65;
  }

  .network-pill,
  .status-box {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--muted);
  }

  .network-pill {
    display: grid;
    gap: 4px;
    min-width: 148px;
    padding: 12px 14px;
  }

  .network-pill span,
  .status-box span,
  label span {
    color: var(--muted-foreground);
    font-size: 0.82rem;
    font-weight: 800;
  }

  .network-pill strong,
  .status-box strong {
    color: var(--foreground);
  }

  .wallet-status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 22px;
  }

  .status-box {
    display: grid;
    gap: 8px;
    padding: 16px;
    min-width: 0;
  }

  .status-box strong {
    overflow-wrap: anywhere;
  }

  .wallet-actions,
  .transfer-form {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .transfer-form {
    display: grid;
    grid-template-columns: minmax(240px, 1.4fr) minmax(150px, 0.6fr) auto;
    align-items: end;
  }

  label {
    display: grid;
    gap: 8px;
  }

  input {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0 0.9rem;
    background: var(--card);
    color: var(--foreground);
    outline: none;
  }

  input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--ring);
  }

  input[aria-invalid="true"] {
    border-color: #ef4444;
  }

  input:disabled {
    cursor: not-allowed;
    opacity: 0.66;
  }

  .send-button {
    min-width: 132px;
  }

  .hint,
  .form-note,
  .feedback {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border-radius: var(--radius);
    padding: 13px 14px;
  }

  .form-note {
    margin-top: 14px;
    font-size: 0.9rem;
    font-weight: 800;
  }

  .form-note.error {
    border: 1px solid color-mix(in srgb, #ef4444 45%, var(--border));
    background: color-mix(in srgb, #ef4444 10%, var(--card));
    color: var(--foreground);
  }

  .form-note.ready {
    border: 1px solid color-mix(in srgb, var(--primary) 42%, var(--border));
    background: color-mix(in srgb, var(--secondary) 72%, var(--card));
    color: var(--secondary-foreground);
  }

  .hint {
    border: 1px solid var(--border);
    background: var(--muted);
  }

  .feedback.error {
    border: 1px solid color-mix(in srgb, #ef4444 54%, var(--border));
    background: color-mix(in srgb, #ef4444 12%, var(--card));
    color: var(--foreground);
  }

  .feedback.success {
    border: 1px solid color-mix(in srgb, var(--primary) 54%, var(--border));
    background: var(--secondary);
    color: var(--secondary-foreground);
  }

  .feedback div {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .feedback span {
    overflow-wrap: anywhere;
  }

  .feedback a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    color: var(--primary-strong);
    font-weight: 900;
  }

  @media (max-width: 780px) {
    .wallet-panel-head,
    .wallet-status-grid,
    .transfer-form {
      grid-template-columns: 1fr;
    }

    .wallet-panel-head {
      display: grid;
    }

    .send-button {
      width: 100%;
    }
  }
</style>

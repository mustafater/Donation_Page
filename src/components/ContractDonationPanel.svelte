<script lang="ts">
  import { CheckCircle2, ExternalLink, FileSignature, RefreshCw, TriangleAlert } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import Card from "@/components/ui/Card.svelte";
  import { subscribeLocale, type Locale } from "@/lib/i18n";
  import { CONTRACT_CONFIG, CONTRACT_PROGRAMS, normalizeProgram, type ContractProgramKey } from "@/lib/contract/config";
  import {
    donationContractState,
    refreshContractTotals,
    submitContractDonation,
    validateContractAmount,
  } from "@/lib/contract/state";
  import { startDonationEventPolling, type DonationEventPoller } from "@/lib/contract/events";
  import { walletState } from "@/lib/wallet/state";
  import type { WalletErrorCode } from "@/lib/wallet/adapter";

  interface Props {
    program?: string;
  }

  let { program = "qurban" }: Props = $props();
  let selectedProgram = $state<ContractProgramKey>(normalizeProgram(program));
  let amount = $state("");
  let memo = $state("");
  let locale = $state<Locale>("tr");
  let poller: DonationEventPoller | null = null;

  const copy = {
    tr: {
      eyebrow: "Soroban Testnet",
      title: "Contract bağış kaydı",
      text: "Bu alan gerçek XLM transferi yapmaz; bağış niyetini Soroban donation registry contract'ına wallet auth ile kaydeder.",
      connected: "Bağlı cüzdan",
      programTotal: "Program toplamı",
      donorTotal: "Cüzdan toplamı",
      count: "Kayıt sayısı",
      program: "Bağış türü",
      amount: "XLM miktarı",
      amountPlaceholder: "Örn. 2.5",
      memo: "Kısa not",
      memoPlaceholder: "Örn. ailem adına",
      submit: "Contract'a Kaydet",
      simulating: "Simülasyon",
      signing: "İmza bekleniyor",
      pending: "Onay bekleniyor",
      refresh: "Contract toplamlarını yenile",
      success: "Bağış kaydı contract'a yazıldı.",
      txHash: "İşlem hash'i",
      explorer: "Stellar Expert",
      needsWallet: "Contract kaydı için önce cüzdan bağla.",
      missingConfig: "Contract id eksik. Deploy script'i çalıştırıp PUBLIC_STELLAR_CONTRACT_ID değerini .env dosyasına eklemelisin.",
      formErrors: {
        amountRequired: "Contract'a yazılacak XLM miktarını gir.",
        amountInvalid: "Miktar pozitif olmalı ve en fazla 7 decimal içermeli.",
      },
      status: {
        idle: "Hazır",
        simulating: "RPC simulation çalışıyor",
        signing: "Wallet imzası bekleniyor",
        pending: "Transaction Testnet onayı bekliyor",
        success: "Başarılı",
        fail: "Başarısız",
      },
      errors: {
        wallet_unavailable: "Cüzdan bağlı değil veya desteklenen wallet bulunamadı.",
        wallet_rejected: "Cüzdan işlemi reddedildi.",
        wallet_address_missing: "Cüzdan adresi okunamadı.",
        wrong_network: "Cüzdanı Stellar Testnet ağına geçirip tekrar dene.",
        invalid_recipient: "Alıcı adresi geçerli değil.",
        invalid_amount: "Miktar pozitif olmalı ve en fazla 7 decimal içermeli.",
        insufficient_balance: "Bakiye yetersiz.",
        sign_rejected: "İmzalama reddedildi veya kapatıldı.",
        destination_missing: "Alıcı Testnet hesabı bulunamadı.",
        horizon_error: "Horizon işlemi tamamlanamadı.",
        rpc_error: "Stellar RPC yanıtından işlem tamamlanamadı.",
        contract_error: "Contract işlemi tamamlanamadı veya contract id eksik.",
        unknown: "İşlem tamamlanamadı. Bilgileri kontrol edip tekrar dene.",
      } satisfies Record<WalletErrorCode, string>,
    },
    en: {
      eyebrow: "Soroban Testnet",
      title: "Contract donation record",
      text: "This does not transfer real XLM; it records the donation intent in the Soroban registry contract with wallet auth.",
      connected: "Connected wallet",
      programTotal: "Program total",
      donorTotal: "Wallet total",
      count: "Record count",
      program: "Donation type",
      amount: "XLM amount",
      amountPlaceholder: "E.g. 2.5",
      memo: "Short memo",
      memoPlaceholder: "E.g. on behalf of my family",
      submit: "Record on Contract",
      simulating: "Simulating",
      signing: "Awaiting signature",
      pending: "Pending confirmation",
      refresh: "Refresh contract totals",
      success: "Donation record was written to the contract.",
      txHash: "Transaction hash",
      explorer: "Stellar Expert",
      needsWallet: "Connect a wallet before recording a contract donation.",
      missingConfig: "Contract id is missing. Run the deploy script and add PUBLIC_STELLAR_CONTRACT_ID to your .env file.",
      formErrors: {
        amountRequired: "Enter the XLM amount to write to the contract.",
        amountInvalid: "Amount must be positive and use up to 7 decimal places.",
      },
      status: {
        idle: "Ready",
        simulating: "RPC simulation is running",
        signing: "Waiting for wallet signature",
        pending: "Waiting for Testnet confirmation",
        success: "Success",
        fail: "Failed",
      },
      errors: {
        wallet_unavailable: "No wallet is connected or no supported wallet was found.",
        wallet_rejected: "Wallet action was rejected.",
        wallet_address_missing: "Could not read the wallet address.",
        wrong_network: "Switch your wallet to Stellar Testnet and try again.",
        invalid_recipient: "Recipient address is invalid.",
        invalid_amount: "Amount must be positive and use up to 7 decimal places.",
        insufficient_balance: "Insufficient balance.",
        sign_rejected: "Signing was rejected or closed.",
        destination_missing: "Recipient Testnet account was not found.",
        horizon_error: "Horizon action could not be completed.",
        rpc_error: "Stellar RPC could not complete the action.",
        contract_error: "Contract action failed or contract id is missing.",
        unknown: "The action could not be completed. Check the details and try again.",
      } satisfies Record<WalletErrorCode, string>,
    },
  };

  let t = $derived(copy[locale]);
  let programInfo = $derived(CONTRACT_PROGRAMS[selectedProgram]);
  let programSymbol = $derived(programInfo.symbol);
  let explorerUrl = $derived(
    $donationContractState.txHash
      ? `https://stellar.expert/explorer/testnet/tx/${$donationContractState.txHash}`
      : "",
  );
  let trimmedAmount = $derived(amount.trim());
  let trimmedMemo = $derived(memo.trim());
  let formError = $derived.by(() => {
    if (!trimmedAmount) {
      return t.formErrors.amountRequired;
    }

    if (!validateContractAmount(trimmedAmount)) {
      return t.formErrors.amountInvalid;
    }

    return "";
  });
  let busy = $derived(["simulating", "signing", "pending"].includes($donationContractState.status));
  let canSubmit = $derived(Boolean($walletState.session) && $donationContractState.configured && !formError && !busy);
  let feedbackError = $derived(
    $donationContractState.errorCode
      ? t.errors[$donationContractState.errorCode]
      : $donationContractState.error,
  );

  async function submitRecord() {
    if (!canSubmit) {
      return;
    }

    await submitContractDonation(programSymbol, trimmedAmount, trimmedMemo);
  }

  $effect(() => subscribeLocale((value) => (locale = value)));

  $effect(() => {
    selectedProgram = normalizeProgram(program);
  });

  $effect(() => {
    if ($walletState.session) {
      refreshContractTotals(programSymbol);
    }
  });

  $effect(() => {
    poller?.stop();
    poller = startDonationEventPolling(() => {
      if ($walletState.session) {
        refreshContractTotals(programSymbol);
      }
    });

    return () => poller?.stop();
  });
</script>

<Card class="contract-panel">
  <div class="contract-head">
    <div>
      <p class="eyebrow">{t.eyebrow}</p>
      <h3>{t.title}</h3>
      <p>{t.text}</p>
    </div>
    <div class="status-pill" data-status={$donationContractState.status}>
      <span>{$donationContractState.status}</span>
      <strong>{t.status[$donationContractState.status]}</strong>
    </div>
  </div>

  <div class="contract-stats">
    <div class="stat-box">
      <span>{t.connected}</span>
      <strong>{$walletState.shortAddress || "-"}</strong>
    </div>
    <div class="stat-box">
      <span>{t.programTotal}</span>
      <strong>{$donationContractState.programTotal} XLM</strong>
    </div>
    <div class="stat-box">
      <span>{t.donorTotal}</span>
      <strong>{$donationContractState.donorTotal} XLM</strong>
    </div>
    <div class="stat-box">
      <span>{t.count}</span>
      <strong>{$donationContractState.count}</strong>
    </div>
  </div>

  {#if !$donationContractState.configured}
    <p class="contract-note error" role="alert"><TriangleAlert size={16} /> {t.missingConfig}</p>
  {:else if !$walletState.session}
    <p class="contract-note"><TriangleAlert size={16} /> {t.needsWallet}</p>
  {/if}

  <form class="contract-form" onsubmit={(event) => { event.preventDefault(); submitRecord(); }}>
    <label>
      <span>{t.program}</span>
      <select bind:value={selectedProgram} disabled={busy}>
        {#each Object.entries(CONTRACT_PROGRAMS) as [key, value]}
          <option value={key}>{locale === "tr" ? value.tr : value.en}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>{t.amount}</span>
      <input
        bind:value={amount}
        inputmode="decimal"
        autocomplete="off"
        placeholder={t.amountPlaceholder}
        aria-invalid={Boolean(formError && trimmedAmount)}
        disabled={!$walletState.session || busy}
      />
    </label>
    <label>
      <span>{t.memo}</span>
      <input
        bind:value={memo}
        maxlength="120"
        autocomplete="off"
        placeholder={t.memoPlaceholder}
        disabled={!$walletState.session || busy}
      />
    </label>
    <div class="contract-actions">
      <Button type="button" variant="outline" onclick={() => refreshContractTotals(programSymbol)} disabled={!$walletState.session || busy}>
        <RefreshCw size={17} />
        {t.refresh}
      </Button>
      <Button type="submit" disabled={!canSubmit}>
        <FileSignature size={17} />
        {busy
          ? $donationContractState.status === "simulating"
            ? t.simulating
            : $donationContractState.status === "signing"
              ? t.signing
              : t.pending
          : t.submit}
      </Button>
    </div>
  </form>

  {#if formError && trimmedAmount}
    <p class="contract-note error" role="status"><TriangleAlert size={16} /> {formError}</p>
  {/if}

  {#if feedbackError}
    <p class="contract-note error" role="alert"><TriangleAlert size={16} /> {feedbackError}</p>
  {/if}

  {#if $donationContractState.status === "success" && $donationContractState.txHash}
    <div class="contract-success" role="status">
      <CheckCircle2 size={18} />
      <div>
        <strong>{t.success}</strong>
        <span>{t.txHash}: {$donationContractState.txHash}</span>
        <a href={explorerUrl} target="_blank" rel="noreferrer">
          {t.explorer}
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  {/if}
</Card>

<style>
  :global(.contract-panel) {
    margin-top: 28px;
    padding: 24px;
  }

  .contract-head {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
  }

  h3 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    line-height: 1.1;
  }

  p {
    margin: 12px 0 0;
    color: var(--muted-foreground);
    line-height: 1.65;
  }

  .status-pill,
  .stat-box {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--muted);
  }

  .status-pill {
    display: grid;
    gap: 4px;
    min-width: 180px;
    padding: 12px 14px;
  }

  .status-pill[data-status="success"] {
    border-color: color-mix(in srgb, var(--primary) 48%, var(--border));
    background: color-mix(in srgb, var(--primary) 12%, var(--muted));
  }

  .status-pill span,
  .stat-box span,
  label span {
    color: var(--muted-foreground);
    font-size: 0.82rem;
    font-weight: 800;
  }

  .status-pill strong,
  .stat-box strong {
    color: var(--foreground);
    overflow-wrap: anywhere;
  }

  .contract-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 22px;
  }

  .stat-box {
    display: grid;
    gap: 8px;
    padding: 16px;
    min-width: 0;
  }

  .contract-form {
    display: grid;
    grid-template-columns: 1fr 0.72fr 1fr;
    gap: 14px;
    margin-top: 18px;
  }

  label {
    display: grid;
    gap: 8px;
  }

  input,
  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0 12px;
    background: var(--card);
    color: var(--foreground);
    font: inherit;
  }

  input[aria-invalid="true"] {
    border-color: #dc2626;
  }

  .contract-actions {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    gap: 12px;
  }

  .contract-note,
  .contract-success {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 16px;
    border-radius: var(--radius);
    padding: 12px 14px;
    background: var(--muted);
    color: var(--muted-foreground);
    font-weight: 800;
  }

  .contract-note.error {
    background: color-mix(in srgb, #dc2626 10%, var(--card));
    color: #b91c1c;
  }

  .contract-success {
    background: color-mix(in srgb, var(--primary) 12%, var(--card));
    color: var(--foreground);
  }

  .contract-success div {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .contract-success span {
    color: var(--muted-foreground);
    overflow-wrap: anywhere;
  }

  .contract-success a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--primary-strong);
    font-weight: 900;
  }

  @media (max-width: 980px) {
    .contract-stats,
    .contract-form {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .contract-head {
      display: grid;
    }

    .status-pill {
      min-width: 0;
    }

    .contract-stats,
    .contract-form {
      grid-template-columns: 1fr;
    }
  }
</style>

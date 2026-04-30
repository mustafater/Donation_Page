<script lang="ts">
  import { CheckCircle2, ExternalLink, FileSignature, RefreshCw, TriangleAlert } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import Card from "@/components/ui/Card.svelte";
  import { subscribeLocale, type Locale } from "@/lib/i18n";
  import { walletState } from "@/lib/wallet/state";
  import type { WalletErrorCode } from "@/lib/wallet/adapter";
  import {
    livestockContractState,
    refreshLivestockTotals,
    submitLivestockDonation,
    validateLivestockForm,
  } from "@/lib/contract/livestockState";
  import type { LivestockAnimalType } from "@/lib/contract/client";

  const PROGRAM = "qurban";

  const copy = {
    tr: {
      eyebrow: "Soroban Testnet",
      title: "Küçükbaş kurban bağış kaydı",
      text: "Koyun veya keçi bağış niyetinizi adet ve XLM karşılığıyla küçükbaş contract fonksiyonlarına yazın.",
      animal: "Hayvan türü",
      sheep: "Koyun",
      goat: "Keçi",
      units: "Adet",
      unitsPlaceholder: "Örn. 1",
      amount: "XLM miktarı",
      amountPlaceholder: "Örn. 2.5",
      memo: "Kısa not",
      memoPlaceholder: "Örn. ailem adına",
      submit: "Küçükbaş Kaydı Oluştur",
      simulating: "Simülasyon",
      signing: "İmza bekleniyor",
      pending: "Onay bekleniyor",
      refresh: "Toplamları yenile",
      connected: "Bağlı cüzdan",
      programAmount: "Program XLM toplamı",
      programUnits: "Program adet toplamı",
      donorAmount: "Cüzdan XLM toplamı",
      donorUnits: "Cüzdan adet toplamı",
      count: "Kayıt sayısı",
      success: "Küçükbaş bağış kaydı contract'a yazıldı.",
      txHash: "İşlem hash'i",
      explorer: "Stellar Expert",
      needsWallet: "Küçükbaş contract kaydı için önce cüzdan bağla.",
      missingConfig: "Contract id eksik. Deploy script'i çalıştırıp PUBLIC_STELLAR_CONTRACT_ID değerini .env dosyasına eklemelisin.",
      errors: {
        invalid_units: "Adet pozitif tam sayı olmalı.",
        invalid_amount: "Miktar pozitif olmalı ve en fazla 7 decimal içermeli.",
      },
      walletErrors: {
        wallet_unavailable: "Cüzdan bağlı değil veya desteklenen wallet bulunamadı.",
        wallet_rejected: "Cüzdan işlemi reddedildi.",
        wallet_address_missing: "Cüzdan adresi okunamadı.",
        wrong_network: "Cüzdanı Stellar Testnet ağına geçirip tekrar dene.",
        invalid_recipient: "Alıcı adresi geçerli değil.",
        invalid_amount: "Adet veya miktar geçerli değil.",
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
      title: "Small livestock qurban record",
      text: "Write your sheep or goat donation intention to the small livestock contract with unit count and XLM value.",
      animal: "Animal type",
      sheep: "Sheep",
      goat: "Goat",
      units: "Units",
      unitsPlaceholder: "E.g. 1",
      amount: "XLM amount",
      amountPlaceholder: "E.g. 2.5",
      memo: "Short memo",
      memoPlaceholder: "E.g. on behalf of my family",
      submit: "Record Small Livestock",
      simulating: "Simulating",
      signing: "Waiting for signature",
      pending: "Waiting for confirmation",
      refresh: "Refresh totals",
      connected: "Connected wallet",
      programAmount: "Program XLM total",
      programUnits: "Program unit total",
      donorAmount: "Wallet XLM total",
      donorUnits: "Wallet unit total",
      count: "Record count",
      success: "Small livestock donation record was written to the contract.",
      txHash: "Transaction hash",
      explorer: "Stellar Expert",
      needsWallet: "Connect a wallet before recording a small livestock donation.",
      missingConfig: "Contract id is missing. Run the deploy script and add PUBLIC_STELLAR_CONTRACT_ID to your .env file.",
      errors: {
        invalid_units: "Units must be a positive integer.",
        invalid_amount: "Amount must be positive and use up to 7 decimal places.",
      },
      walletErrors: {
        wallet_unavailable: "No wallet is connected or no supported wallet was found.",
        wallet_rejected: "Wallet action was rejected.",
        wallet_address_missing: "Could not read the wallet address.",
        wrong_network: "Switch your wallet to Stellar Testnet and try again.",
        invalid_recipient: "Recipient address is invalid.",
        invalid_amount: "Units or amount is invalid.",
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

  let locale = $state<Locale>("tr");
  let animalType = $state<LivestockAnimalType>("sheep");
  let units = $state("1");
  let amount = $state("");
  let memo = $state("");
  let t = $derived(copy[locale]);
  let formError = $derived(validateLivestockForm(units, amount));
  let busy = $derived(["simulating", "signing", "pending"].includes($livestockContractState.status));
  let canSubmit = $derived(Boolean($walletState.session) && $livestockContractState.configured && !formError && !busy);
  let feedbackError = $derived(
    $livestockContractState.errorCode
      ? t.walletErrors[$livestockContractState.errorCode]
      : $livestockContractState.error,
  );
  let explorerUrl = $derived(
    $livestockContractState.txHash
      ? `https://stellar.expert/explorer/testnet/tx/${$livestockContractState.txHash}`
      : "",
  );
  let submitLabel = $derived.by(() => {
    if ($livestockContractState.status === "simulating") return t.simulating;
    if ($livestockContractState.status === "signing") return t.signing;
    if ($livestockContractState.status === "pending") return t.pending;
    return t.submit;
  });

  async function submitRecord() {
    if (!canSubmit) return;
    await submitLivestockDonation(PROGRAM, animalType, units, amount, memo);
  }

  $effect(() => subscribeLocale((value) => (locale = value)));

  $effect(() => {
    if ($walletState.session) {
      refreshLivestockTotals(PROGRAM, animalType);
    }
  });
</script>

<Card class="livestock-panel">
  <div class="panel-head">
    <div>
      <p class="eyebrow">{t.eyebrow}</p>
      <h2>{t.title}</h2>
      <p>{t.text}</p>
    </div>
    <div class="animal-switch" aria-label={t.animal}>
      <button class:active={animalType === "sheep"} type="button" onclick={() => (animalType = "sheep")}>
        <span></span>
        {t.sheep}
      </button>
      <button class:active={animalType === "goat"} type="button" onclick={() => (animalType = "goat")}>
        <span></span>
        {t.goat}
      </button>
    </div>
  </div>

  <div class="stats">
    <div><span>{t.connected}</span><strong>{$walletState.shortAddress || "-"}</strong></div>
    <div><span>{t.programAmount}</span><strong>{$livestockContractState.programAmountTotal} XLM</strong></div>
    <div><span>{t.programUnits}</span><strong>{$livestockContractState.programUnitsTotal}</strong></div>
    <div><span>{t.donorAmount}</span><strong>{$livestockContractState.donorAmountTotal} XLM</strong></div>
    <div><span>{t.donorUnits}</span><strong>{$livestockContractState.donorUnitsTotal}</strong></div>
    <div><span>{t.count}</span><strong>{$livestockContractState.count}</strong></div>
  </div>

  {#if !$livestockContractState.configured}
    <p class="note error" role="alert"><TriangleAlert size={16} /> {t.missingConfig}</p>
  {:else if !$walletState.session}
    <p class="note" role="status"><TriangleAlert size={16} /> {t.needsWallet}</p>
  {/if}

  <form class="livestock-form" onsubmit={(event) => { event.preventDefault(); submitRecord(); }}>
    <label>
      <span>{t.units}</span>
      <input bind:value={units} inputmode="numeric" autocomplete="off" placeholder={t.unitsPlaceholder} disabled={!$walletState.session || busy} />
    </label>
    <label>
      <span>{t.amount}</span>
      <input bind:value={amount} inputmode="decimal" autocomplete="off" placeholder={t.amountPlaceholder} disabled={!$walletState.session || busy} />
    </label>
    <label>
      <span>{t.memo}</span>
      <input bind:value={memo} maxlength="120" autocomplete="off" placeholder={t.memoPlaceholder} disabled={!$walletState.session || busy} />
    </label>
    <div class="actions">
      <Button type="button" variant="outline" onclick={() => refreshLivestockTotals(PROGRAM, animalType)} disabled={!$walletState.session || busy}>
        <RefreshCw size={17} />
        {t.refresh}
      </Button>
      <Button type="submit" disabled={!canSubmit}>
        <FileSignature size={17} />
        {submitLabel}
      </Button>
    </div>
  </form>

  {#if formError && (units || amount)}
    <p class="note error" role="status"><TriangleAlert size={16} /> {t.errors[formError as keyof typeof t.errors]}</p>
  {/if}

  {#if feedbackError}
    <p class="note error" role="alert"><TriangleAlert size={16} /> {feedbackError}</p>
  {/if}

  {#if $livestockContractState.status === "success" && $livestockContractState.txHash}
    <div class="success" role="status">
      <CheckCircle2 size={18} />
      <div>
        <strong>{t.success}</strong>
        <span>{t.txHash}: {$livestockContractState.txHash}</span>
        <a href={explorerUrl} target="_blank" rel="noreferrer">{t.explorer}<ExternalLink size={14} /></a>
      </div>
    </div>
  {/if}
</Card>

<style>
  :global(.livestock-panel) {
    padding: 24px;
  }

  .panel-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 24px;
    align-items: start;
  }

  h2 {
    margin: 0;
    font-size: clamp(1.55rem, 3vw, 2.4rem);
    line-height: 1.1;
  }

  p {
    margin: 12px 0 0;
    color: var(--muted-foreground);
    line-height: 1.65;
  }

  .animal-switch {
    display: grid;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 10px;
  }

  .animal-switch button {
    display: grid;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px;
    background: var(--card);
    color: var(--foreground);
    font-weight: 900;
    cursor: pointer;
  }

  .animal-switch button.active {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 10%, var(--card));
    color: var(--primary-strong);
  }

  .animal-switch span {
    display: block;
    height: 42px;
    border-radius: 8px;
    background:
      radial-gradient(circle at 68% 34%, color-mix(in srgb, var(--primary) 30%, transparent) 0 12px, transparent 13px),
      linear-gradient(135deg, color-mix(in srgb, var(--primary) 26%, var(--card)), var(--muted));
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 22px;
  }

  .stats div {
    display: grid;
    gap: 7px;
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    background: var(--muted);
  }

  .stats span,
  label span {
    color: var(--muted-foreground);
    font-size: 0.82rem;
    font-weight: 800;
  }

  .stats strong {
    color: var(--foreground);
    overflow-wrap: anywhere;
  }

  .livestock-form {
    display: grid;
    grid-template-columns: 0.55fr 0.75fr 1fr;
    gap: 14px;
    margin-top: 18px;
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
    padding: 0 12px;
    background: var(--card);
    color: var(--foreground);
    font: inherit;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    gap: 12px;
  }

  .note,
  .success {
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

  .note.error {
    background: color-mix(in srgb, #dc2626 10%, var(--card));
    color: #b91c1c;
  }

  .success {
    background: color-mix(in srgb, var(--primary) 12%, var(--card));
    color: var(--foreground);
  }

  .success div {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .success span {
    color: var(--muted-foreground);
    overflow-wrap: anywhere;
  }

  .success a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--primary-strong);
    font-weight: 900;
  }

  @media (max-width: 900px) {
    .panel-head,
    .stats,
    .livestock-form {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .animal-switch {
      grid-template-columns: 1fr;
    }
  }
</style>

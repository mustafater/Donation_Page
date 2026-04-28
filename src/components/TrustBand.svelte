<script lang="ts">
  import { ClipboardCheck, Globe2, LockKeyhole, ReceiptText } from "lucide-svelte";
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const icons = [ClipboardCheck, Globe2, LockKeyhole, ReceiptText];
  const copy = {
    tr: {
      eyebrow: "Güven ve hazırlık",
      title: "Bugünün sade bağış deneyimi, yarının izlenebilir altyapısı",
      text: "Arayüz bağışçının hızlı karar almasına odaklanır; teknik yapı ise backend ve Web3 entegrasyonlarının sonradan düzenli şekilde eklenebilmesi için ayrıştırılmıştır.",
      items: [
        { title: "Vekalet takibi", text: "Bağış niyeti ve kategori bilgisi tek modelde tutulur." },
        { title: "Saha odağı", text: "Afrika başta olmak üzere ihtiyaç bölgelerine göre ölçeklenebilir." },
        { title: "Web3 hazır", text: "Wallet ve contract entegrasyonu ayrı adapter katmanına bağlanır." },
        { title: "Şeffaf akış", text: "İleride işlem durumu, makbuz ve tx hash gösterimine hazırdır." },
      ],
    },
    en: {
      eyebrow: "Trust and readiness",
      title: "A simple donation experience today, traceable infrastructure tomorrow",
      text: "The interface helps donors act quickly, while the technical structure is separated so backend and Web3 integrations can be added cleanly later.",
      items: [
        { title: "Proxy tracking", text: "Donation intention and category data live in one shared model." },
        { title: "Field focused", text: "Ready to scale by need regions, especially across Africa." },
        { title: "Web3 ready", text: "Wallet and contract integration connect through a separate adapter layer." },
        { title: "Transparent flow", text: "Prepared for future status, receipt, and tx hash display." },
      ],
    },
  };

  let locale = $state<Locale>("tr");
  let t = $derived(copy[locale]);

  $effect(() => subscribeLocale((value) => (locale = value)));
</script>

<section class="section trust" id="guven">
  <div class="container trust-grid">
    <div>
      <p class="eyebrow">{t.eyebrow}</p>
      <h2 class="section-title">{t.title}</h2>
      <p class="section-copy">{t.text}</p>
    </div>
    <div class="trust-items">
      {#each t.items as item, index}
        {@const Icon = icons[index]}
        <article>
          <Icon size={24} />
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .trust {
    background: var(--muted);
  }

  .trust-grid {
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 42px;
    align-items: center;
  }

  .trust-items {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  article {
    display: flex;
    gap: 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    background: var(--card);
  }

  article :global(svg) {
    flex: 0 0 auto;
    color: var(--primary-strong);
  }

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin: 8px 0 0;
    color: var(--muted-foreground);
    line-height: 1.55;
  }

  @media (max-width: 860px) {
    .trust-grid,
    .trust-items {
      grid-template-columns: 1fr;
    }
  }
</style>

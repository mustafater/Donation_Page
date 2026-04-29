<script lang="ts">
  import { Baby, BadgeCheck, Beef, Gift, WalletCards } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import Card from "@/components/ui/Card.svelte";
  import { subscribeLocale, type Locale } from "@/lib/i18n";
  import type { DonationProgram } from "@/lib/donation/types";

  type Props = {
    programs: DonationProgram[];
  };

  let { programs }: Props = $props();
  let locale = $state<Locale>("tr");

  const copy = {
    tr: {
      eyebrow: "Bağış seçenekleri",
      title: "Niyetinizi güvenle emanet edebileceğiniz kurban programları",
      text: "Her kart tek bir bağış niyetini temsil eder. Bugün mock çalışan bu yapı, ileride backend, wallet ve smart contract çağrılarına aynı veri modeliyle bağlanacak.",
      programs: {
        qurban: {
          title: "Kurban Bağışı",
          description:
            "Kurban vekaletiniz güvenle alınır, ihtiyaç sahibi ailelerin sofrasına bereket olarak ulaşır.",
          amountLabel: "3.950 TL'den başlayan",
          ctaLabel: "Kurban Bağışla",
        },
        adak: {
          title: "Adak Kurbanı",
          description:
            "Adağınızı usulüne uygun şekilde yerine getirmek ve sevincinizi paylaşmak için kolay bağış akışı.",
          amountLabel: "Hızlı vekalet",
          ctaLabel: "Adak Oluştur",
        },
        akika: {
          title: "Akika Kurbanı",
          description:
            "Yeni doğan evladınızın şükrünü, uzak coğrafyalarda bekleyen kardeş sofralarıyla buluşturun.",
          amountLabel: "Aile adına bağış",
          ctaLabel: "Akika Bağışla",
        },
        sukur: {
          title: "Şükür Kurbanı",
          description:
            "Şükrünüz bir aileye umut, bir çocuğa bayram sevinci, bir sofraya sıcaklık olsun.",
          amountLabel: "Paylaşma niyeti",
          ctaLabel: "Şükür Bağışla",
        },
      },
    },
    en: {
      eyebrow: "Donation options",
      title: "Qurban programs you can entrust with confidence",
      text: "Each card represents one donation intention. The mock flow used today is ready to connect to backend, wallet, and smart contract calls through the same data model.",
      programs: {
        qurban: {
          title: "Qurban Donation",
          description:
            "Your qurban proxy is received securely and reaches families in need as blessing on their tables.",
          amountLabel: "Starting from 3,950 TRY",
          ctaLabel: "Donate Qurban",
        },
        adak: {
          title: "Vow Qurban",
          description:
            "A simple donation flow to fulfill your vow properly and share your joy with families in need.",
          amountLabel: "Quick proxy",
          ctaLabel: "Create Vow",
        },
        akika: {
          title: "Aqiqah Qurban",
          description:
            "Turn gratitude for your newborn into a shared table for brothers and sisters far away.",
          amountLabel: "On behalf of family",
          ctaLabel: "Donate Aqiqah",
        },
        sukur: {
          title: "Gratitude Qurban",
          description:
            "Let your gratitude become hope for a family, Eid joy for a child, and warmth for a table.",
          amountLabel: "Intention to share",
          ctaLabel: "Donate Thanks",
        },
      },
    },
  };

  let t = $derived(copy[locale]);

  const icons = {
    vacip: Beef,
    adak: BadgeCheck,
    akika: Baby,
    sukur: Gift,
  };

  $effect(() => subscribeLocale((value) => {
    locale = value;
  }));
</script>

<section class="section donations" id="bagislar">
  <div class="container">
    <div class="section-head">
      <div>
        <p class="eyebrow">{t.eyebrow}</p>
        <h2 class="section-title">{t.title}</h2>
      </div>
      <p class="section-copy">{t.text}</p>
    </div>

    <div class="grid">
      {#each programs as program}
        {@const Icon = icons[program.category]}
        {@const programCopy = t.programs[program.id as keyof typeof t.programs]}
        <Card class="donation-card">
          <div class="icon"><Icon size={25} strokeWidth={2.4} /></div>
          <p class="amount">{programCopy.amountLabel}</p>
          <h3>{programCopy.title}</h3>
          <p class="description">{programCopy.description}</p>
          <Button variant="secondary" href={`/bagis?program=${program.id}`}>
            <WalletCards size={18} />
            {programCopy.ctaLabel}
          </Button>
        </Card>
      {/each}
    </div>
  </div>
</section>

<style>
  .donations {
    background: var(--background);
  }

  .section-head {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    align-items: end;
    gap: 38px;
    margin-bottom: 34px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  :global(.donation-card) {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 342px;
    padding: 22px;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    border-radius: var(--radius);
    background: var(--secondary);
    color: var(--primary-strong);
  }

  .amount {
    margin: 22px 0 0;
    color: var(--primary-strong);
    font-size: 0.84rem;
    font-weight: 900;
  }

  h3 {
    margin: 10px 0 0;
    font-size: 1.35rem;
  }

  .description {
    flex: 1;
    margin: 13px 0 22px;
    color: var(--muted-foreground);
    line-height: 1.65;
  }

  @media (max-width: 980px) {
    .section-head,
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .section-head,
    .grid {
      grid-template-columns: 1fr;
    }

    :global(.donation-card) {
      min-height: auto;
    }
  }
</style>

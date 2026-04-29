<script lang="ts">
  import { ArrowLeft, ArrowRight, HeartHandshake, ShieldCheck } from "lucide-svelte";
  import Button from "@/components/ui/Button.svelte";
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const copy = {
    tr: {
      kicker: "Vekaletiniz kardeşliğe dönüşür",
      donate: "Hemen Bağış Yap",
      process: "Süreci İncele",
      previous: "Önceki hikaye",
      next: "Sonraki hikaye",
      show: "hikayeyi göster",
      slides: [
    {
      title: "Bir Kurban, Uzak Bir Sofrada Bayram Sevinci",
      text: "Afrika'da bir aile, bugün kapısının çalınmasını umutla bekliyor. Sizin vekaletinizle kesilen kurban, yalnızca et değil; kardeşlik, paylaşma ve unutulmadığını hissetme sevincidir.",
      tag: "#KardeşlikSofrası #KurbanBağışı #PaylaşmakBereket",
      image:
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80",
    },
    {
      title: "Paylaştıkça Çoğalan Bir İyilik",
      text: "Bağışçının niyeti, ihtiyaç sahibi bir annenin duasında ve çocukların bayram tebessümünde karşılık bulur. Bu iyilik zincirinde sizin de payınız olsun.",
      tag: "#Birlikteİyilik #HilalKurban #BereketiPaylaş",
      image:
        "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80",
    },
    {
      title: "Vekaletiniz Güvenle Yola Çıkar",
      text: "Kurban süreci şeffaf, düzenli ve izlenebilir bir bağış deneyimiyle ilerler. Bugün yapılan bir bağış, yarın bir sofrada umut olur.",
      tag: "#GüvenliBağış #KurbanVekaleti #UmutOl",
      image:
        "https://images.unsplash.com/photo-1490424660416-359912d314b3?auto=format&fit=crop&w=1600&q=80",
    },
      ],
    },
    en: {
      kicker: "Your proxy becomes brotherhood",
      donate: "Donate Now",
      process: "See the Process",
      previous: "Previous story",
      next: "Next story",
      show: "show story",
      slides: [
        {
          title: "One Qurban, Eid Joy on a Distant Table",
          text: "In Africa, a family is waiting with hope for a knock at the door. Your qurban proxy carries more than meat; it carries brotherhood, sharing, and the joy of being remembered.",
          tag: "#TableOfBrotherhood #QurbanDonation #SharingBlessings",
          image:
            "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80",
        },
        {
          title: "Goodness Grows When Shared",
          text: "A donor's intention finds its answer in a mother's prayer and a child's Eid smile. Be part of this chain of kindness.",
          tag: "#TogetherForGood #HilalQurban #ShareTheBlessing",
          image:
            "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80",
        },
        {
          title: "Your Proxy Sets Out Safely",
          text: "The qurban process moves through a transparent, organized, and traceable donation experience. A donation today becomes hope at a table tomorrow.",
          tag: "#TrustedDonation #QurbanProxy #BeHope",
          image:
            "https://images.unsplash.com/photo-1490424660416-359912d314b3?auto=format&fit=crop&w=1600&q=80",
        },
      ],
    },
  };

  let active = $state(0);
  let locale = $state<Locale>("tr");
  let t = $derived(copy[locale]);

  function goTo(index: number) {
    active = (index + t.slides.length) % t.slides.length;
  }

  $effect(() => {
    const timer = window.setInterval(() => goTo(active + 1), 6500);
    return () => window.clearInterval(timer);
  });

  $effect(() => subscribeLocale((value) => {
    locale = value;
    active = 0;
  }));
</script>

<section class="hero" id="hikaye" aria-label="Kurban bağışı hikayeleri">
  {#each t.slides as slide, index}
    <article
      class:active={index === active}
      class="slide"
      aria-hidden={index !== active}
      style={`background-image: linear-gradient(90deg, rgba(4, 35, 20, 0.82), rgba(4, 35, 20, 0.48), rgba(4, 35, 20, 0.22)), url('${slide.image}')`}
    >
      <div class="container hero-content">
        <div class="copy">
          <p class="hero-kicker"><HeartHandshake size={18} /> {t.kicker}</p>
          <h1>{slide.title}</h1>
          <p class="lead">{slide.text}</p>
          <p class="tags">{slide.tag}</p>
        </div>
      </div>
    </article>
  {/each}

  <div class="container hero-controls">
    <div class="hero-actions">
      <Button href="#bagislar">{t.donate}</Button>
      <Button href="#guven" variant="outline" class="hero-outline">
        <ShieldCheck size={18} />
        {t.process}
      </Button>
    </div>
    <div class="dots" aria-label="Slider sayfaları">
      {#each t.slides as slide, index}
        <button
          class:current={index === active}
          aria-label={`${index + 1}. ${t.show}`}
          onclick={() => goTo(index)}
        ></button>
      {/each}
    </div>
    <div class="arrows">
      <button aria-label={t.previous} onclick={() => goTo(active - 1)}>
        <ArrowLeft size={18} />
      </button>
      <button aria-label={t.next} onclick={() => goTo(active + 1)}>
        <ArrowRight size={18} />
      </button>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: clamp(610px, 82vh, 760px);
    overflow: hidden;
    background: #092317;
  }

  .slide {
    position: absolute;
    inset: 0;
    display: grid;
    align-items: center;
    background-position: center;
    background-size: cover;
    opacity: 0;
    transition: opacity 600ms ease;
  }

  .slide.active {
    opacity: 1;
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    min-height: clamp(610px, 82vh, 760px);
    padding: 72px 0 210px;
  }

  .copy {
    max-width: 710px;
    color: #fff;
    padding-bottom: 0;
  }

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 18px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    padding: 0.54rem 0.82rem;
    background: rgba(255, 255, 255, 0.12);
    font-weight: 800;
  }

  h1 {
    margin: 0;
    max-width: 760px;
    font-size: clamp(2.55rem, 7vw, 5.7rem);
    line-height: 0.98;
  }

  .lead {
    margin: 24px 0 0;
    max-width: 640px;
    color: rgba(255, 255, 255, 0.9);
    font-size: clamp(1rem, 2vw, 1.28rem);
    line-height: 1.72;
  }

  .tags {
    margin: 18px 0 0;
    color: #f5d36d;
    font-weight: 800;
    line-height: 1.55;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.72rem;
    margin-top: 0;
    pointer-events: auto;
  }

  .hero-outline {
    border-color: rgba(255, 255, 255, 0.34);
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .hero-controls {
    position: absolute;
    inset-inline: 0;
    bottom: 44px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    pointer-events: none;
  }

  .dots,
  .arrows {
    display: flex;
    gap: 9px;
    pointer-events: auto;
  }

  .dots button,
  .arrows button {
    border: 1px solid rgba(255, 255, 255, 0.34);
    cursor: pointer;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .dots button {
    width: 42px;
    height: 8px;
    border-radius: 999px;
    padding: 0;
  }

  .dots button.current {
    background: #f5d36d;
  }

  .arrows button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: var(--radius);
  }

  @media (max-width: 720px) {
    .hero {
      min-height: 780px;
    }

    .hero-content {
      min-height: 780px;
      padding: 54px 0 244px;
    }

    .hero-controls {
      align-items: flex-start;
      flex-direction: column;
      bottom: 42px;
      justify-content: flex-end;
    }

    .dots button {
      width: 31px;
    }
  }
</style>

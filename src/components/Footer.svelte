<script lang="ts">
  import { subscribeLocale, type Locale } from "@/lib/i18n";

  const copy = {
    tr: {
      text: "Kardeşlik sofralarına uzanan güvenilir, modern ve Web3 entegrasyonuna hazır bağış deneyimi.",
      quickLinks: "Hızlı Linkler",
      contact: "İletişim",
      copyright: "© 2026 Hilal Kurban",
      version: "Bağış, vekalet ve şeffaflık odaklı frontend v1",
      links: ["Kurban Bağışı", "Adak Kurbanı", "Akika Kurbanı", "Şükür Kurbanı"],
    },
    en: {
      text: "A trusted, modern, Web3-ready donation experience reaching tables of brotherhood.",
      quickLinks: "Quick Links",
      contact: "Contact",
      copyright: "© 2026 Hilal Qurban",
      version: "Frontend v1 focused on donation, proxy, and transparency",
      links: ["Qurban Donation", "Vow Qurban", "Aqiqah Qurban", "Gratitude Qurban"],
    },
  };

  let locale = $state<Locale>("tr");
  let t = $derived(copy[locale]);

  $effect(() => subscribeLocale((value) => (locale = value)));
</script>

<footer class="footer" id="iletisim">
  <div class="container footer-grid">
    <div>
      <h2>Hilal Kurban</h2>
      <p>{t.text}</p>
    </div>
    <div>
      <h3>{t.quickLinks}</h3>
      <ul>
        {#each t.links as link}
          <li><a href="#bagislar">{link}</a></li>
        {/each}
      </ul>
    </div>
    <div>
      <h3>{t.contact}</h3>
      <p>info@hilalkurban.org</p>
      <p>0850 000 00 00</p>
      <p>İstanbul / Türkiye</p>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>{t.copyright}</span>
    <span>{t.version}</span>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--border);
    background: #07110d;
    color: #edf7ef;
    padding: 54px 0 24px;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.9fr;
    gap: 36px;
  }

  h2,
  h3,
  p {
    margin-top: 0;
  }

  h2 {
    margin-bottom: 12px;
    font-size: 1.6rem;
  }

  h3 {
    margin-bottom: 14px;
    font-size: 1rem;
  }

  p,
  a,
  .footer-bottom {
    color: rgba(237, 247, 239, 0.76);
  }

  p {
    max-width: 440px;
    line-height: 1.7;
  }

  ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  a:hover {
    color: #4ade80;
  }

  .footer-bottom {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 38px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 22px;
    font-size: 0.9rem;
  }

  @media (max-width: 760px) {
    .footer-grid {
      grid-template-columns: 1fr;
    }

    .footer-bottom {
      flex-direction: column;
    }
  }
</style>

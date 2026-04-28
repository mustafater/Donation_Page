import type { DonationProgram } from "@/lib/donation/types";

export const donationPrograms: DonationProgram[] = [
  {
    id: "qurban",
    title: "Kurban Bağışı",
    category: "vacip",
    description:
      "Kurban vekaletiniz güvenle alınır, ihtiyaç sahibi ailelerin sofrasına bereket olarak ulaşır.",
    amountLabel: "3.950 TL'den başlayan",
    ctaLabel: "Kurban Bağışla",
  },
  {
    id: "adak",
    title: "Adak Kurbanı",
    category: "adak",
    description:
      "Adağınızı usulüne uygun şekilde yerine getirmek ve sevincinizi paylaşmak için kolay bağış akışı.",
    amountLabel: "Hızlı vekalet",
    ctaLabel: "Adak Oluştur",
  },
  {
    id: "akika",
    title: "Akika Kurbanı",
    category: "akika",
    description:
      "Yeni doğan evladınızın şükrünü, uzak coğrafyalarda bekleyen kardeş sofralarıyla buluşturun.",
    amountLabel: "Aile adına bağış",
    ctaLabel: "Akika Bağışla",
  },
  {
    id: "sukur",
    title: "Şükür Kurbanı",
    category: "sukur",
    description:
      "Şükrünüz bir aileye umut, bir çocuğa bayram sevinci, bir sofraya sıcaklık olsun.",
    amountLabel: "Paylaşma niyeti",
    ctaLabel: "Şükür Bağışla",
  },
];

export type DonationCategory = "vacip" | "adak" | "akika" | "sukur";

export interface DonationProgram {
  id: string;
  title: string;
  category: DonationCategory;
  description: string;
  amountLabel: string;
  ctaLabel: string;
}

export interface DonationIntent {
  programId: string;
  amount?: number;
  donorAddress?: string;
}

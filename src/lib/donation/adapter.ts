import type { DonationIntent } from "./types";

export async function createDonationIntent(intent: DonationIntent) {
  return {
    ...intent,
    status: "mock-ready",
    provider: "future-web3-contract",
  };
}

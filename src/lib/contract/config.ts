import { Networks } from "@stellar/stellar-sdk";

export const CONTRACT_CONFIG = {
  rpcUrl: import.meta.env.PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase:
    import.meta.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET,
  contractId: import.meta.env.PUBLIC_STELLAR_CONTRACT_ID || "",
};

export const CONTRACT_PROGRAMS = {
  qurban: {
    symbol: "qurban",
    tr: "Kurban Bağışı",
    en: "Qurban Donation",
  },
  adak: {
    symbol: "adak",
    tr: "Adak Kurbanı",
    en: "Votive Qurban",
  },
  akika: {
    symbol: "akika",
    tr: "Akika Kurbanı",
    en: "Aqiqah Qurban",
  },
  sukur: {
    symbol: "sukur",
    tr: "Şükür Kurbanı",
    en: "Gratitude Qurban",
  },
} as const;

export type ContractProgramKey = keyof typeof CONTRACT_PROGRAMS;

export function normalizeProgram(program: string | undefined | null): ContractProgramKey {
  return program && program in CONTRACT_PROGRAMS ? (program as ContractProgramKey) : "qurban";
}

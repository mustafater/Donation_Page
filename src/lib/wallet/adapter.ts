import freighterApi from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  StrKey,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import type { ModuleInterface } from "@creit-tech/stellar-wallets-kit/types";

export const STELLAR_TESTNET = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  name: "TESTNET",
};

export const NETWORK_FEE_BUFFER_XLM = 0.00001;

const server = new Horizon.Server(STELLAR_TESTNET.horizonUrl);
let kitInitialized = false;
let walletKit: typeof import("@creit-tech/stellar-wallets-kit/sdk").StellarWalletsKit | null = null;
let selectedWalletName = "Freighter";

export type WalletErrorCode =
  | "wallet_unavailable"
  | "wallet_rejected"
  | "wallet_address_missing"
  | "wrong_network"
  | "invalid_recipient"
  | "invalid_amount"
  | "insufficient_balance"
  | "sign_rejected"
  | "destination_missing"
  | "horizon_error"
  | "rpc_error"
  | "contract_error"
  | "unknown";

export class WalletFlowError extends Error {
  code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletFlowError";
    this.code = code;
  }
}

export interface WalletSession {
  address: string;
  network: string;
  networkPassphrase: string;
  walletName: string;
}

export interface BalanceResult {
  xlm: string;
}

export interface SendPaymentInput {
  source: string;
  destination: string;
  amount: string;
}

export interface SendPaymentResult {
  hash: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (isObject(error) && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function getWalletApiErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (isObject(error) && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

function assertWalletApiResponse<T extends { error?: unknown }>(response: T, fallback: string) {
  if (response.error) {
    throw new Error(getWalletApiErrorMessage(response.error, fallback));
  }

  return response;
}

function getHorizonResultCodes(error: unknown) {
  if (!isObject(error)) {
    return "";
  }

  const response = isObject(error.response) ? error.response : null;
  const data = response && isObject(response.data) ? response.data : null;
  const extras = data && isObject(data.extras) ? data.extras : null;
  const resultCodes = extras && isObject(extras.result_codes) ? extras.result_codes : null;

  return JSON.stringify(resultCodes ?? extras ?? data ?? {});
}

function normalizeSubmitError(error: unknown): WalletFlowError {
  if (error instanceof WalletFlowError) {
    return error;
  }

  const message = `${readErrorMessage(error)} ${getHorizonResultCodes(error)}`.toLowerCase();

  if (message.includes("reject") || message.includes("declin") || message.includes("denied")) {
    return new WalletFlowError("sign_rejected", "Transaction signing was rejected.");
  }

  if (message.includes("op_no_destination") || message.includes("account not found")) {
    return new WalletFlowError("destination_missing", "Recipient Testnet account could not be found.");
  }

  if (message.includes("tx_insufficient_balance") || message.includes("op_underfunded")) {
    return new WalletFlowError("insufficient_balance", "Available XLM balance is not enough for this payment.");
  }

  return new WalletFlowError("horizon_error", "Transaction could not be submitted to Stellar Testnet.");
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

export function validatePublicKey(address: string) {
  return StrKey.isValidEd25519PublicKey(address);
}

export function validateAmount(amount: string) {
  const normalized = amount.trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 && /^\d+(\.\d{1,7})?$/.test(normalized);
}

export function formatXlmBalance(balance: string | number | null | undefined, precision = 7) {
  if (balance === null || balance === undefined || balance === "") {
    return "-";
  }

  const numeric = Number(balance);

  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

async function ensureWalletKit() {
  if (typeof window === "undefined") {
    throw new WalletFlowError("wallet_unavailable", "Wallets can only be used in the browser.");
  }

  if (kitInitialized && walletKit) {
    return walletKit;
  }

  const { StellarWalletsKit } = await import("@creit-tech/stellar-wallets-kit/sdk");

  StellarWalletsKit.init({
    modules: [createFreighterKitModule()],
    network: STELLAR_TESTNET.networkPassphrase as never,
    authModal: {
      showInstallLabel: true,
      hideUnsupportedWallets: false,
    },
  });
  walletKit = StellarWalletsKit;
  kitInitialized = true;

  return StellarWalletsKit;
}

function createFreighterKitModule(): ModuleInterface {
  return {
    moduleType: "HOT_WALLET" as never,
    productId: "freighter",
    productName: "Freighter",
    productUrl: "https://freighter.app/",
    productIcon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%23059669'/%3E%3Cpath d='M11 21.5 18.5 29 30 12' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
    async isAvailable() {
      const result = assertWalletApiResponse(
        await freighterApi.isConnected(),
        "Freighter extension could not be checked.",
      );

      return Boolean(result.isConnected);
    },
    async getAddress() {
      const result = assertWalletApiResponse(
        await freighterApi.requestAccess(),
        "Freighter access was rejected.",
      );

      if (!result.address) {
        throw new WalletFlowError("wallet_address_missing", "Freighter address could not be read.");
      }

      selectedWalletName = "Freighter";

      return { address: result.address };
    },
    async signTransaction(xdr, opts) {
      const result = assertWalletApiResponse(
        await freighterApi.signTransaction(xdr, opts),
        "Transaction signing failed.",
      );

      return {
        signedTxXdr: result.signedTxXdr,
        signerAddress: result.signerAddress,
      };
    },
    async signAuthEntry(authEntry, opts) {
      const result = assertWalletApiResponse(
        await freighterApi.signAuthEntry(authEntry, opts),
        "Auth entry signing failed.",
      );

      if (!result.signedAuthEntry) {
        throw new WalletFlowError("sign_rejected", "Auth entry signing was rejected.");
      }

      return {
        signedAuthEntry: result.signedAuthEntry,
        signerAddress: result.signerAddress,
      };
    },
    async signMessage(message, opts) {
      const result = assertWalletApiResponse(
        await freighterApi.signMessage(message, opts),
        "Message signing failed.",
      );

      if (!result.signedMessage) {
        throw new WalletFlowError("sign_rejected", "Message signing was rejected.");
      }

      return {
        signedMessage: String(result.signedMessage),
        signerAddress: result.signerAddress,
      };
    },
    async getNetwork() {
      const result = assertWalletApiResponse(
        await freighterApi.getNetworkDetails(),
        "Could not read Freighter network details.",
      );

      return {
        network: result.network || STELLAR_TESTNET.name,
        networkPassphrase: result.networkPassphrase,
      };
    },
  };
}

function normalizeWalletError(error: unknown): WalletFlowError {
  if (error instanceof WalletFlowError) {
    return error;
  }

  const message = readErrorMessage(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("freighter") ||
    normalized.includes("extension") ||
    normalized.includes("undefined") ||
    normalized.includes("not installed") ||
    normalized.includes("not connected")
  ) {
    return new WalletFlowError(
      "wallet_unavailable",
      "Freighter bu tarayıcıda görünmüyor. Codex in-app browser uzantı popup'ını açamayabilir; aynı adresi Freighter kurulu Chrome veya Brave tarayıcıda açıp tekrar dene.",
    );
  }

  if (normalized.includes("closed") || normalized.includes("reject") || normalized.includes("denied")) {
    return new WalletFlowError("wallet_rejected", message || "Wallet connection was rejected.");
  }

  if (normalized.includes("not found") || normalized.includes("unavailable") || normalized.includes("not available")) {
    return new WalletFlowError("wallet_unavailable", message || "No supported Stellar wallet was found.");
  }

  return new WalletFlowError("unknown", message || "Wallet action failed.");
}

export async function connectWalletKit(): Promise<WalletSession> {
  const module = createFreighterKitModule();
  let access: { address: string };

  try {
    access = await module.getAddress();
  } catch (error) {
    throw normalizeWalletError(error);
  }

  if (!access.address) {
    throw new WalletFlowError(
      "wallet_address_missing",
      "Wallet address could not be read. Open the wallet and try again.",
    );
  }

  const network = await module.getNetwork();

  if (network.networkPassphrase !== STELLAR_TESTNET.networkPassphrase) {
    throw new WalletFlowError("wrong_network", "Please switch your Stellar wallet to Testnet.");
  }

  return {
    address: access.address,
    network: network.network || STELLAR_TESTNET.name,
    networkPassphrase: network.networkPassphrase,
    walletName: selectedWalletName,
  };
}

export async function disconnectWalletKit() {
  const kit = await ensureWalletKit();
  await kit.disconnect();
}

export async function getWalletNetwork() {
  let network;

  try {
    network = await createFreighterKitModule().getNetwork();
  } catch (error) {
    throw normalizeWalletError(error);
  }

  if (network.networkPassphrase !== STELLAR_TESTNET.networkPassphrase) {
    throw new WalletFlowError("wrong_network", "Please switch your Stellar wallet to Testnet.");
  }

  return network;
}

export async function signWithWallet(xdr: string, address: string) {
  const module = createFreighterKitModule();

  try {
    return await module.signTransaction(xdr, {
      address,
      networkPassphrase: STELLAR_TESTNET.networkPassphrase,
    });
  } catch (error) {
    const normalized = normalizeWalletError(error);

    if (normalized.code === "wallet_rejected") {
      throw new WalletFlowError("sign_rejected", normalized.message);
    }

    throw normalized;
  }
}

export async function fetchXlmBalance(address: string): Promise<BalanceResult> {
  const account = await server.loadAccount(address);
  const nativeBalance = account.balances.find((balance) => balance.asset_type === "native");

  return {
    xlm: nativeBalance?.balance ?? "0",
  };
}

export async function sendTestnetXlm({
  source,
  destination,
  amount,
}: SendPaymentInput): Promise<SendPaymentResult> {
  if (!validatePublicKey(destination)) {
    throw new WalletFlowError("invalid_recipient", "Recipient address is not a valid Stellar public key.");
  }

  if (!validateAmount(amount)) {
    throw new WalletFlowError("invalid_amount", "Amount must be positive and use up to 7 decimal places.");
  }

  await getWalletNetwork();

  const account = await server.loadAccount(source);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_TESTNET.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(60)
    .build();

  let signed;

  try {
    signed = await signWithWallet(transaction.toXDR(), source);
  } catch (error) {
    throw new WalletFlowError("sign_rejected", readErrorMessage(error));
  }

  const signedTransaction = new Transaction(
    signed.signedTxXdr,
    STELLAR_TESTNET.networkPassphrase,
  );
  let result;

  try {
    result = await server.submitTransaction(signedTransaction);
  } catch (error) {
    throw normalizeSubmitError(error);
  }

  return {
    hash: result.hash,
  };
}

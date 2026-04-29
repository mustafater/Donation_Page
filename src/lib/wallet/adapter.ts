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

export const STELLAR_TESTNET = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  name: "TESTNET",
};

export const NETWORK_FEE_BUFFER_XLM = 0.00001;

const server = new Horizon.Server(STELLAR_TESTNET.horizonUrl);
const { getNetworkDetails, isConnected, requestAccess, signTransaction } = freighterApi;

export type WalletErrorCode =
  | "freighter_unavailable"
  | "freighter_access_rejected"
  | "freighter_address_missing"
  | "wrong_network"
  | "invalid_recipient"
  | "invalid_amount"
  | "insufficient_balance"
  | "sign_rejected"
  | "destination_missing"
  | "horizon_error"
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

function getFreighterErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

function assertFreighterResponse<T extends { error?: unknown }>(response: T, fallback: string) {
  if (response.error) {
    throw new Error(getFreighterErrorMessage(response.error, fallback));
  }

  return response;
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

export async function connectFreighter(): Promise<WalletSession> {
  const connection = assertFreighterResponse(
    await isConnected(),
    "Freighter extension could not be checked.",
  );

  if (!connection.isConnected) {
    throw new WalletFlowError(
      "freighter_unavailable",
      "Freighter bulunamadı. Lütfen Freighter eklentisinin kurulu, açık ve bu tarayıcıda aktif olduğundan emin ol.",
    );
  }

  let access;

  try {
    access = assertFreighterResponse(
      await requestAccess(),
      "Freighter erişimi onaylanmadı. Cüzdan kilitli olabilir veya izin penceresi kapatılmış olabilir.",
    );
  } catch (error) {
    throw new WalletFlowError("freighter_access_rejected", readErrorMessage(error));
  }

  if (!access.address) {
    throw new WalletFlowError(
      "freighter_address_missing",
      "Freighter adresi alınamadı. Cüzdanı açıp tekrar deneyebilirsin.",
    );
  }

  const network = assertFreighterResponse(
    await getNetworkDetails(),
    "Could not read Freighter network details.",
  );

  if (network.networkPassphrase !== STELLAR_TESTNET.networkPassphrase) {
    throw new WalletFlowError("wrong_network", "Please switch Freighter to Stellar Testnet.");
  }

  return {
    address: access.address,
    network: network.network || STELLAR_TESTNET.name,
    networkPassphrase: network.networkPassphrase,
  };
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

  const network = assertFreighterResponse(
    await getNetworkDetails(),
    "Could not read Freighter network details.",
  );

  if (network.networkPassphrase !== STELLAR_TESTNET.networkPassphrase) {
    throw new WalletFlowError("wrong_network", "Please switch Freighter to Stellar Testnet before sending.");
  }

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
    signed = assertFreighterResponse(
      await signTransaction(transaction.toXDR(), {
        address: source,
        networkPassphrase: STELLAR_TESTNET.networkPassphrase,
      }),
      "Transaction signing was rejected or failed.",
    );
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

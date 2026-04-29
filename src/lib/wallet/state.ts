import { get, writable } from "svelte/store";
import {
  NETWORK_FEE_BUFFER_XLM,
  WalletFlowError,
  connectFreighter,
  fetchXlmBalance,
  sendTestnetXlm,
  shortenAddress,
  validateAmount,
  validatePublicKey,
  type WalletErrorCode,
  type WalletSession,
} from "./adapter";

export type WalletStatus = "idle" | "connecting" | "connected" | "error" | "sending" | "success";

export interface WalletState {
  status: WalletStatus;
  session: WalletSession | null;
  shortAddress: string;
  balance: string | null;
  txHash: string | null;
  error: string | null;
  errorCode: WalletErrorCode | null;
}

const initialState: WalletState = {
  status: "idle",
  session: null,
  shortAddress: "",
  balance: null,
  txHash: null,
  error: null,
  errorCode: null,
};

export const walletState = writable<WalletState>(initialState);

function getWalletError(error: unknown, fallback: string) {
  if (error instanceof WalletFlowError) {
    return {
      code: error.code,
      message: error.message || fallback,
    };
  }

  return {
    code: "unknown" as WalletErrorCode,
    message: error instanceof Error ? error.message : fallback,
  };
}

export async function connectWallet() {
  walletState.set({ ...initialState, status: "connecting" });

  try {
    const session = await connectFreighter();
    const balance = await fetchXlmBalance(session.address);

    walletState.set({
      status: "connected",
      session,
      shortAddress: shortenAddress(session.address),
      balance: balance.xlm,
      txHash: null,
      error: null,
      errorCode: null,
    });
  } catch (error) {
    const walletError = getWalletError(error, "Wallet connection failed.");

    walletState.set({
      ...initialState,
      status: "error",
      error: walletError.message,
      errorCode: walletError.code,
    });
  }
}

export function disconnectWallet() {
  walletState.set(initialState);
}

export async function refreshBalance() {
  const current = get(walletState);

  if (!current.session) {
    return;
  }

  try {
    const balance = await fetchXlmBalance(current.session.address);
    walletState.update((state) => ({
      ...state,
      balance: balance.xlm,
      error: null,
      errorCode: null,
    }));
  } catch (error) {
    const walletError = getWalletError(error, "Balance refresh failed.");

    walletState.update((state) => ({
      ...state,
      error: walletError.message,
      errorCode: walletError.code,
    }));
  }
}

export async function sendPayment(destination: string, amount: string) {
  const current = get(walletState);

  if (!current.session) {
    walletState.update((state) => ({
      ...state,
      status: "error",
      error: "Connect Freighter before sending a payment.",
      errorCode: "freighter_unavailable",
    }));
    return;
  }

  if (!validatePublicKey(destination)) {
    walletState.update((state) => ({
      ...state,
      status: "error",
      error: "Recipient address is not a valid Stellar public key.",
      errorCode: "invalid_recipient",
    }));
    return;
  }

  if (!validateAmount(amount)) {
    walletState.update((state) => ({
      ...state,
      status: "error",
      error: "Amount must be positive and use up to 7 decimal places.",
      errorCode: "invalid_amount",
    }));
    return;
  }

  if (current.balance !== null && Number(amount) + NETWORK_FEE_BUFFER_XLM > Number(current.balance)) {
    walletState.update((state) => ({
      ...state,
      status: "error",
      error: "Amount exceeds available XLM balance after the network fee buffer.",
      errorCode: "insufficient_balance",
    }));
    return;
  }

  walletState.update((state) => ({
    ...state,
    status: "sending",
    error: null,
    errorCode: null,
    txHash: null,
  }));

  try {
    const result = await sendTestnetXlm({
      source: current.session.address,
      destination,
      amount,
    });
    const balance = await fetchXlmBalance(current.session.address);

    walletState.update((state) => ({
      ...state,
      status: "success",
      balance: balance.xlm,
      txHash: result.hash,
      error: null,
      errorCode: null,
    }));
  } catch (error) {
    const walletError = getWalletError(error, "Transaction failed.");

    walletState.update((state) => ({
      ...state,
      status: "error",
      error: walletError.message,
      errorCode: walletError.code,
    }));
  }
}

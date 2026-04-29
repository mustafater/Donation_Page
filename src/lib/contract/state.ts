import { get, writable } from "svelte/store";
import { WalletFlowError, type WalletErrorCode } from "@/lib/wallet/adapter";
import { walletState } from "@/lib/wallet/state";
import {
  hasContractConfig,
  readDonationTotals,
  recordDonationIntent,
  stroopsToXlm,
  xlmToStroops,
  type ContractStatus,
} from "./client";

export interface DonationContractState {
  status: ContractStatus;
  programTotal: string;
  donorTotal: string;
  count: number;
  txHash: string | null;
  error: string | null;
  errorCode: WalletErrorCode | null;
  configured: boolean;
}

const initialState: DonationContractState = {
  status: "idle",
  programTotal: "0",
  donorTotal: "0",
  count: 0,
  txHash: null,
  error: null,
  errorCode: null,
  configured: hasContractConfig(),
};

export const donationContractState = writable<DonationContractState>(initialState);

function getFlowError(error: unknown, fallback: string) {
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

export function validateContractAmount(amount: string) {
  try {
    xlmToStroops(amount);
    return true;
  } catch {
    return false;
  }
}

export async function refreshContractTotals(program: string) {
  const wallet = get(walletState);

  if (!wallet.session || !hasContractConfig()) {
    donationContractState.update((state) => ({
      ...state,
      configured: hasContractConfig(),
      donorTotal: "0",
    }));
    return;
  }

  try {
    const totals = await readDonationTotals(wallet.session.address, wallet.session.address, program);

    donationContractState.update((state) => ({
      ...state,
      configured: true,
      programTotal: stroopsToXlm(totals.programTotalStroops),
      donorTotal: stroopsToXlm(totals.donorTotalStroops),
      count: totals.count,
      error: null,
      errorCode: null,
    }));
  } catch (error) {
    const flowError = getFlowError(error, "Contract totals could not be refreshed.");

    donationContractState.update((state) => ({
      ...state,
      configured: hasContractConfig(),
      error: flowError.message,
      errorCode: flowError.code,
    }));
  }
}

export async function submitContractDonation(program: string, amountXlm: string, memo: string) {
  const wallet = get(walletState);

  if (!wallet.session) {
    donationContractState.update((state) => ({
      ...state,
      status: "fail",
      error: "Connect a Stellar wallet before writing to the contract.",
      errorCode: "wallet_unavailable",
    }));
    return;
  }

  if (!hasContractConfig()) {
    donationContractState.update((state) => ({
      ...state,
      status: "fail",
      configured: false,
      error: "Contract id is missing. Deploy the contract and set PUBLIC_STELLAR_CONTRACT_ID.",
      errorCode: "contract_error",
    }));
    return;
  }

  if (!validateContractAmount(amountXlm)) {
    donationContractState.update((state) => ({
      ...state,
      status: "fail",
      error: "Amount must be positive and use up to 7 decimal places.",
      errorCode: "invalid_amount",
    }));
    return;
  }

  try {
    const result = await recordDonationIntent({
      source: wallet.session.address,
      program,
      amountXlm,
      memo,
      onStatus(status) {
        donationContractState.update((state) => ({
          ...state,
          status,
          error: null,
          errorCode: null,
          txHash: status === "success" ? state.txHash : null,
        }));
      },
    });

    donationContractState.update((state) => ({
      ...state,
      status: "success",
      txHash: result.hash,
      error: null,
      errorCode: null,
    }));

    await refreshContractTotals(program);
  } catch (error) {
    const flowError = getFlowError(error, "Contract donation record failed.");

    donationContractState.update((state) => ({
      ...state,
      status: "fail",
      error: flowError.message,
      errorCode: flowError.code,
    }));
  }
}

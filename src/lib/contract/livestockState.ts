import { get, writable } from "svelte/store";
import { WalletFlowError, type WalletErrorCode } from "@/lib/wallet/adapter";
import { walletState } from "@/lib/wallet/state";
import {
  hasContractConfig,
  readLivestockTotals,
  recordLivestockDonation,
  stroopsToXlm,
  validateLivestockUnits,
  type ContractStatus,
  type LivestockAnimalType,
} from "./client";
import { validateContractAmount } from "./state";

export interface LivestockContractState {
  status: ContractStatus;
  animalType: LivestockAnimalType;
  programAmountTotal: string;
  programUnitsTotal: number;
  donorAmountTotal: string;
  donorUnitsTotal: number;
  count: number;
  txHash: string | null;
  error: string | null;
  errorCode: WalletErrorCode | null;
  configured: boolean;
}

const initialState: LivestockContractState = {
  status: "idle",
  animalType: "sheep",
  programAmountTotal: "0",
  programUnitsTotal: 0,
  donorAmountTotal: "0",
  donorUnitsTotal: 0,
  count: 0,
  txHash: null,
  error: null,
  errorCode: null,
  configured: hasContractConfig(),
};

export const livestockContractState = writable<LivestockContractState>(initialState);

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

export function validateLivestockForm(units: string, amountXlm: string) {
  if (!validateLivestockUnits(units)) {
    return "invalid_units";
  }

  if (!validateContractAmount(amountXlm)) {
    return "invalid_amount";
  }

  return "";
}

export async function refreshLivestockTotals(program: string, animalType: LivestockAnimalType) {
  const wallet = get(walletState);

  if (!wallet.session || !hasContractConfig()) {
    livestockContractState.update((state) => ({
      ...state,
      animalType,
      configured: hasContractConfig(),
      donorAmountTotal: "0",
      donorUnitsTotal: 0,
    }));
    return;
  }

  try {
    const totals = await readLivestockTotals(
      wallet.session.address,
      wallet.session.address,
      program,
      animalType,
    );

    livestockContractState.update((state) => ({
      ...state,
      animalType,
      configured: true,
      programAmountTotal: stroopsToXlm(totals.programTotal.amountStroops),
      programUnitsTotal: totals.programTotal.units,
      donorAmountTotal: stroopsToXlm(totals.donorTotal.amountStroops),
      donorUnitsTotal: totals.donorTotal.units,
      count: totals.programTotal.count,
      error: null,
      errorCode: null,
    }));
  } catch (error) {
    const flowError = getFlowError(error, "Livestock totals could not be refreshed.");

    livestockContractState.update((state) => ({
      ...state,
      animalType,
      configured: hasContractConfig(),
      error: flowError.message,
      errorCode: flowError.code,
    }));
  }
}

export async function submitLivestockDonation(
  program: string,
  animalType: LivestockAnimalType,
  units: string,
  amountXlm: string,
  memo: string,
) {
  const wallet = get(walletState);

  if (!wallet.session) {
    livestockContractState.update((state) => ({
      ...state,
      status: "fail",
      animalType,
      error: "Connect a Stellar wallet before writing livestock donation.",
      errorCode: "wallet_unavailable",
    }));
    return;
  }

  if (!hasContractConfig()) {
    livestockContractState.update((state) => ({
      ...state,
      status: "fail",
      animalType,
      configured: false,
      error: "Contract id is missing. Deploy the contract and set PUBLIC_STELLAR_CONTRACT_ID.",
      errorCode: "contract_error",
    }));
    return;
  }

  const formError = validateLivestockForm(units, amountXlm);

  if (formError) {
    livestockContractState.update((state) => ({
      ...state,
      status: "fail",
      animalType,
      error: formError === "invalid_units"
        ? "Units must be a positive integer."
        : "Amount must be positive and use up to 7 decimal places.",
      errorCode: "invalid_amount",
    }));
    return;
  }

  try {
    const result = await recordLivestockDonation({
      source: wallet.session.address,
      program,
      animalType,
      units,
      amountXlm,
      memo,
      onStatus(status) {
        livestockContractState.update((state) => ({
          ...state,
          status,
          animalType,
          error: null,
          errorCode: null,
          txHash: status === "success" ? state.txHash : null,
        }));
      },
    });

    livestockContractState.update((state) => ({
      ...state,
      status: "success",
      animalType,
      txHash: result.hash,
      error: null,
      errorCode: null,
    }));

    await refreshLivestockTotals(program, animalType);
  } catch (error) {
    const flowError = getFlowError(error, "Livestock donation record failed.");

    livestockContractState.update((state) => ({
      ...state,
      status: "fail",
      animalType,
      error: flowError.message,
      errorCode: flowError.code,
    }));
  }
}

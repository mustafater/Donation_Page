import {
  Address,
  BASE_FEE,
  Operation,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import { CONTRACT_CONFIG } from "./config";
import { WalletFlowError, getWalletNetwork, signWithWallet } from "@/lib/wallet/adapter";

const STROOPS_PER_XLM = 10_000_000n;

export type ContractStatus = "idle" | "simulating" | "signing" | "pending" | "success" | "fail";

export interface ContractDonationInput {
  source: string;
  program: string;
  amountXlm: string;
  memo: string;
  onStatus?: (status: ContractStatus) => void;
}

export interface ContractDonationResult {
  hash: string;
}

export interface DonationTotals {
  programTotalStroops: bigint;
  donorTotalStroops: bigint;
  count: number;
}

const server = new rpc.Server(CONTRACT_CONFIG.rpcUrl);

export function hasContractConfig() {
  return Boolean(CONTRACT_CONFIG.contractId);
}

export function xlmToStroops(amount: string) {
  const normalized = amount.trim();

  if (!/^\d+(\.\d{1,7})?$/.test(normalized)) {
    throw new WalletFlowError("invalid_amount", "Amount must be positive and use up to 7 decimal places.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const stroops = BigInt(whole) * STROOPS_PER_XLM + BigInt(fraction.padEnd(7, "0"));

  if (stroops <= 0n) {
    throw new WalletFlowError("invalid_amount", "Amount must be positive.");
  }

  return stroops;
}

export function stroopsToXlm(stroops: bigint | number | string) {
  const value = BigInt(stroops);
  const whole = value / STROOPS_PER_XLM;
  const fraction = (value % STROOPS_PER_XLM).toString().padStart(7, "0").replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function assertContractId() {
  if (!CONTRACT_CONFIG.contractId) {
    throw new WalletFlowError(
      "contract_error",
      "Contract id is missing. Set PUBLIC_STELLAR_CONTRACT_ID in .env after deployment.",
    );
  }
}

function buildInvokeArgs(program: string, donor?: string, amountStroops?: bigint, memo?: string) {
  const args = [];

  if (donor) {
    args.push(Address.fromString(donor).toScVal());
  }

  args.push(nativeToScVal(program, { type: "symbol" }));

  if (amountStroops !== undefined) {
    args.push(nativeToScVal(amountStroops, { type: "i128" }));
  }

  if (memo !== undefined) {
    args.push(nativeToScVal(memo, { type: "string" }));
  }

  return args;
}

async function buildTransaction(source: string, functionName: string, args: ReturnType<typeof buildInvokeArgs>) {
  assertContractId();

  const account = await server.getAccount(source);

  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: CONTRACT_CONFIG.networkPassphrase,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_CONFIG.contractId,
        function: functionName,
        args,
      }),
    )
    .setTimeout(60)
    .build();
}

async function simulateRead<T>(source: string, functionName: string, args: ReturnType<typeof buildInvokeArgs>) {
  try {
    const tx = await buildTransaction(source, functionName, args);
    const simulation = await server.simulateTransaction(tx);

    if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) {
      throw new WalletFlowError("contract_error", "Contract simulation failed.");
    }

    return scValToNative(simulation.result.retval) as T;
  } catch (error) {
    if (error instanceof WalletFlowError) {
      throw error;
    }

    throw new WalletFlowError("rpc_error", "Could not read contract state from Stellar RPC.");
  }
}

export async function readDonationTotals(source: string, donor: string | null, program: string): Promise<DonationTotals> {
  if (!hasContractConfig()) {
    throw new WalletFlowError(
      "contract_error",
      "Contract id is missing. Set PUBLIC_STELLAR_CONTRACT_ID in .env after deployment.",
    );
  }

  const readSource = donor || source;
  const [programTotal, donorTotal, count] = await Promise.all([
    simulateRead<bigint>(readSource, "get_total", buildInvokeArgs(program)),
    donor
      ? simulateRead<bigint>(readSource, "get_donor_total", buildInvokeArgs(program, donor))
      : Promise.resolve(0n),
    simulateRead<number>(readSource, "get_count", buildInvokeArgs(program)),
  ]);

  return {
    programTotalStroops: BigInt(programTotal),
    donorTotalStroops: BigInt(donorTotal),
    count: Number(count),
  };
}

export async function recordDonationIntent({
  source,
  program,
  amountXlm,
  memo,
  onStatus,
}: ContractDonationInput): Promise<ContractDonationResult> {
  await getWalletNetwork();
  const amountStroops = xlmToStroops(amountXlm);

  try {
    onStatus?.("simulating");
    const transaction = await buildTransaction(
      source,
      "donate",
      buildInvokeArgs(program, source, amountStroops, memo.trim().slice(0, 120)),
    );
    const prepared = await server.prepareTransaction(transaction);

    onStatus?.("signing");
    const signed = await signWithWallet(prepared.toXDR(), source);
    const signedTransaction = new Transaction(signed.signedTxXdr, CONTRACT_CONFIG.networkPassphrase);

    onStatus?.("pending");
    const sent = await server.sendTransaction(signedTransaction);

    if (sent.status !== "PENDING" && sent.status !== "DUPLICATE") {
      throw new WalletFlowError("rpc_error", sent.errorResult?.toString() || "RPC rejected the transaction.");
    }

    const final = await server.pollTransaction(sent.hash, { attempts: 18 });

    if (final.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
      throw new WalletFlowError("contract_error", "Contract transaction failed on Testnet.");
    }

    onStatus?.("success");

    return {
      hash: sent.hash,
    };
  } catch (error) {
    onStatus?.("fail");

    if (error instanceof WalletFlowError) {
      throw error;
    }

    throw new WalletFlowError("contract_error", "Contract donation record could not be submitted.");
  }
}

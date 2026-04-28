export interface WalletSession {
  address: string;
  chainId: number;
}

export async function getWalletSession(): Promise<WalletSession | null> {
  return null;
}

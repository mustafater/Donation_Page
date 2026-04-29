import { rpc } from "@stellar/stellar-sdk";
import { CONTRACT_CONFIG } from "./config";

const server = new rpc.Server(CONTRACT_CONFIG.rpcUrl);

export interface DonationEventPoller {
  stop: () => void;
}

export function startDonationEventPolling(onEvent: () => void): DonationEventPoller {
  if (!CONTRACT_CONFIG.contractId || typeof window === "undefined") {
    return { stop: () => undefined };
  }

  let stopped = false;
  let cursor: string | undefined;
  let startLedger: number | undefined;

  async function poll() {
    if (stopped) {
      return;
    }

    try {
      if (!cursor && startLedger === undefined) {
        const latest = await server.getLatestLedger();
        startLedger = Math.max(1, latest.sequence - 20);
      }

      const filters: rpc.Api.EventFilter[] = [
        {
          type: "contract",
          contractIds: [CONTRACT_CONFIG.contractId],
        },
      ];
      const response = cursor
        ? await server.getEvents({ filters, cursor, limit: 10 })
        : await server.getEvents({ filters, startLedger: startLedger ?? 1, limit: 10 });

      if (response.events.length > 0) {
        cursor = response.cursor;
        onEvent();
      }
    } catch {
      // Polling is only a freshness helper; explicit reads remain the source of truth.
    } finally {
      if (!stopped) {
        window.setTimeout(poll, 8000);
      }
    }
  }

  poll();

  return {
    stop() {
      stopped = true;
    },
  };
}

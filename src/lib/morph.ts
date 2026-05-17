export const morphHoodi = {
  name: "Morph Hoodi Testnet",
  shortName: "Morph Hoodi",
  chainId: 2910,
  chainIdHex: "0xb5e",
  rpcUrl: "https://rpc-hoodi.morph.network",
  explorerUrl: "https://explorer-hoodi.morph.network",
  bridgeUrl: "https://bridge-hoodi.morph.network",
  faucetUrl: "https://morph-rails-hoodi.morph.network",
  currency: "ETH",
  rpcLimit: "600 req/min/IP",
};

export const hackathonTracks = [
  {
    title: "Payroll + B2B",
    fit: "Batch payouts with private accounting context for teams and vendors.",
    feature: "Batch payroll, invoice reconciliation, ledger exports",
  },
  {
    title: "SME Payments",
    fit: "Merchant payment records that explain settlement, fee, and customer context.",
    feature: "Payment links, customer memos, receipt vault",
  },
  {
    title: "FX Treasury",
    fit: "Swaps, bridges, and treasury moves that stay explainable after the fact.",
    feature: "Bridge/swap classification and chain-aware reporting",
  },
  {
    title: "x402 Agentic Payments",
    fit: "Agent payments with task, tool, policy, and explanation memory.",
    feature: "Agent spend ledger and review queue",
  },
];

export const morphBuildChecklist = [
  "Add Morph Hoodi Testnet to wallet",
  "Claim or bridge Hoodi ETH for test gas",
  "Create a direct PayMemo payment intent",
  "Capture a wallet-assist transaction from an external dApp",
  "Record an agent spend explanation",
  "Export the private ledger for the demo",
];

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type TransactionReceipt = {
  transactionHash: string;
  status?: "0x0" | "0x1";
  blockNumber?: string;
};

export function getEthereumProvider() {
  if (typeof window === "undefined") return null;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null;
}

export async function addMorphHoodiToWallet() {
  const ethereum = getEthereumProvider();
  if (!ethereum) throw new Error("No browser wallet found");

  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: morphHoodi.chainIdHex,
        chainName: morphHoodi.name,
        nativeCurrency: {
          name: morphHoodi.currency,
          symbol: morphHoodi.currency,
          decimals: 18,
        },
        rpcUrls: [morphHoodi.rpcUrl],
        blockExplorerUrls: [morphHoodi.explorerUrl],
      },
    ],
  });
}

export async function switchToMorphHoodi() {
  const ethereum = getEthereumProvider();
  if (!ethereum) throw new Error("No browser wallet found");

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: morphHoodi.chainIdHex }],
    });
  } catch {
    await addMorphHoodiToWallet();
  }
}

export async function connectWallet() {
  const ethereum = getEthereumProvider();
  if (!ethereum) throw new Error("No browser wallet found");
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  await switchToMorphHoodi();
  return accounts[0] ?? "";
}

export function shortAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function parseUnits(value: string, decimals: number) {
  const normalized = value.trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid amount.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(paddedFraction || "0");
}

export function toQuantity(value: bigint) {
  return `0x${value.toString(16)}`;
}

function pad32(hex: string) {
  return hex.replace(/^0x/, "").padStart(64, "0");
}

export function buildErc20TransferData(to: string, amount: string, decimals = 6) {
  if (!isAddress(to)) throw new Error("Recipient must be a full EVM address.");
  const units = parseUnits(amount, decimals);
  return `0xa9059cbb${pad32(to)}${pad32(toQuantity(units))}`;
}

export async function sendNativePayment(from: string, to: string, amount: string) {
  const ethereum = getEthereumProvider();
  if (!ethereum) throw new Error("No browser wallet found.");
  if (!isAddress(to)) throw new Error("Recipient must be a full EVM address.");

  return (await ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to,
        value: toQuantity(parseUnits(amount, 18)),
      },
    ],
  })) as string;
}

export async function sendErc20Payment({
  from,
  tokenContract,
  to,
  amount,
  decimals = 6,
}: {
  from: string;
  tokenContract: string;
  to: string;
  amount: string;
  decimals?: number;
}) {
  const ethereum = getEthereumProvider();
  if (!ethereum) throw new Error("No browser wallet found.");
  if (!isAddress(tokenContract)) throw new Error("Token contract is not configured.");

  return (await ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: tokenContract,
        value: "0x0",
        data: buildErc20TransferData(to, amount, decimals),
      },
    ],
  })) as string;
}

export async function getTransactionReceipt(txHash: string) {
  const response = await fetch(morphHoodi.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "eth_getTransactionReceipt",
      params: [txHash],
    }),
  });

  if (!response.ok) {
    throw new Error("Morph RPC did not return a receipt response.");
  }

  const payload = (await response.json()) as { result: TransactionReceipt | null };
  return payload.result;
}

export async function waitForTransactionReceipt(
  txHash: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const intervalMs = options.intervalMs ?? 3_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const receipt = await getTransactionReceipt(txHash);
    if (receipt) return receipt;
    await new Promise((resolve) => {
      window.setTimeout(resolve, intervalMs);
    });
  }

  throw new Error("Timed out waiting for Morph confirmation.");
}

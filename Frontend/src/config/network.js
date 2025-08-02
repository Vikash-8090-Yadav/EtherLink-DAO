// Network configuration for Etherlink
export const NETWORK_CONFIG = {
  Etherlink: {
    rpcUrl: "https://node.ghostnet.etherlink.com",
    chainId: 128123,
    chainName: "Etherlink",
    nativeCurrency: {
      name: "Etherlink",
      symbol: "XTZ",
      decimals: 18,
    },
    blockExplorerUrl: "https://testnet.explorer.etherlink.com",
    faucetUrl: "https://faucet.etherlink.com/"
  }
};

// Default network
export const DEFAULT_NETWORK = "Etherlink";

// Helper function to get current network config
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[DEFAULT_NETWORK];
}; 
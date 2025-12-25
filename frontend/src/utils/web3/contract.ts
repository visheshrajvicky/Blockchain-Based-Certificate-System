import { ethers } from 'ethers';
import CertificateVerificationArtifact from './CertificateVerification.json';

// Types for blockchain configuration
interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

interface NetworkConfig {
  chainId: string;
  chainName: string;
  rpcUrl: string;
  contractAddress: string;
  blockExplorer: string;
  nativeCurrency?: NativeCurrency;
}

// Use the actual compiled contract ABI
export const CERTIFICATE_CONTRACT_ABI = CertificateVerificationArtifact.abi;

// Blockchain configuration
export const BLOCKCHAIN_CONFIG: Record<string, NetworkConfig> = {
  localhost: {
    chainId: '0x7A69', // 31337 in hex
    chainName: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_LOCALHOST || '',
    blockExplorer: ''
  },
  mumbai: {
    chainId: '0x13881', // 80001 in hex
    chainName: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_MUMBAI || '',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  polygon: {
    chainId: '0x89', // 137 in hex
    chainName: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_POLYGON || '',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  }
};

// Get current network configuration
export const getCurrentNetwork = () => {
  const network = import.meta.env.VITE_BLOCKCHAIN_NETWORK || 'localhost';
  return BLOCKCHAIN_CONFIG[network as keyof typeof BLOCKCHAIN_CONFIG];
};

// Get contract instance
export const getContractInstance = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  const network = getCurrentNetwork();
  console.log('Using contract address:', network.contractAddress);
  return new ethers.Contract(
    network.contractAddress,
    CERTIFICATE_CONTRACT_ABI,
    signerOrProvider
  );
};

// Switch network helper
export const switchNetwork = async (chainId: string) => {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }]
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      const network = Object.values(BLOCKCHAIN_CONFIG).find(n => n.chainId === chainId);
      if (network) {
        const params: any = {
          chainId,
          chainName: network.chainName,
          rpcUrls: [network.rpcUrl]
        };
        
        if (network.nativeCurrency) {
          params.nativeCurrency = network.nativeCurrency;
        }
        
        if (network.blockExplorer) {
          params.blockExplorerUrls = [network.blockExplorer];
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [params]
        });
      }
    } else {
      throw switchError;
    }
  }
};

// Format address
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format transaction hash
export const formatTxHash = (hash: string) => {
  if (!hash) return '';
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
};

// Get block explorer URL
export const getBlockExplorerUrl = (hash: string, type: 'tx' | 'address' = 'tx') => {
  const network = getCurrentNetwork();
  if (!network.blockExplorer) return '';
  return `${network.blockExplorer}/${type}/${hash}`;
};

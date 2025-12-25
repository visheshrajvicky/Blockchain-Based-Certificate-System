import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { getCurrentNetwork, switchNetwork } from '../utils/web3/contract';

interface Web3ContextType {
  account: string | null;
  chainId: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToCorrectNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  isConnected: false,
  isCorrectNetwork: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToCorrectNetwork: async () => {}
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const expectedNetwork = getCurrentNetwork();
  const isCorrectNetwork = chainId?.toLowerCase() === expectedNetwork.chainId.toLowerCase();
  const isConnected = !!account;

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this feature');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();

      setAccount(accounts[0]);
      setChainId('0x' + network.chainId.toString(16));
      setProvider(provider);
      setSigner(signer);

      // Check if on correct network
      if (('0x' + network.chainId.toString(16)).toLowerCase() !== expectedNetwork.chainId.toLowerCase()) {
        await switchToCorrectNetwork();
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
  };

  const switchToCorrectNetwork = async () => {
    try {
      await switchNetwork(expectedNetwork.chainId);
      // Refresh connection after network switch
      if (provider) {
        const network = await provider.getNetwork();
        setChainId('0x' + network.chainId.toString(16));
      }
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
      // Reload provider and signer
      if (window.ethereum) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
        newProvider.getSigner().then(setSigner);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        connectWallet();
      }
    });

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        isConnected,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        switchToCorrectNetwork
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

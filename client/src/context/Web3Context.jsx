import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);

  const updateWeb3State = useCallback(async (browserProvider) => {
    try {
      const currentSigner = await browserProvider.getSigner();
      const currentAccount = await currentSigner.getAddress();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(currentAccount);
      setChainId(network.chainId.toString());
    } catch (error) {
      console.error("Error setting up Web3 state:", error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      await updateWeb3State(browserProvider);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  }, [updateWeb3State]);

  useEffect(() => {
    if (!window.ethereum) return;

    const browserProvider = new ethers.BrowserProvider(window.ethereum);

    browserProvider
      .send("eth_accounts", [])
      .then((accounts) => {
        if (accounts.length > 0) updateWeb3State(browserProvider);
      })
      .catch((err) => console.error("Auto connect error:", err));

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        await updateWeb3State(new ethers.BrowserProvider(window.ethereum));
      } else {
        setAccount(null);
        setSigner(null);
        setProvider(null);
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [updateWeb3State]);

  return (
    <Web3Context.Provider
      value={{ account, provider, signer, chainId, connectWallet }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);

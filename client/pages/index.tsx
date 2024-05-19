'use client';

import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import MyToken from '../../contracts/build/contracts/GambleToken.json';
import Lottery from '../../contracts/build/contracts/Lottery.json';

declare global {
  interface Window {
    ethereum: any;
  }
}

interface Network {
  address: string;
}

const Home = () => {
  const [account, setAccount] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState<string>('');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [lotteryContract, setLotteryContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      setProvider(provider);

      const signer = provider.getSigner();
      const account = await signer.getAddress();
      setAccount(account);

      const networkId = (await provider.getNetwork()).chainId;
      const deployedTokenNetwork = (MyToken.networks as { [key: number]: Network })[networkId];
      const deployedLotteryNetwork = (Lottery.networks as { [key: number]: Network })[networkId];

      if (deployedTokenNetwork && deployedLotteryNetwork) {
        const tokenContract = new ethers.Contract(deployedTokenNetwork.address, MyToken.abi, signer);
        setTokenContract(tokenContract);

        const lotteryContract = new ethers.Contract(deployedLotteryNetwork.address, Lottery.abi, signer);
        setLotteryContract(lotteryContract);

        const balance = await tokenContract.balanceOf(account);
        setTokenBalance(ethers.utils.formatEther(balance));
      } else {
        console.log('Smart contract not deployed to detected network.');
      }
    } else {
      console.log('MetaMask not detected');
    }
  };

  const transferTokens = async (recipient: string, amount: string) => {
    if (tokenContract) {
      const tx = await tokenContract.transfer(recipient, ethers.utils.parseEther(amount));
      await tx.wait();
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(balance));
    }
  };

  const enterLottery = async () => {
    if (lotteryContract && tokenContract) {
      const tx = await tokenContract.approve(lotteryContract.address, ethers.utils.parseEther('100'));
      await tx.wait();
      const enterTx = await lotteryContract.enterLottery();
      await enterTx.wait();
      const balance = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(balance));
    }
  };

  return (
    <div>
      <h1>MyToken Balance</h1>
      <p>Your account: {account}</p>
      <p>Your balance: {tokenBalance} MTK</p>
      <form onSubmit={(e) => {
        e.preventDefault();
        const recipient = (e.target as any).recipient.value;
        const amount = (e.target as any).amount.value;
        transferTokens(recipient, amount);
      }}>
        <input type="text" name="recipient" placeholder="Recipient Address" required />
        <input type="number" name="amount" placeholder="Amount" required />
        <button type="submit">Transfer</button>
      </form>
      <button onClick={enterLottery}>Enter Lottery</button>
    </div>
  );
};

export default Home;

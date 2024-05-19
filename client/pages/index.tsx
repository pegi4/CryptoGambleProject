// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
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
  const [accounts, setAccounts] = useState<string[]>([]);
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [lotteryContract, setLotteryContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      setProvider(provider);

      const accounts = await provider.listAccounts();
      setAccounts(accounts);

      const networkId = (await provider.getNetwork()).chainId;
      console.log('Detected network ID:', networkId);

      const deployedTokenNetwork = (MyToken.networks as { [key: number]: Network })[networkId];
      const deployedLotteryNetwork = (Lottery.networks as { [key: number]: Network })[networkId];

      if (deployedTokenNetwork && deployedLotteryNetwork) {
        console.log('Token address:', deployedTokenNetwork.address);
        console.log('Lottery address:', deployedLotteryNetwork.address);

        const tokenContract = new ethers.Contract(deployedTokenNetwork.address, MyToken.abi, provider.getSigner(accounts[0]));
        setTokenContract(tokenContract);

        const lotteryContract = new ethers.Contract(deployedLotteryNetwork.address, Lottery.abi, provider.getSigner(accounts[0]));
        setLotteryContract(lotteryContract);

        const balances: { [key: string]: string } = {};
        for (const account of accounts) {
          const balance = await tokenContract.balanceOf(account);
          balances[account] = ethers.utils.formatEther(balance);
        }
        setBalances(balances);
      } else {
        console.log('Smart contract not deployed to detected network.');
      }
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    }
  };

  const transferTokens = async (recipient: string, amount: string) => {
    if (tokenContract) {
      const tx = await tokenContract.transfer(recipient, ethers.utils.parseEther(amount));
      await tx.wait();
      const balance = await tokenContract.balanceOf(recipient);
      setBalances({ ...balances, [recipient]: ethers.utils.formatEther(balance) });
      const mainAccountBalance = await tokenContract.balanceOf(accounts[0]);
      setBalances((prevBalances) => ({
        ...prevBalances,
        [accounts[0]]: ethers.utils.formatEther(mainAccountBalance)
      }));
    }
  };

  const enterLottery = async () => {
    if (lotteryContract && tokenContract) {
      const tx = await tokenContract.approve(lotteryContract.address, ethers.utils.parseEther('100'));
      await tx.wait();
      const enterTx = await lotteryContract.enterLottery();
      await enterTx.wait();
      const balance = await tokenContract.balanceOf(accounts[0]);
      setBalances({ ...balances, [accounts[0]]: ethers.utils.formatEther(balance) });
    }
  };

  return (
    <div>
      <h1>MyToken Balance</h1>
      <p>Your account: {accounts[0]}</p>
      <p>Your balance: {balances[accounts[0]]} MTK</p>
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
      <h2>All Accounts</h2>
      <ul>
        {accounts.slice(1).map(account => (
          <li key={account}>
            {account}: {balances[account] || 'Loading...'} MTK
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
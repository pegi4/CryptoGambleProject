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
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [lotteryContract, setLotteryContract] = useState<ethers.Contract | null>(null);
  const [stake, setStake] = useState<string>('');
  const [lotteryAddress, setLotteryAddress] = useState<string>('');
  const [lotteryBalance, setLotteryBalance] = useState<string>('');
  const [participants, setParticipants] = useState<{ address: string; stake: string }[]>([]);
  const [winner, setWinner] = useState<{ address: string; amount: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  useEffect(() => {
    if (lotteryContract) {
      const winnerPickedListener = lotteryContract.on('WinnerPicked', (winnerAddress: string, winnerShare: ethers.BigNumber) => {
        setWinner({ address: winnerAddress, amount: ethers.utils.formatEther(winnerShare) });
        
        loadLotteryData();
      });
      return () => {
        lotteryContract.off('WinnerPicked', winnerPickedListener);
      };
    }
  }, [lotteryContract]);

  const loadBlockchainData = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      setProvider(provider);

      const accounts = await provider.listAccounts();
      setAccounts(accounts);
      setSelectedAccount(accounts[0]);

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
        setLotteryAddress(deployedLotteryNetwork.address);

        const balances: { [key: string]: string } = {};
        for (const account of accounts) {
          const balance = await tokenContract.balanceOf(account);
          balances[account] = ethers.utils.formatEther(balance);
        }
        setBalances(balances);

        loadLotteryData();
      } else {
        console.log('Smart contract not deployed to detected network.');
      }
    } catch (error) {
      console.error('Error loading blockchain data:', error);
    }
  };

  const loadLotteryData = async () => {
    if (tokenContract && lotteryContract) {
      const lotteryBalance = await tokenContract.balanceOf(lotteryContract.address);
      setLotteryBalance(ethers.utils.formatEther(lotteryBalance));

      const [participantsAddresses, participantsStakes] = await lotteryContract.getParticipants();
      const participantsData = participantsAddresses.map((address: string, index: number) => ({
        address,
        stake: ethers.utils.formatEther(participantsStakes[index]),
      }));
      setParticipants(participantsData);
    }
  };

  const transferTokens = async (recipient: string, amount: string) => {
    if (tokenContract) {
      if (parseFloat(amount) < 1) {
        setError('Transfer amount must be at least 1 MTK');
        return;
      }

      try {
        const tx = await tokenContract.connect(provider!.getSigner(selectedAccount)).transfer(recipient, ethers.utils.parseEther(amount));
        await tx.wait();

        const recipientBalance = await tokenContract.balanceOf(recipient);
        setBalances((prevBalances) => ({
          ...prevBalances,
          [recipient]: ethers.utils.formatEther(recipientBalance),
        }));

        const selectedAccountBalance = await tokenContract.balanceOf(selectedAccount);
        setBalances((prevBalances) => ({
          ...prevBalances,
          [selectedAccount]: ethers.utils.formatEther(selectedAccountBalance),
        }));

        setError(null);
      } catch (error) {
        setError('Transaction failed');
        console.error(error);
      }
    }
  };

  const enterLottery = async () => {
    if (lotteryContract && tokenContract) {
      if (parseFloat(stake) < 1) {
        setError('Stake amount must be at least 1 MTK');
        return;
      }

      try {
        const stakeAmount = ethers.utils.parseEther(stake);
        const tx = await tokenContract.connect(provider!.getSigner(selectedAccount)).approve(lotteryContract.address, stakeAmount);
        await tx.wait();
        const enterTx = await lotteryContract.connect(provider!.getSigner(selectedAccount)).enterLottery(stakeAmount);
        await enterTx.wait();
        const balance = await tokenContract.balanceOf(selectedAccount);
        setBalances((prevBalances) => ({
          ...prevBalances,
          [selectedAccount]: ethers.utils.formatEther(balance),
        }));

        loadLotteryData();
        setError(null);
      } catch (error) {
        setError('Transaction failed');
        console.error(error);
      }
    }
  };

  return (
    <div>
      <h1>MyToken Balance</h1>
      <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
        {accounts.map(account => (
          <option key={account} value={account}>{account}</option>
        ))}
      </select>
      <p>Your account: {selectedAccount}</p>
      <p>Your balance: {balances[selectedAccount]} MTK</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
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
      <div>
        <input
          type="number"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          placeholder="Stake amount"
          required
        />
        <button onClick={enterLottery}>Enter Lottery</button>
      </div>
      <h2>Lottery Contract Info</h2>
      <p>Lottery Address: {lotteryAddress}</p>
      <p>Lottery Balance: {lotteryBalance} MTK</p>
      <h3>Participants</h3>
      {winner && <h3>Winner: {winner.address} won {winner.amount} MTK</h3>} {/* Prikaz zmagovalca in njegove nagrade */}
      <ul>
        {participants.map(participant => (
          <li key={participant.address}>
            {participant.address}: {participant.stake} MTK
          </li>
        ))}
      </ul>
      <h2>All Accounts</h2>
      <ul>
        {accounts.map(account => (
          <li key={account}>
            {account}: {balances[account] || 'Loading...'} MTK
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;

const Token = artifacts.require("GambleToken");
const Lottery = artifacts.require("Lottery");

require('dotenv').config(); 

let chai;
(async () => {
  chai = await import('chai');
  const { expect } = chai;
  chai.use((await import('chai-as-promised')).default).should();
})();

contract("GambleToken", (accounts) => {
  const [deployer, user1, user2, user3, user4, user5] = accounts;
  const founder = process.env.FOUNDER_WALLET;
  let token;
  let lottery;

  before(async () => {
    token = await Token.deployed();
    lottery = await Lottery.deployed();
  });

  it("should assign initial supply to the deployer", async () => {
    const balance = await token.balanceOf(deployer);
    expect(balance.toString()).to.equal(web3.utils.toWei('1000000', 'ether'));
  });

  it("should transfer tokens correctly", async () => {
    await token.transfer(user1, web3.utils.toWei('200', 'ether'), { from: deployer });
    const balance1 = await token.balanceOf(user1);
    expect(balance1.toString()).to.equal(web3.utils.toWei('200', 'ether'));

    await token.transfer(user2, web3.utils.toWei('100', 'ether'), { from: user1 });
    const balance2 = await token.balanceOf(user2);
    expect(balance2.toString()).to.equal(web3.utils.toWei('100', 'ether'));

    await token.transfer(user3, web3.utils.toWei('100', 'ether'), { from: deployer });
    const balance3 = await token.balanceOf(user3);
    expect(balance3.toString()).to.equal(web3.utils.toWei('100', 'ether'));

    await token.transfer(user4, web3.utils.toWei('100', 'ether'), { from: deployer });
    const balance4 = await token.balanceOf(user4);
    expect(balance4.toString()).to.equal(web3.utils.toWei('100', 'ether'));

    await token.transfer(user5, web3.utils.toWei('100', 'ether'), { from: deployer });
    const balance5 = await token.balanceOf(user5);
    expect(balance5.toString()).to.equal(web3.utils.toWei('100', 'ether'));
  });

  it("should allow entry into lottery", async () => {
    await token.approve(lottery.address, web3.utils.toWei('100', 'ether'), { from: user1 });
    await lottery.enterLottery(web3.utils.toWei('100', 'ether'), { from: user1 });
    const balance1 = await token.balanceOf(user1);
    expect(balance1.toString()).to.equal(web3.utils.toWei('0', 'ether'));

    await token.approve(lottery.address, web3.utils.toWei('100', 'ether'), { from: user2 });
    await lottery.enterLottery(web3.utils.toWei('100', 'ether'), { from: user2 });
    const balance2 = await token.balanceOf(user2);
    expect(balance2.toString()).to.equal(web3.utils.toWei('0', 'ether'));

    await token.approve(lottery.address, web3.utils.toWei('100', 'ether'), { from: user3 });
    await lottery.enterLottery(web3.utils.toWei('100', 'ether'), { from: user3 });
    const balance3 = await token.balanceOf(user3);
    expect(balance3.toString()).to.equal(web3.utils.toWei('0', 'ether'));

    await token.approve(lottery.address, web3.utils.toWei('100', 'ether'), { from: user4 });
    await lottery.enterLottery(web3.utils.toWei('100', 'ether'), { from: user4 });
    const balance4 = await token.balanceOf(user4);
    expect(balance4.toString()).to.equal(web3.utils.toWei('0', 'ether'));

    await token.approve(lottery.address, web3.utils.toWei('100', 'ether'), { from: user5 });
    await lottery.enterLottery(web3.utils.toWei('100', 'ether'), { from: user5 });
    const balance5 = await token.balanceOf(user5);
    expect(balance5.toString()).to.equal(web3.utils.toWei('0', 'ether'));
  });

  it("should pick a winner correctly when five players are entered", async () => {
    const initialBalances = await Promise.all(accounts.slice(1, 6).map(async (account) => {
      return {
        account,
        balance: await token.balanceOf(account).then(balance => balance.toString())
      };
    }));

    const initialFounderBalance = await token.balanceOf(founder).then(balance => balance.toString());

    console.log("Initial Founder balance: ", initialFounderBalance);

    // Call pickWinner
    await lottery.pickWinner({ from: deployer });

    const finalBalances = await Promise.all(accounts.slice(1, 6).map(async (account) => {
      return {
        account,
        balance: await token.balanceOf(account).then(balance => balance.toString())
      };
    }));

    const finalFounderBalance = await token.balanceOf(founder).then(balance => balance.toString());

    const winner = finalBalances.find((final, index) => final.balance !== initialBalances[index].balance);
    const totalPrize = web3.utils.toWei('500', 'ether');
    const winnerStake = web3.utils.toWei('100', 'ether');
    const founderShare =  (totalPrize - winnerStake) / 10;
    console.log("Founder share: ", founderShare);
    console.log("Founder balance: ", finalFounderBalance);
    const winnerShare = totalPrize - founderShare;
    console.log("Winner share: ", winnerShare);
    console.log("Winner share: ", winner.balance);

    expect(winner).to.exist;
    expect(winner.balance).to.equal(winnerShare.toString());
    expect(finalFounderBalance).to.equal((BigInt(initialFounderBalance) + BigInt(founderShare)).toString());
  });
});

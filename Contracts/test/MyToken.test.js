const Token = artifacts.require("GambleToken");
const Lottery = artifacts.require("Lottery");

let chai;
(async () => {
  chai = await import('chai');
  const { expect } = chai;
  chai.use((await import('chai-as-promised')).default).should();
})();

contract("GambleToken", (accounts) => {
  const [deployer, user1, user2] = accounts;
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
    await token.transfer(user1, web3.utils.toWei('150', 'ether'), { from: deployer });
    const balance1 = await token.balanceOf(user1);
    expect(balance1.toString()).to.equal(web3.utils.toWei('150', 'ether'));

    await token.transfer(user2, web3.utils.toWei('50', 'ether'), { from: user1 });
    const balance2 = await token.balanceOf(user2);
    expect(balance2.toString()).to.equal(web3.utils.toWei('50', 'ether'));
  });

  it("should allow entry into lottery", async () => {
    await token.approve(lottery.address, web3.utils.toWei('100', 'ether'), { from: user1 });
    await lottery.enterLottery({ from: user1 });
    const balance1 = await token.balanceOf(user1);
    expect(balance1.toString()).to.equal(web3.utils.toWei('0', 'ether'));
  });
});
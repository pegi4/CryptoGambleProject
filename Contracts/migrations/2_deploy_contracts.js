const GambleToken = artifacts.require("GambleToken");
const Lottery = artifacts.require("Lottery");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(GambleToken, web3.utils.toWei('1000000', 'ether')); // 1,000,000
  const token = await GambleToken.deployed();
  await deployer.deploy(Lottery, token.address);
};
const GambleToken = artifacts.require("GambleToken");
const Lottery = artifacts.require("Lottery");

require('dotenv').config(); 

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(GambleToken, web3.utils.toWei('1000000', 'ether'));
  const token = await GambleToken.deployed();
  const founderWallet = process.env.FOUNDER_WALLET;

  if (!founderWallet) {
    throw new Error("FOUNDER_WALLET environment variable is not set");
  }

  await deployer.deploy(Lottery, token.address, founderWallet);
};
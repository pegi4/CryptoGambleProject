// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GambleToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("GambleToken", "GMT") {
        _mint(msg.sender, initialSupply);
    }
}
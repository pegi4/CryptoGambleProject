// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Lottery {
    IERC20 public token;
    address[] public players;
    uint256 public constant MINIMUM_ENTRY_AMOUNT = 100 * 10 ** 18; // Adjust as needed

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function enterLottery() public {
        require(token.balanceOf(msg.sender) >= MINIMUM_ENTRY_AMOUNT, "Insufficient token balance");
        require(token.transferFrom(msg.sender, address(this), MINIMUM_ENTRY_AMOUNT), "Transfer failed");
        players.push(msg.sender);

        if (players.length == 5) {
            pickWinner();
        }
    }

    function pickWinner() internal {
        require(players.length == 5, "Not enough players");

        uint256 winnerIndex = block.timestamp % players.length;
        address winner = players[winnerIndex];

        uint256 prize = token.balanceOf(address(this));
        token.transfer(winner, prize);

        delete players;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is Ownable {
    IERC20 public token;
    address[] public players;
    mapping(address => uint256) public playerStakes;
    uint256 public constant MINIMUM_BALANCE = 100 * 10 ** 18;

    event PlayerEntered(address indexed player, uint256 stake);
    event WinnerPicked(address indexed winner, uint256 prize);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }

    function enterLottery(uint256 stake) public {
        require(token.balanceOf(msg.sender) >= MINIMUM_BALANCE, "You must own at least 100 tokens to enter the lottery");
        require(stake > 0, "Stake must be greater than zero");
        require(token.transferFrom(msg.sender, address(this), stake), "Transfer failed");
        if (playerStakes[msg.sender] == 0) {
            players.push(msg.sender);
        }
        playerStakes[msg.sender] += stake;

        emit PlayerEntered(msg.sender, stake);
    }

    function pickWinner() public onlyOwner {
        require(players.length == 5, "Not enough players");

        uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
        uint256 winnerIndex = random % players.length;
        address winner = players[winnerIndex];

        uint256 prize = token.balanceOf(address(this));
        token.transfer(winner, prize);

        for (uint256 i = 0; i < players.length; i++) {
            playerStakes[players[i]] = 0;
        }

        delete players;

        emit WinnerPicked(winner, prize);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is Ownable {
    IERC20 public token;
    address[] public players;
    mapping(address => uint256) public playerStakes;
    uint256 public constant MINIMUM_BALANCE = 100 * 10 ** 18;
    address public founderWallet;

    event PlayerEntered(address indexed player, uint256 stake);
    event WinnerPicked(address indexed winner, uint256 prize, uint256 founderShare, address founderWallet);

    constructor(address _tokenAddress, address _founderWallet) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
        founderWallet = _founderWallet;
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

        if (players.length == 5) {
            pickWinner();
        }
    }

    function pickWinner() private {
        require(players.length == 5, "Not enough players");

        uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
        uint256 winnerIndex = random % players.length;
        address winner = players[winnerIndex];

        uint256 totalPrize = token.balanceOf(address(this));
        uint256 winnerStake = playerStakes[winner];
        uint256 profit = totalPrize - winnerStake;
        uint256 founderShare = profit / 10;
        uint256 winnerShare = totalPrize - founderShare;

        // Transfer shares
        token.transfer(founderWallet, founderShare);
        token.transfer(winner, winnerShare);

        // Reset players and stakes
        for (uint8 i = 0; i < players.length; i++) {
            playerStakes[players[i]] = 0;
        }
        delete players;

        emit WinnerPicked(winner, winnerShare, founderShare, founderWallet);
    }

    // Optional: Function to update the founder wallet address
    function updateFounderWallet(address _newFounderWallet) public onlyOwner {
        founderWallet = _newFounderWallet;
    }

    function getParticipants() public view returns (address[] memory, uint256[] memory) {
        uint256[] memory stakes = new uint256[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            stakes[i] = playerStakes[players[i]];
        }
        return (players, stakes);
    }
}

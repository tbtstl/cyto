// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/Cyto.sol";

contract CytoTest is Test {
    address immutable owner = makeAddr("owner");
    address immutable player1 = vm.addr(0x2);
    address immutable player2 = vm.addr(0x3);
    address immutable player3 = vm.addr(0x4);
    address immutable verifierEOA = vm.addr(0x5);
    Cyto game;
    Groth16Verifier verifier;

    function setUp() public {
        verifier = new Groth16Verifier();
        game = new Cyto(owner, address(verifier));
        vm.deal(player1, 1 ether);
        vm.deal(player2, 1 ether);
        vm.deal(player3, 1 ether);
    }

    function mockCurrentBoard() internal pure returns (bytes16[64] memory board) {
        board[0] = bytes16(uint128(132922799578491587290380706028034457600));
    }

    function mockNextBoard() internal pure returns (bytes16[64] memory board) {
        board[0] = bytes16(uint128(42535295865117307932921825928971026432));
        board[1] = bytes16(uint128(21267647932558653966460912964485513216));
    }

    function setFirstRound() internal {
        vm.prank(player1);
        game.joinTeam(1);
        vm.prank(player2);
        game.joinTeam(2);

        vm.prank(player1);
        game.injectCell{value: 1000000000000000}(0, 0);
        vm.prank(player1);
        game.injectCell{value: 1000000000000000}(0, 2);

        vm.prank(player2);
        game.injectCell{value: 1000000000000000}(0, 1);
    }

    function test_constructor() external {
        assertEq(game.owner(), owner);
        assertEq(address(game.verifier()), address(verifier));
        assertEq(game.ROUND_LENGTH(), 15 minutes);
        assertEq(game.GAME_LENGTH(), 1 days);
        assertEq(game.MAX_ROUNDS_PER_GAME(), 96);
        assertEq(game.BASE_CELL_INJECTION_PRICE(), 1000000000000000);
        assertEq(game.MAINTENANCE_FEE_PERCENT(), 5);
        assertEq(game.TEAM_1(), 1);
        assertEq(game.TEAM_2(), 2);
        assertEq(game.currentRound(), 1);
        assertEq(game.currentGame(), 1);
        assertEq(game.roundEnd(), block.timestamp + 15 minutes);
    }

    function testJoinTeam() external {
        vm.startPrank(player1);
        game.joinTeam(game.TEAM_1());

        assertEq(game.playerTeam(player1), game.TEAM_1());
        vm.stopPrank();
    }

    function testJoinTeam_alreadyJoined() public {
        vm.prank(player1);
        game.joinTeam(1);
        assertEq(game.playerTeam(player1), 1);

        vm.prank(player1);
        vm.expectRevert(Cyto.AlreadyJoinedTeam.selector);
        game.joinTeam(2);
    }

    function testJoinTeam_InvalidTeam() public {
        vm.prank(player1);
        vm.expectRevert(Cyto.InvalidTeam.selector);
        game.joinTeam(3);
    }

    function testInjectCell(uint8 team, uint8 x, uint8 y) public {
        vm.assume(team == game.TEAM_1() || team == game.TEAM_2());
        vm.assume(x < game.GRID_SIZE() && y < game.GRID_SIZE());
        uint256 price = 1000000000000000;
        uint256 maintenanceFee = (price * game.MAINTENANCE_FEE_PERCENT()) / 100;
        vm.prank(player1);
        game.joinTeam(team);
        vm.prank(player1);
        game.injectCell{value: 1000000000000000}(x, y);

        assertEq(team, game.getValueAtPosition(x, y));
        assertEq(game.playerContributions(player1, game.currentGame()), price - maintenanceFee);
        assertEq(game.teamContributions(team, game.currentGame()), price - maintenanceFee);
        assertEq(owner.balance, maintenanceFee);
    }

    function testInjectCell_OnlyPlayer() public {
        vm.prank(player1);
        vm.expectRevert(Cyto.UnregisteredPlayer.selector);
        game.injectCell{value: 1000000000000000}(0, 0);
    }

    function testInjectCell_OnlyDuringLiveGame() public {
        vm.prank(player1);
        game.joinTeam(1);

        vm.warp(game.roundEnd());

        vm.prank(player1);
        vm.expectRevert(Cyto.GameNotLive.selector);
        game.injectCell{value: 1000000000000000}(0, 0);
    }

    function testInjectCell_PositionOutOfRange() public {
        vm.prank(player1);

        game.joinTeam(1);
        vm.expectRevert(GameBoard.PositionOutOfRange.selector);
        vm.prank(player1);
        game.injectCell{value: 1000000000000000}(64, 64);
    }

    function testInjectCell_PositionOccupied() public {
        vm.prank(player1);
        game.joinTeam(1);
        vm.prank(player1);
        game.injectCell{value: 1000000000000000}(0, 0);
        vm.prank(player1);
        vm.expectRevert(GameBoard.PositionOccupied.selector);
        game.injectCell{value: 1000000000000000}(0, 0);
    }

    function testInjectCell_InsufficientFunds() public {
        vm.prank(player1);
        game.joinTeam(1);
        vm.prank(player1);
        vm.expectRevert(Cyto.InsufficientFunds.selector);
        game.injectCell{value: 999999999999999}(0, 0);
    }
}

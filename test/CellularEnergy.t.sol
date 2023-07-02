// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/CellularEnergy.sol";

contract CellularEnergyTest is Test {
    address immutable owner = makeAddr("owner");
    address immutable player1 = vm.addr(0x2);
    address immutable player2 = vm.addr(0x3);
    address immutable player3 = vm.addr(0x4);
    address immutable verifierEOA = vm.addr(0x5);
    CellularEnergy game;
    Groth16Verifier verifier;

    function setUp() public {
        verifier = new Groth16Verifier();
        game = new CellularEnergy(owner, address(verifier));
        vm.deal(player1, 1 ether);
        vm.deal(player2, 1 ether);
        vm.deal(player3, 1 ether);
    }

    function test_constructor() external {
        assertEq(game.owner(), owner);
        assertEq(address(game.verifier()), address(verifier));
        assertEq(game.ROUND_LENGTH(), 15 minutes);
        assertEq(game.EPOCH_LENGTH(), 1 days);
        assertEq(game.SEASON_LENGTH(), 7 days);
        assertEq(game.MAX_EPOCHS_PER_SEASON(), 7);
        assertEq(game.MAX_ROUNDS_PER_EPOCH(), 720);
        assertEq(game.BASE_CELL_INJECTION_PRICE(), 1000000000000000);
        assertEq(game.MAINTENANCE_FEE_PERCENT(), 51);
        assertEq(game.TEAM_1(), 1);
        assertEq(game.TEAM_2(), 2);
        assertEq(game.round(), 1);
        assertEq(game.epoch(), 1);
        assertEq(game.season(), 1);
        assertEq(game.roundEnd(), block.timestamp + 15 minutes);
    }

    function testJoinTeam() external {
        vm.startPrank(player1);
        game.joinTeam(game.TEAM_1());

        assertEq(game.playerTeam(player1, game.season()), game.TEAM_1());
        vm.stopPrank();
    }

    function testJoinTeam_alreadyJoined() public {
        vm.prank(player1);
        game.joinTeam(1);
        assertEq(game.playerTeam(player1, 1), 1);

        vm.prank(player1);
        vm.expectRevert(CellularEnergy.AlreadyJoinedTeamForSeason.selector);
        game.joinTeam(2);
    }

    function testJoinTeam_InvalidTeam() public {
        vm.prank(player1);
        vm.expectRevert(CellularEnergy.InvalidTeam.selector);
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

        console.log(team, game.getValueAtPosition(x, y));

        assertEq(team, game.getValueAtPosition(x, y));
        assertEq(game.playerContributions(player1, game.season()), price - maintenanceFee);
        assertEq(game.teamContributions(team, game.season()), price - maintenanceFee);
        assertEq(owner.balance, maintenanceFee);
    }

    function testInjectCell_OnlyPlayer() public {
        vm.prank(player1);
        vm.expectRevert(CellularEnergy.UnregisteredPlayer.selector);
        game.injectCell{value: 1000000000000000}(0, 0);
    }

    function testInjectCell_OnlyDuringLiveGame() public {
        vm.prank(player1);
        game.joinTeam(1);

        vm.warp(game.roundEnd());

        vm.prank(player1);
        vm.expectRevert(CellularEnergy.GameNotLive.selector);
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
        vm.expectRevert(CellularEnergy.InsufficientFunds.selector);
        game.injectCell{value: 999999999999999}(0, 0);
    }
}

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
    }

    function test_constructor() external {
        assertEq(game.owner(), owner);
        assertEq(address(game.verifier()), address(verifier));
        assertEq(game.ROUND_LENGTH(), 2 minutes);
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
        assertEq(game.roundEnd(), block.timestamp + 2 minutes);
    }

    function testJoinTeam() external {
        vm.startPrank(player1);
        game.joinTeam(game.TEAM_1());

        assertEq(game.playerTeam(player1, game.season()), game.TEAM_1());
        vm.stopPrank();
    }

    function testJoinTeam_alreadyJoined() public {
        console.log(player1, address(this));
        vm.prank(player1);
        game.joinTeam(game.TEAM_1());
        assertEq(game.playerTeam(player1, game.season()), game.TEAM_1());

        vm.expectRevert(CellularEnergy.AlreadyJoinedTeamForSeason.selector);
        game.joinTeam(game.TEAM_2());
        // vm.stopPrank();
    }
}

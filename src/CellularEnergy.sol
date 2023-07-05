// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {SafeOwnable} from "./SafeOwnable.sol";
import {GameBoard} from "./GameBoard.sol";
import {Groth16Verifier} from "./BoardVerifier.sol";
import "forge-std/console2.sol";

contract CellularEnergy is SafeOwnable, GameBoard {
    uint256 public immutable ROUND_LENGTH = 15 minutes;
    uint256 public immutable EPOCH_LENGTH = 1 days;
    uint256 public immutable SEASON_LENGTH = 7 days;
    uint256 public immutable MAX_EPOCHS_PER_SEASON = 7; // 7 days
    uint256 public immutable MAX_ROUNDS_PER_EPOCH = 96; // 1 day / 15 minutes
    uint256 public immutable BASE_CELL_INJECTION_PRICE = 1000000000000000; // 0.001 ETH
    uint256 public immutable MAINTENANCE_FEE_PERCENT = 5; // 5%, used to refill the prover that evolves the board each round
    uint8 public immutable TEAM_1 = 1;
    uint8 public immutable TEAM_2 = 2;
    uint256 public round;
    uint256 public epoch;
    uint256 public season;
    uint256 public roundEnd;
    Groth16Verifier public verifier;
    // player => season => team
    mapping(address => mapping(uint256 => uint8)) public playerTeam;
    // team => season => score
    mapping(uint8 => mapping(uint256 => uint256)) public teamScore;
    // team => season => contributions
    mapping(uint8 => mapping(uint256 => uint256)) public teamContributions;
    // player => season => contributions
    mapping(address => mapping(uint256 => uint256)) public playerContributions;

    error GameNotFinished();
    error SeasonNotFinished();
    error AlreadyJoinedTeamForSeason();
    error InvalidTeam();
    error UnregisteredPlayer();
    error GameNotLive();
    error InvalidProof();
    error GameIsLive();
    error InsufficientFunds();
    error TransferFailed();

    event GameReset(uint256 round, uint256 epoch, uint256 season);
    event NewTeamJoined(address indexed player, uint256 indexed team, uint256 indexed season);
    event NewCell(uint8 indexed x, uint8 indexed y, uint256 indexed team, address player);

    modifier onlyPlayer() {
        if (playerTeam[msg.sender][season] == 0) revert UnregisteredPlayer();
        _;
    }

    modifier onlyDuringLiveGame() {
        if (block.timestamp >= roundEnd) revert GameNotLive();
        _;
    }

    modifier withValidProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[128] calldata _pubSignals
    ) {
        if (verifier.verifyProof(_pA, _pB, _pC, _pubSignals)) {
            _;
        } else {
            revert InvalidProof();
        }
    }

    constructor(address _owner, address _verifier) SafeOwnable(_owner) {
        verifier = Groth16Verifier(_verifier);
        _resetGame();
    }

    function joinTeam(uint8 team) public {
        if (playerTeam[msg.sender][season] != 0) {
            // Ensure a user can't change teams mid season
            revert AlreadyJoinedTeamForSeason();
        }
        if (team != TEAM_1 && team != TEAM_2) {
            revert InvalidTeam();
        }

        playerTeam[msg.sender][season] = team;
        emit NewTeamJoined(msg.sender, team, season);
    }

    function injectCell(uint8 _x, uint8 _y) public payable onlyPlayer onlyDuringLiveGame {
        if (msg.value != BASE_CELL_INJECTION_PRICE * epoch) {
            revert InsufficientFunds();
        }
        uint256 maintenanceFee = (BASE_CELL_INJECTION_PRICE * epoch * MAINTENANCE_FEE_PERCENT) / 100;
        uint256 remainder = msg.value - maintenanceFee;
        uint8 team = playerTeam[msg.sender][season];
        teamContributions[team][season] += remainder;
        playerContributions[msg.sender][season] += remainder;
        _injectCell(_x, _y, team);
        _transferFunds(owner, maintenanceFee);

        emit NewCell(_x, _y, team, msg.sender);
    }

    function claimSeasonRewards(uint256 _season, address recipient) public {
        // Check that the season is over
        if (_season >= season) {
            revert SeasonNotFinished();
        }
        uint8 team = playerTeam[msg.sender][season];
        uint256 team1Score = teamScore[TEAM_1][season];
        uint256 team2Score = teamScore[TEAM_2][season];
        bool seasonWasTied = team1Score == team2Score;
        uint8 winningTeam = team1Score > team2Score ? TEAM_1 : TEAM_2;

        if (seasonWasTied) {
            // If they tied for the season, they get their contributions back
            uint256 contribution = playerContributions[msg.sender][season];
            _transferFunds(recipient, contribution);
        } else if (team == winningTeam) {
            // If they won the season, they get their contributions back plus a percentage of the losing teams contributions
            uint256 contribution = playerContributions[msg.sender][season];
            uint256 winningTeamContributions = teamContributions[winningTeam][season];
            uint256 losingTeamContributions = teamContributions[winningTeam == TEAM_1 ? TEAM_2 : TEAM_1][season];
            uint256 winnings = contribution + ((contribution / winningTeamContributions) * losingTeamContributions);
            _transferFunds(recipient, winnings);
        } else {
            // Otherwise, they lost and get nothing.
            // no-op
        }
    }

    function evolveBoardState(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[128] calldata _pubSignals
    ) public withValidProof(_pA, _pB, _pC, _pubSignals) {
        if (roundEnd > block.timestamp) {
            revert GameIsLive();
        }
        // Split the signals into their input and output components
        bytes16[64] memory inputSignals;
        bytes16[64] memory outputSignals;
        uint byteShift = 16 * 8; // number of bytes to shift the pub signals to the left
        for (uint256 i = 0; i < 64; i++) {
            inputSignals[i] = bytes16(bytes32(_pubSignals[i] << byteShift));
            outputSignals[i] = bytes16(bytes32(_pubSignals[i + 64] << byteShift));
        }
        // Verify the input signals represent the current board state
        if (keccak256(abi.encodePacked(inputSignals)) != keccak256(abi.encodePacked(board))) {
            revert InvalidProof();
        }
        // Update the board state with the output signals
        _evolveBoardState(outputSignals);

        // Update the team scores
        (, uint256 team1Cells, uint256 team2Cells) = countCellValues();
        teamScore[TEAM_1][season] += team1Cells;
        teamScore[TEAM_2][season] += team2Cells;

        if (round == MAX_ROUNDS_PER_EPOCH) {
            _resetGame();
        } else {
            _startNewRound();
        }
    }

    function _transferFunds(address recipient, uint256 amount) internal {
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    function _resetGame() internal {
        bytes16[GRID_SIZE] memory emptyBoard;
        _evolveBoardState(emptyBoard);

        if (epoch % MAX_EPOCHS_PER_SEASON == 0) {
            _startNewSeason();
        }
        _startNewEpoch();
        _startNewRound();
        emit GameReset(round, epoch, season);
    }

    function _startNewSeason() private {
        season++;
        epoch = 0;
    }

    function _startNewEpoch() private {
        epoch++;
        round = 0;
    }

    function _startNewRound() private {
        round++;
        roundEnd = block.timestamp + ROUND_LENGTH;
    }
}

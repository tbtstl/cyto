// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import {console} from "forge-std/console.sol";

contract GameBoard {
    uint8 public constant GRID_SIZE = 64;
    uint16 constant FLATTENED_GRID_SIZE = 1024;
    uint8 constant CELL_SIZE_BITS = 2;
    uint8 constant MAX_CELL_VALUE = 3; // Since each cell is 2 bits, the max value is 2^2 - 1 = 3
    bytes16[GRID_SIZE] public board;

    error InvalidBoardLength();
    error PositionOutOfRange();
    error PositionOccupied();

    event BoardEvolved(bytes16[GRID_SIZE] board);

    function _injectCell(uint8 _x, uint8 _y, uint8 _team) internal {
        if (_x > (GRID_SIZE - 1) || _y > (GRID_SIZE - 1)) {
            revert PositionOutOfRange();
        }

        // Calculate the index into the bytes16 array and the position within the 16-byte value.
        uint index = _x;
        uint128 bitPosition = uint128((GRID_SIZE - 1 - _y) * CELL_SIZE_BITS);

        // Get the current value at the specified grid square
        uint currentValue = getValueAtPosition(_x, _y);

        // Only set the new value if the current value is 0
        if (currentValue == 0) {
            // Clear the current value at the grid square and set the new value.
            // Use bitwise operations to manipulate the individual bits.
            uint128 clearMask = ~(uint128(MAX_CELL_VALUE) << bitPosition);
            uint128 setMask = uint128(_team) << bitPosition;
            uint128 clearedGrid = uint128(board[index]) & clearMask;
            uint128 updatedValue = clearedGrid | setMask;

            board[index] = bytes16(updatedValue);
        } else {
            revert PositionOccupied();
        }
    }

    // TODO: Update this function to take a bytes32[GRID_SIZE] and just force update everything.
    function _evolveBoardState(bytes memory _rawBoard) internal {
        if (_rawBoard.length != FLATTENED_GRID_SIZE) {
            revert InvalidBoardLength();
        }
        bytes16[GRID_SIZE] memory _board;
        assembly {
            let inputPtr := add(_rawBoard, 0x20) // skip length in dynamic array

            for {
                let i := 0
            } lt(i, GRID_SIZE) {
                i := add(i, 1)
            } {
                // Each row takes 16 bytes, so we can load it at once
                let row := mload(inputPtr)

                inputPtr := add(inputPtr, 0x10) // move to the next 16 bytes in the input

                sstore(add(board.slot, mul(i, 0x10)), row)
            }
        }

        board = _board;

        emit BoardEvolved(_board);
    }

    function getValueAtPosition(uint8 _x, uint8 _y) public view returns (uint) {
        uint index = _x;
        uint128 bitPosition = (GRID_SIZE - 1 - _y) * CELL_SIZE_BITS;

        // We just need a bitmask  to get the right number
        uint128 bitMask = uint128(MAX_CELL_VALUE) << bitPosition;

        return (uint128(board[index]) & bitMask) >> bitPosition;
    }

    function countCellValues() public view returns (uint count0, uint count1, uint count2) {
        for (uint i = 0; i < GRID_SIZE; i++) {
            for (uint j = 0; j < GRID_SIZE * CELL_SIZE_BITS; j += CELL_SIZE_BITS) {
                uint value = (uint(bytes32(board[i])) >> j) & MAX_CELL_VALUE;
                if (value == 0) count0++;
                else if (value == 1) count1++;
                else if (value == 2) count2++;
            }
        }
    }
}

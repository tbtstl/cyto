// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract GameBoard {
    uint8 constant GRID_SIZE = 64;
    uint16 constant FLATTENED_GRID_SIZE = 1024;
    uint8 constant CELL_SIZE_BITS = 2;
    uint8 constant MAX_CELL_VALUE = 3; // Since each cell is 2 bits, the max value is 2^2 - 1 = 3. In practice, it should never be more than 2. This just covers the max bit space.
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
        uint8 index = _x;
        uint8 bitPosition = _y * CELL_SIZE_BITS; // Each grid square is 2 bits

        // Get the current value at the specified grid square
        uint currentValue = (uint(bytes32(board[index])) >> bitPosition) & MAX_CELL_VALUE; // Each grid square is 2 bits

        // Only set the new value if the current value is 0
        if (currentValue == 0) {
            // Clear the current value at the grid square and set the new value.
            // Use bitwise operations to manipulate the individual bits.
            bytes32 updatedValue = bytes32((uint(bytes32(board[index])) & ~(MAX_CELL_VALUE << bitPosition)) | (_team << bitPosition));
            board[index] = bytes16(updatedValue);
        } else {
            revert PositionOccupied();
        }
    }

    function _evolveBoardState(bytes memory _rawBoard) internal {
        if (_rawBoard.length != FLATTENED_GRID_SIZE) {
            revert InvalidBoardLength();
        }
        bytes16[GRID_SIZE] memory _board;
        assembly {
            // Create a pointer to our output data. The reason we add 0x20 is because the first 16 bytes
            // in the outputData variable is the length of the array, and the actual data starts after that.
            let outputPtr := add(_board, 0x20)

            // Create a pointer to our input data. Similar to outputData, the first 16 bytes in the inputData
            // variable is the length of the array, and the actual data starts after that.
            let inputPtr := add(_rawBoard, 0x20)

            // Start a for loop that will run as long as the inputPtr is less than the endPtr.
            // The endPtr is calculated by adding 1024 (the length of the inputData in bytes) to the inputPtr.
            for {
                let endPtr := add(inputPtr, FLATTENED_GRID_SIZE)
            } lt(inputPtr, endPtr) {
                // With each loop iteration, we move the inputPtr 16 bytes forward. This is because we're
                // processing 16 bytes (one bytes16 element) at a time.
                inputPtr := add(inputPtr, 0x10)
            } {
                // With mload, we load 16 bytes from memory starting from the location inputPtr points to.
                // With mstore, we then store this 16 bytes of data at the location outputPtr points to.
                // This effectively copies a chunk of 16 bytes from the input data to the output data.
                mstore(outputPtr, mload(inputPtr))

                // Move the outputPtr 16 bytes forward to prepare it for the next loop iteration.
                // This ensures that the next chunk of input data will be written to the correct location
                // in the output data.
                outputPtr := add(outputPtr, 0x10)
            }
        }

        board = _board;

        emit BoardEvolved(_board);
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

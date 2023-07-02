pragma circom  2.1.6;

include "./gameOfLife.circom";
include "./bytesToBoard.circom";


template Main(Width, Height) {
    signal input current[Width]; // The current state of the board, in rows of 16bytes
    signal input next[Width]; // The next state of the board, in rows of 16bytes

    // convert input data to 2d board
    component inputBoard = BytesToBoard(Width, Height);
    component outputBoard = BytesToBoard(Width, Height);
    inputBoard.in <== current;
    outputBoard.in <== next;


    // Instantiate Game of Life Circuit with converted input data
    component gameOfLife = GameOfLife(Width, Height);
    gameOfLife.in <== inputBoard.out;

    // Verify converted output data matches game of life circuit output
    outputBoard.out === gameOfLife.out;
}



component main {public [current, next]} = Main(64, 64);

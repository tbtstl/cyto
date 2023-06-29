pragma circom  2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

include "./gameOfLife.circom";


template Main(Width, Height) {
    signal input current[Width][Height]; // The current state of the board
    signal input next[Width][Height]; // The next state of the board
    signal output out;

    // // convert input data to bit matrix
	// component inputMatrix = CreateBitMatrix(Width, Height);
	// for (var i = 0; i < k; i++) {
	// 	dataMatrix.in[i] <== current[i];
	// }

    // Instantiate Game of Life Circuit with input data
    component gameOfLife = GameOfLife(Width, Height);
    gameOfLife.in <== current;

    next === gameOfLife.out;
    out <== 1;
}



component main {public [current, next]} = Main(64, 64);

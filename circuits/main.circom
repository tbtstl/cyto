pragma circom  2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

include "./GameOfLife.circom";


template Main() {
    var Width = 10;
    var Height = 10;
    signal input in[Width][Height]; // The current state of the board
    signal output out[Width][Height]; // The computed state of the board after one step

    // // convert input data to bit matrix
	// component inputMatrix = CreateBitMatrix(Width, Height);
	// for (var i = 0; i < k; i++) {
	// 	dataMatrix.in[i] <== current[i];
	// }

    // Instantiate Game of Life Circuit with input data
    component gameOfLife = GameOfLife(Width, Height);
    gameOfLife.in <== in;

    out <== gameOfLife.out;
}


component main { public [in]} = Main();

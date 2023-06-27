
pragma circom 2.0.8;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/gates.circom";

template IsCellValueAlive() {
    signal input in;
    signal output out;
    component notDead = NOT();
    component isZero = IsZero();
    isZero.in <== in;
    notDead.in <== isZero.out;

    out <== notDead.out;
}

template LiveNeighborCount() {
    signal input in[8];
    signal output out;

    signal sums[8];
    sums[0] <== in[0];

    for (var i=1; i < 8; i++) {
        sums[i] <== sums[i - 1] + in[i];
    }

    out <== sums[7];
}

template IsStablePopulation() {
    signal input in;
    signal output out;

    component eq = IsEqual();
    eq.in[0] <== in;
    eq.in[1] <== 2;

    out <== eq.out;
}

template isGrowingPopulation() {
    signal input in;
    signal output out;

    component eq = IsEqual();
    eq.in[0] <== in;
    eq.in[1] <== 3;

    out <== eq.out;
}



template GetCellValue(Width, Height, x, y) {
    signal input in[Width][Height];
    signal output out;
    // Get values around the cell
    var left = x == 0 ? 0 : in[x - 1][y];
    var topLeft = x == 0 || y == 0 ? 0 : in[x - 1][y - 1];
    var top = y == 0 ? 0 : in[x][y - 1];
    var topRight = x == Width - 1 || y == 0 ? 0 : in[x + 1][y - 1];
    var right = x == Width - 1 ? 0 : in[x + 1][y];
    var bottomRight = x == Width - 1 || y == Height - 1 ? 0 : in[x + 1][y + 1];
    var bottom = y == Height - 1 ? 0 : in[x][y + 1];
    var bottomLeft = x == 0 || y == Height - 1 ? 0 : in[x - 1][y + 1];

    component leftAlive = IsCellValueAlive();
    leftAlive.in <== left;
    component topLeftAlive = IsCellValueAlive();
    topLeftAlive.in <== topLeft;
    component topAlive = IsCellValueAlive();
    topAlive.in <== top;
    component topRightAlive = IsCellValueAlive();
    topRightAlive.in <== topRight;
    component rightAlive = IsCellValueAlive();
    rightAlive.in <== right;
    component bottomRightAlive = IsCellValueAlive();
    bottomRightAlive.in <== bottomRight;
    component bottomAlive = IsCellValueAlive();
    bottomAlive.in <== bottom;
    component bottomLeftAlive = IsCellValueAlive();
    bottomLeftAlive.in <== bottomLeft;

    // Count the number of live cells
    component liveNeighborCount = LiveNeighborCount();
    liveNeighborCount.in[0] <== leftAlive.out;
    liveNeighborCount.in[1] <== topLeftAlive.out;
    liveNeighborCount.in[2] <== topAlive.out;
    liveNeighborCount.in[3] <== topRightAlive.out;
    liveNeighborCount.in[4] <== rightAlive.out;
    liveNeighborCount.in[5] <== bottomRightAlive.out;
    liveNeighborCount.in[6] <== bottomAlive.out;
    liveNeighborCount.in[7] <== bottomLeftAlive.out;

    component stablePopulation = IsStablePopulation();
    stablePopulation.in <== liveNeighborCount.out;

    component growingPopulation = isGrowingPopulation();
    growingPopulation.in <== liveNeighborCount.out;

    // return 0 if unstable population, or current cellvalue if stable/growing
    // TODO: right now this grows to current cellvalue, it should default to the most common neighbor if not alive
    out <== growingPopulation.out + stablePopulation.out * in[x][y];
}

template GameOfLife(Width, Height) {
	signal input in[Width][Height];
	signal output out[Width][Height];

    // For each cell on the board
    component cellValues[Width][Height];
	for (var x = 0; x < Width; x++) {
		for (var y = 0; y < Height; y++) {
            cellValues[x][y] = GetCellValue(Width, Height, x, y);
            cellValues[x][y].in <== in;
            out[x][y] <== cellValues[x][y].out;
		}
	}
}




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

template MostCommonNeighbor() {
    signal input neighbors[9];
    signal output out;
    var aCount = 0;
    var bCount = 0;
    var cCount = 0;
    var dCount = 0;

    for (var i = 0; i < 9; i++) {
        if (neighbors[i] == 0) {
            // do nothing
        } else if (neighbors[i] == 1) {
            aCount++;
        } else if (neighbors[i] == 2) {
            bCount++;
        } else if (neighbors[i] == 4) {
            cCount++;
        } else if (neighbors[i] == 8) {
            dCount++;
        }
    }

    // Check if at least two counts have a value of 1
    var oneCount = 0;
    if(aCount == 1) {
        oneCount++;
    } else if(bCount == 1) {
        oneCount++;
    } else if(cCount == 1) {
        oneCount++;
    } else if(dCount == 1) {
        oneCount++;
    }


    // There's probably a better way to find the max value, but this works for now
    // Note that in the event of a tie, we kill the cell.
    // We know there's a tie if multiple counts have a value of 1 (since this component is only verified at a total count of 3)
    if(oneCount > 1) {
        out <== 0;
    } else {
        if(aCount > bCount) {
            if(aCount > cCount) {
                if(aCount > dCount) {
                    out <== 1;
                } else {
                    out <== 8;
                }
            } else {
                if(cCount > dCount) {
                    out <== 4;
                } else {
                    out <== 8;
                }
            }
        } else {
            if(bCount > cCount) {
                if(bCount > dCount) {
                    out <== 2;
                } else {
                    out <== 8;
                }
            } else {
                if(cCount > dCount) {
                    out <== 4;
                } else {
                    out <== 8;
                }
            }
        }    
    }
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
    

    // // If the number of live cells is greater than 3 or less than 2, the cell dies (over/under population)
    // if(liveNeighborCount.out > 3 || liveNeighborCount.out < 2) {
    //     out <== 0;
    // } else if (liveNeighborCount.out == 2) {
    //     // If the number of live cells is 2, the cell stays the same
    //     out <== in[x][y];
    // } else {
    //     // If the number of live cells is 3, the cell is born or mutated to the most common neighbor type
    //     component mostCommonNeighbor = MostCommonNeighbor();
    //     mostCommonNeighbor.neighbors[0] <== left;
    //     mostCommonNeighbor.neighbors[1] <== topLeft;
    //     mostCommonNeighbor.neighbors[2] <== top;
    //     mostCommonNeighbor.neighbors[3] <== topRight;
    //     mostCommonNeighbor.neighbors[4] <== right;
    //     mostCommonNeighbor.neighbors[5] <== bottomRight;
    //     mostCommonNeighbor.neighbors[6] <== bottom;
    //     mostCommonNeighbor.neighbors[7] <== bottomLeft;
    //     mostCommonNeighbor.neighbors[8] <== in[x][y];
    //     out <== mostCommonNeighbor.out;
    // }

    out <== leftAlive.out;
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



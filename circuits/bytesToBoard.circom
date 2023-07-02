pragma circom  2.1.6;

// Take a bytestring and convert it to a board
template BytesToBoard(Width, Height) {
    signal input in[Height];
    signal output out[Width][Height];

    var numBitSize = 2; // Each number is 2 bits
    var numValues = Width * Height;
    var bitMaskValue = 3; // Max data size is 3 (binary: 11);

    for (var j = 0; j < Height; j++) {
        for(var i = 0; i < Width; i++) {
            var shift = ((Width-1) - i) * numBitSize;
            var bitMask = bitMaskValue << shift;
            var isolatedValue = (in[j] & bitMask)>>shift;
            out[i][j] <-- isolatedValue; 
        }
    }
}

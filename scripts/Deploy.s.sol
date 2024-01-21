// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "../src/Cyto.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("CELLULAR_ENERGY_VERIFIER_PK");
        address ownerAddress = vm.envAddress("CELLULAR_ENERGY_OWNER_ADDRESS");
        vm.startBroadcast(deployerPrivateKey);

        Groth16Verifier verifier = new Groth16Verifier();
        Cyto energy = new Cyto(ownerAddress, address(verifier));

        vm.stopBroadcast();
    }
}

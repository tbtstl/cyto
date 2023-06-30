// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract SafeOwnable {
    address public owner;
    address public pendingOwner;

    error OnlyOwner();
    error OnlyPendingOwner();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyPendingOwner() {
        if (msg.sender != pendingOwner) revert OnlyPendingOwner();
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    function safeTransferOwnership(address _newOwner) public onlyOwner {
        pendingOwner = _newOwner;
    }

    function acceptOwnershipTransfer() public onlyPendingOwner {
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}

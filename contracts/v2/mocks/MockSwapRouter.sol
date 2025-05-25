// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

contract MockSwapRouter {
    function WETH9() external pure returns (address) {
        return address(0x1234000000000000000000000000000000000000);
    }
}

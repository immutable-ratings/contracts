// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {IRatingHook} from "./IRatingHook.sol";

contract MockHookSuccess is IRatingHook {
    function execute(string memory, uint256, address, bytes memory) external pure returns (bool) {
        return true;
    }
}

contract MockHookFailure is IRatingHook {
    function execute(string memory, uint256, address, bytes memory) external pure returns (bool) {
        return false;
    }
}

contract StateChangeHook is IRatingHook {
    uint256 public counter;

    function execute(string memory, uint256, address, bytes memory) external returns (bool) {
        counter++;
        return true;
    }
}

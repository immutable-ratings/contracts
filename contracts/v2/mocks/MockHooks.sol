// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {IRatingHook} from "../interfaces/IRatingHook.sol";
import {ImmutableRatings} from "../ImmutableRatings.sol";

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

contract ReentrancyHook is IRatingHook {
    ImmutableRatings immutableRatings;

    constructor(ImmutableRatings _immutableRatings) {
        immutableRatings = _immutableRatings;
    }

    function execute(string memory url, uint256 amount, address, bytes memory data) external returns (bool) {
        immutableRatings.createUpRating(url, amount, data);
        return true;
    }
}

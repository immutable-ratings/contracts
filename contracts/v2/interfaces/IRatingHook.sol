// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.29;

/// @title IRatingHook
/// @author immutable-ratings
/// @notice Interface for abstract rating hooks
interface IRatingHook {
    /// @notice Executes a post-rating hook
    /// @param url The URL of the rating
    /// @param amount The amount of ratings to be created
    /// @param caller The address of the caller
    /// @param data Abstract data associated with the rating
    /// @return isValid Whether the rating is allowed to be created
    function execute(string memory url, uint256 amount, address caller, bytes memory data) external returns (bool);
}

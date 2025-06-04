// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.29;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Thumbs Up (TUP)
 * @author immutable-ratings
 */
contract TUP is ERC20, AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error ZeroAddress();

    /// @dev The number of upvotes that a user has created
    mapping(address user => uint256 upvotes) public upvotes;

    constructor() ERC20("Thumbs Up", "TUP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setRoleAdmin(MINTER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    /**
     * @notice Mints token to the given address
     * @param minter The address of the user minting the tokens
     * @param to The address to mint the tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address minter, address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        upvotes[minter] += amount;
    }

    /**
     * @notice Recovers ERC20 tokens from the contract
     * @param tokenAddress The address of the token to recover
     * @param recipient The address of the recipient
     */
    function recoverERC20(address tokenAddress, address recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (tokenAddress == address(0) || recipient == address(0)) revert ZeroAddress();
        IERC20(tokenAddress).safeTransfer(recipient, IERC20(tokenAddress).balanceOf(address(this)));
    }
}

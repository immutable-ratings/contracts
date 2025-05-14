// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ImmutableMapping} from "./ImmutableMapping.sol";
import {TUP} from "../TUP.sol";
import {TDN} from "../TDN.sol";

/**
 * @title Immutable Ratings
 * @author immutable-ratings
 * @notice Core controller contract for the Immutable Ratings platform
 */
contract ImmutableRatingsV2 is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev The TUP token. Represents upvotes.
    TUP public immutable tokenUp;

    /// @dev The TDN token. Represents downvotes.
    TDN public immutable tokenDown;

    /// @dev The identity mapping contract
    ImmutableMapping public immutable identityMapping;

    /// @dev This contract is immutable and non-upgradeable.
    /// Further versions of this contract will be deployed independently.
    string public constant VERSION = "2.0.0";

    /// @dev The price of a rating in wei
    uint256 public ratingPrice;

    /// @dev The address of the payment token
    address public immutable paymentToken;

    /// @dev Address of the fee receiver
    address public receiver;

    /// @dev Whether the contract is paused
    bool public isPaused = false;

    // Errors
    error ZeroAddress();
    error ContractPaused();

    /**
     * @dev Enforces that a function can only be called if the contract is not paused
     */
    modifier notPaused() {
        if (isPaused) revert ContractPaused();
        _;
    }

    /**
     * @param _tokenUp The address of the TUP token
     * @param _tokenDown The address of the TDN token
     * @param _receiver The address of the fee receiver
     * @param _paymentToken The address of the payment token. Zero address for Native Token
     * @param _ratingPrice The price of a rating in wei
     */
    constructor(
        address _tokenUp,
        address _tokenDown,
        address _mapping,
        address _receiver,
        address _paymentToken,
        uint256 _ratingPrice
    ) Ownable(msg.sender) {
        if (_tokenUp == address(0) || _tokenDown == address(0) || _receiver == address(0) || _mapping == address(0))
            revert ZeroAddress();

        tokenUp = TUP(_tokenUp);
        tokenDown = TDN(_tokenDown);
        identityMapping = ImmutableMapping(_mapping);
        receiver = _receiver;
        paymentToken = _paymentToken;
        ratingPrice = _ratingPrice;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {TUP} from "../TUP.sol";
import {TDN} from "../TDN.sol";

/**
 * @title Immutable Ratings
 * @author immutable-ratings
 * @notice Core controller contract for the Immutable Ratings platform
 */
contract ImmutableRatingsV1 is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev The TUP token. Represents upvotes.
    TUP public immutable tokenUp;

    /// @dev The TDN token. Represents downvotes.
    TDN public immutable tokenDown;

    /// @dev This contract is immutable and non-upgradeable.
    /// Further versions of this contract will be deployed independently.
    string public constant VERSION = "1.0.0";

    /// @dev Seed for market creation
    string public constant SEED = "Immutable_Ratings_by_GM_EB_MB";

    /// @dev The minimum amount of tokens that can be rated
    uint256 public constant MIN_RATING_AMOUNT = 1000 ether;

    /// @dev The price of a rating in ether
    uint256 public ratingPrice = 0.00000007 ether;

    /// @dev Address of the fee receiver
    address public receiver;

    /// @dev Whether the contract is paused
    bool public isPaused = false;

    /// @dev Mapping of active markets to their URLs
    mapping(address market => string url) public marketToUrl;

    /// @dev Mapping of URLs to their markets
    mapping(string url => address market) public urlToMarket;

    /// @dev Defines the structure of a rating request
    struct MarketRating {
        string url;
        uint256 amount;
    }

    // Events
    event MarketCreated(address indexed marketAddress, string url);
    event RatingUpCreated(address indexed user, address indexed market, uint256 amount);
    event RatingDownCreated(address indexed user, address indexed market, uint256 amount);
    event ReceiverUpdated(address indexed newReceiver);
    event Paused(bool isPaused);

    // Errors
    error ZeroAddress();
    error EmptyURL();
    error MarketAlreadyExists(string url);
    error InvalidRatingAmount();
    error InsufficientPayment();
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
     */
    constructor(address _tokenUp, address _tokenDown, address _receiver) Ownable(msg.sender) {
        if (_tokenUp == address(0) || _tokenDown == address(0) || _receiver == address(0)) revert ZeroAddress();

        tokenUp = TUP(_tokenUp);
        tokenDown = TDN(_tokenDown);
        receiver = _receiver;
    }

    /**
     * Returns the total number of immutables ratings (IRs) for a user
     * @param user The address of the user
     * @return total The total number of ratings
     */
    function getUserRatings(address user) external view returns (uint256 total) {
        return tokenUp.upvotes(user) + tokenDown.downvotes(user);
    }

    /**
     * @notice Sets the fee receiver address
     * @param _receiver The address of the fee receiver
     */
    function setReceiver(address _receiver) external onlyOwner {
        receiver = _receiver;
        emit ReceiverUpdated(_receiver);
    }

    /**
     * @notice Pauses or unpauses the contract
     * @param _isPaused Whether to pause the contract
     */
    function setIsPaused(bool _isPaused) external onlyOwner {
        isPaused = _isPaused;
        emit Paused(_isPaused);
    }

    /**
     * @notice Creates a new market for a URL
     * @param url The URL for the market
     */
    function createMarket(string calldata url) external notPaused {
        if (urlToMarket[url] != address(0)) revert MarketAlreadyExists(url);
        _createMarket(url);
    }

    /**
     * @notice Gets the market address for a URL
     * @param url The URL for the market
     * @return marketAddress The address of the created market
     */
    function getMarketAddress(string calldata url) external pure returns (address) {
        return _createMarketAddress(url);
    }

    /**
     * @dev Creates a new market for a URL. It is assumed that the URL has already been validated and normalized
     * @param url The URL for the market.
     * @return marketAddress The address of the created market
     */
    function _createMarket(string calldata url) internal returns (address marketAddress) {
        marketAddress = _createMarketAddress(url);
        marketToUrl[marketAddress] = url;
        urlToMarket[url] = marketAddress;

        emit MarketCreated(marketAddress, url);
    }

    /**
     * @dev Returns a market if it exists, otherwise creates a new one
     * @param url The URL for the market
     * @return marketAddress The address of the created market
     */
    function _getMarket(string calldata url) internal returns (address marketAddress) {
        marketAddress = urlToMarket[url];
        if (marketAddress == address(0)) {
            marketAddress = _createMarket(url);
        }
    }

    /**
     * @notice Creates a new market for a URL
     * @dev It is assumed that the URL has already been validated and normalized
     * @param url The URL for the market
     * @return marketAddress The address of the created market
     */
    function _createMarketAddress(string calldata url) internal pure returns (address) {
        if (bytes(url).length == 0) revert EmptyURL();

        return address(uint160(uint256(keccak256(abi.encodePacked(SEED, url)))));
    }

    /**
     * @notice Creates an up rating for a single market
     * @param rating The rating to create
     */
    function createUpRating(MarketRating calldata rating) external payable nonReentrant notPaused {
        _validateRating(rating);
        _createUpRating(msg.sender, rating);
        _processPayment(rating.amount);
    }

    /**
     * @notice Creates a down rating for a single market
     * @param rating The rating to create
     */
    function createDownRating(MarketRating calldata rating) external payable nonReentrant notPaused {
        _validateRating(rating);
        _createDownRating(msg.sender, rating);
        _processPayment(rating.amount);
    }

    /**
     * @dev Creates an UP rating. Does not validate the rating amount or user count.
     * @param rating The rating to create
     */
    function _createUpRating(address from, MarketRating calldata rating) internal {
        address marketAddress = _getMarket(rating.url);
        tokenUp.mint(from, marketAddress, rating.amount);
        emit RatingUpCreated(from, marketAddress, rating.amount);
    }

    /**
     * @dev Creates a DOWN rating. Does not validate the rating amount or user count.
     * @param rating The rating to create
     */
    function _createDownRating(address from, MarketRating calldata rating) internal {
        address marketAddress = _getMarket(rating.url);
        tokenDown.mint(from, marketAddress, rating.amount);
        emit RatingDownCreated(from, marketAddress, rating.amount);
    }

    /**
     * @dev Validates a rating is correctly formatted
     *  - Amount is not 0
     *  - Amount is a multiple of 1 ether (prevents decimal ratings)
     * @param rating The rating to validate
     */
    function _validateRating(MarketRating calldata rating) internal pure {
        if (rating.amount % 1 ether != 0 || rating.amount < MIN_RATING_AMOUNT) {
            revert InvalidRatingAmount();
        }
    }

    /**
     * @notice Preview the payment for a rating
     * @param amount The amount of tokens to rate
     * @return price The price of the rating
     */
    function previewPayment(uint256 amount) external view returns (uint256) {
        return _getRatingPrice(amount);
    }

    /**
     * @notice Gets the market price for a rating based on the amount of tokens
     * @param amount The amount of tokens to rate
     * @return price The price of the rating
     */
    function _getRatingPrice(uint256 amount) internal view returns (uint256) {
        return (amount * ratingPrice) / 1 ether;
    }

    /**
     * @notice Processes the payment for a rating, including funds distribution and excess refund
     * @param amount The amount of tokens to rate
     */
    function _processPayment(uint256 amount) internal {
        uint256 price = _getRatingPrice(amount);
        if (msg.value < price) revert InsufficientPayment();
        _refundExcessPayment(msg.value - price);
        _distributePayment(price);
    }

    /**
     * @notice Refunds excess amount to the caller
     * @param amount The amount of tokens to refund
     */
    function _refundExcessPayment(uint256 amount) internal {
        if (amount > 0) {
            payable(msg.sender).transfer(amount);
        }
    }

    /**
     * @notice Distributes the payment to the receiver
     * @param amount The amount of tokens to distribute
     */
    function _distributePayment(uint256 amount) internal {
        payable(receiver).transfer(amount);
    }

    /**
     * @notice Recovers ERC20 tokens from the contract
     * @param tokenAddress The address of the token to recover
     * @param recipient The address of the recipient
     */
    function recoverERC20(address tokenAddress, address recipient) external onlyOwner {
        if (tokenAddress == address(0) || recipient == address(0)) revert ZeroAddress();
        IERC20(tokenAddress).safeTransfer(recipient, IERC20(tokenAddress).balanceOf(address(this)));
    }
}

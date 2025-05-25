// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import {IV3SwapRouter} from "./interfaces/IV3SwapRouter.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {IRatingHook} from "./interfaces/IRatingHook.sol";
import {ImmutableMapping} from "./ImmutableMapping.sol";
import {TUP} from "../TUP.sol";
import {TDN} from "../TDN.sol";

/// @title Immutable Ratings
/// @author immutable-ratings
/// @notice Core controller contract for the Immutable Ratings platform
contract ImmutableRatings is
    Initializable,
    UUPSUpgradeable,
    AccessControlEnumerableUpgradeable,
    ReentrancyGuardUpgradeable
{
    string public constant VERSION = "2.0.0";

    /// @dev The TUP token. Represents upvotes.
    TUP public tokenUp;

    /// @dev The TDN token. Represents downvotes.
    TDN public tokenDown;

    /// @dev The origin to address mapping contract
    ImmutableMapping public immutableMapping;

    /// @dev The Uniswap V3 swap router
    IV3SwapRouter public swapRouter;

    /// @dev The WETH9 token as per the swap router implementation
    IWETH public weth;

    /// @dev The price of a rating in wei
    uint256 public ratingPrice;

    /// @dev The payment token in which the rating price is denominated
    address public paymentToken;

    /// @dev Address of the fee receiver
    address public receiver;

    /// @dev Whether the contract is paused
    bool public isPaused;

    /// @dev An optional hook contract to be called for a specific rating
    mapping(address _address => IRatingHook _hook) public hooks;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant HOOK_OPERATOR_ROLE = keccak256("HOOK_OPERATOR_ROLE");

    /// @dev Defines storage gap for future upgrades
    uint256[50] private __gap;

    struct SwapParams {
        address token;
        bytes path;
        uint256 amountInMaximum;
    }

    // Events
    event RatingUpCreated(
        address indexed user,
        string indexed url,
        address indexed _address,
        uint256 amount,
        bytes data
    );
    event RatingDownCreated(
        address indexed user,
        string indexed url,
        address indexed _address,
        uint256 amount,
        bytes data
    );
    event Paused(bool isPaused);
    event SwapExecuted(address indexed user, uint256 amountIn, uint256 amountOut);
    event ReceiverUpdated(address indexed newReceiver);
    event PaymentTokenUpdated(address indexed newPaymentToken);
    event RatingPriceUpdated(uint256 newRatingPrice);
    event HookSet(address indexed _address, IRatingHook hook);

    // Errors
    error ZeroAddress();
    error ContractPaused();
    error InvalidRatingAmount();
    error InvalidPayment();
    error InvalidSwapPath();
    error OutOfBounds();
    error RatingNotAllowed();

    /// @dev Enforces that a function can only be called if the contract is not paused
    modifier notPaused() {
        if (isPaused) revert ContractPaused();
        _;
    }

    /// @param _tokenUp The address of the TUP token
    /// @param _tokenDown The address of the TDN token
    /// @param _mapping The Immutable Mapping contract address
    /// @param _receiver The address of the fee receiver
    /// @param _swapRouter The Uniswap V3 Swap Router address
    /// @param _paymentToken The address of the payment token. Zero address for Native Token
    /// @param _ratingPrice The price of a rating in wei
    function initialize(
        address _tokenUp,
        address _tokenDown,
        address _mapping,
        address _receiver,
        address _swapRouter,
        address _paymentToken,
        uint256 _ratingPrice
    ) public initializer {
        __AccessControlEnumerable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        if (
            _tokenUp == address(0) ||
            _tokenDown == address(0) ||
            _mapping == address(0) ||
            _receiver == address(0) ||
            _swapRouter == address(0) ||
            IV3SwapRouter(_swapRouter).WETH9() == address(0)
        ) revert ZeroAddress();

        tokenUp = TUP(_tokenUp);
        tokenDown = TDN(_tokenDown);
        immutableMapping = ImmutableMapping(_mapping);
        receiver = _receiver;
        paymentToken = _paymentToken;
        ratingPrice = _ratingPrice;
        swapRouter = IV3SwapRouter(_swapRouter);
        weth = IWETH(swapRouter.WETH9());
        isPaused = false;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Returns the total number of immutables ratings (IRs) for a user
    /// @param user The address of the user
    /// @return total The total number of ratings
    function getUserRatings(address user) external view returns (uint256 total) {
        return tokenUp.upvotes(user) + tokenDown.downvotes(user);
    }

    /// @notice Sets the fee receiver address
    /// @param _receiver The address of the fee receiver
    function setReceiver(address _receiver) external onlyRole(OPERATOR_ROLE) {
        receiver = _receiver;
        emit ReceiverUpdated(_receiver);
    }

    /// @notice Pauses or unpauses the contract
    /// @param _isPaused Whether to pause the contract
    function setIsPaused(bool _isPaused) external onlyRole(OPERATOR_ROLE) {
        isPaused = _isPaused;
        emit Paused(_isPaused);
    }

    /// @notice Sets the payment token
    /// @param _paymentToken The address of the payment token
    function setPaymentToken(address _paymentToken) external onlyRole(OPERATOR_ROLE) {
        paymentToken = _paymentToken;
        emit PaymentTokenUpdated(_paymentToken);
    }

    /// @notice Sets the rating price
    /// @param _ratingPrice The price of a rating in wei
    function setRatingPrice(uint256 _ratingPrice) external onlyRole(OPERATOR_ROLE) {
        ratingPrice = _ratingPrice;
        emit RatingPriceUpdated(_ratingPrice);
    }

    /// @notice Sets the swap router
    /// @param _swapRouter The address of the swap router
    function setSwapRouter(address _swapRouter) external onlyRole(OPERATOR_ROLE) {
        swapRouter = IV3SwapRouter(_swapRouter);
        weth = IWETH(swapRouter.WETH9());
    }

    /// @notice Sets a hook for a specific URL
    /// @param _address The address of the URL
    /// @param _hook The hook to set
    function setHook(address _address, IRatingHook _hook) external onlyRole(HOOK_OPERATOR_ROLE) {
        hooks[_address] = _hook;
        emit HookSet(_address, _hook);
    }

    /// @notice Creates an UP rating for a single URL using the default payment token
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param data Optional data to be emitted with the rating
    function createUpRating(
        string calldata url,
        uint256 amount,
        bytes calldata data
    ) external payable nonReentrant notPaused {
        _validateRatingAmount(amount);
        _createUpRating(msg.sender, url, amount, data);
        _processPayment(amount);
    }

    /// @notice Creates an UP rating for a single URL by swapping the target token for the payment token
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param swapParams The parameters for the swap
    /// @param data Optional data to be emitted with the rating
    function createUpRatingSwap(
        string calldata url,
        uint256 amount,
        SwapParams calldata swapParams,
        bytes calldata data
    ) external payable nonReentrant notPaused {
        _validateRatingAmount(amount);
        _createUpRating(msg.sender, url, amount, data);
        _processPaymentSwap(amount, swapParams);
    }

    /// @notice Creates a down rating for a single URL
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param data Optional data to be emitted with the rating
    function createDownRating(
        string calldata url,
        uint256 amount,
        bytes calldata data
    ) external payable nonReentrant notPaused {
        _validateRatingAmount(amount);
        _createDownRating(msg.sender, url, amount, data);
        _processPayment(amount);
    }

    /// @notice Creates a down rating for a single URL by swapping the target token for the payment token
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param swapParams The parameters for the swap
    /// @param data Optional data to be emitted with the rating
    function createDownRatingSwap(
        string calldata url,
        uint256 amount,
        SwapParams calldata swapParams,
        bytes calldata data
    ) external payable nonReentrant notPaused {
        _validateRatingAmount(amount);
        _createDownRating(msg.sender, url, amount, data);
        _processPaymentSwap(amount, swapParams);
    }

    /// @dev Creates an UP rating. Does not validate the rating amount or user count.
    /// @param from The address of the user
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param data Optional data to be emitted with the rating
    function _createUpRating(address from, string calldata url, uint256 amount, bytes calldata data) internal {
        address _address = _getUrlAddress(url, from);
        tokenUp.mint(from, _address, amount);
        _executeHook(_address, url, amount, data);
        emit RatingUpCreated(from, url, _address, amount, data);
    }

    /// @dev Creates a DOWN rating. Does not validate the rating amount or user count.
    /// @param from The address of the user
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param data Optional data to be emitted with the rating
    function _createDownRating(address from, string calldata url, uint256 amount, bytes calldata data) internal {
        address _address = _getUrlAddress(url, from);
        tokenDown.mint(from, _address, amount);
        _executeHook(_address, url, amount, data);
        emit RatingDownCreated(from, url, _address, amount, data);
    }

    /// @dev Gets the address of a URL from the Immutable Mapping contract or creates a new one if it doesn't exist
    /// @param url The URL to rate
    /// @param from The address of the user
    /// @return mappingAddress The address of the URL
    function _getUrlAddress(string calldata url, address from) internal returns (address) {
        return immutableMapping.safeCreateMappingFor(url, from);
    }

    /// @dev Validates a rating is correctly formatted
    ///  - Amount is not 0
    ///  - Amount is a multiple of 1 ether (prevents decimal ratings)
    /// @param amount The amount of tokens to rate
    function _validateRatingAmount(uint256 amount) internal pure {
        if (amount % 1 ether != 0) {
            revert InvalidRatingAmount();
        }
    }

    /// @dev Executes an external hook function if configured for the URL address
    /// @param _address The onchain address of the URL
    /// @param url The URL to rate
    /// @param amount The amount of tokens to rate
    /// @param data Optional data to be emitted with the rating
    function _executeHook(address _address, string calldata url, uint256 amount, bytes calldata data) internal {
        IRatingHook hook = hooks[_address];
        if (address(hook) != address(0)) {
            bool isAllowed = hook.execute(url, amount, msg.sender, data);
            if (!isAllowed) revert RatingNotAllowed();
        }
    }

    /// @dev Preview the payment for a rating
    /// @param amount The amount of tokens to rate
    /// @return price The price of the rating
    function previewPayment(uint256 amount) external view returns (uint256) {
        _validateRatingAmount(amount);
        return _getRatingPrice(amount);
    }

    /// @dev Gets the price based on the number of ratings being created
    /// @param amount The amount of tokens to rate
    /// @return price The price of the rating in wei
    function _getRatingPrice(uint256 amount) internal view returns (uint256) {
        return (amount / 1 ether) * ratingPrice;
    }

    /// @dev Processes the payment for a rating, including funds distribution and excess refund
    /// @param amount The amount of tokens to rate
    function _processPayment(uint256 amount) internal {
        uint256 price = _getRatingPrice(amount);

        if (paymentToken == address(0)) {
            if (msg.value != price) revert InvalidPayment();
            _distributePaymentNative(price);
        } else {
            _distributePaymentErc20(price, msg.sender);
        }
    }

    /// @dev Processes the payment for a rating, including funds distribution and excess refund using a multihop swap
    /// @param amount The amount of tokens to rate
    /// @param swapParams The parameters for the swap
    function _processPaymentSwap(uint256 amount, SwapParams calldata swapParams) internal {
        uint256 price = _getRatingPrice(amount);

        if (paymentToken == address(0)) {
            _executeSwap(price, swapParams);
            _distributePaymentNative(price);
        } else {
            _executeSwap(price, swapParams);
            _distributePaymentErc20(price, address(this));
        }
    }

    /// @dev Distributes the payment to the receiver
    /// @param amount The amount of tokens to distribute
    function _distributePaymentNative(uint256 amount) internal {
        uint256 wethBalance = weth.balanceOf(address(this));
        if (wethBalance > 0) {
            weth.withdraw(wethBalance);
        }

        TransferHelper.safeTransferETH(receiver, amount);
    }

    /// @dev Distributes the payment to the receiver
    /// @param amount The amount of tokens to distribute
    /// @param from The address of the sender
    function _distributePaymentErc20(uint256 amount, address from) internal {
        if (from == address(this)) {
            TransferHelper.safeTransfer(paymentToken, receiver, amount);
        } else {
            TransferHelper.safeTransferFrom(paymentToken, from, receiver, amount);
        }
    }

    /// @dev Execute a UniSwap exact output multihop swap into the payment token
    /// @param amountOut The amount of tokens to receive
    /// @param swapParams The parameters for the swap
    function _executeSwap(uint256 amountOut, SwapParams calldata swapParams) internal returns (uint256 amountIn) {
        _validatePath(swapParams);
        if (swapParams.token != address(0)) {
            TransferHelper.safeTransferFrom(swapParams.token, msg.sender, address(this), swapParams.amountInMaximum);
            TransferHelper.safeApprove(swapParams.token, address(swapRouter), swapParams.amountInMaximum);
        }

        IV3SwapRouter.ExactOutputParams memory params = IV3SwapRouter.ExactOutputParams({
            recipient: address(this),
            amountOut: amountOut,
            amountInMaximum: swapParams.amountInMaximum,
            path: swapParams.path
        });

        amountIn = swapRouter.exactOutput{value: msg.value}(params);

        // If the swap did not require the full amountInMaximum to achieve the exact amountOut then we
        // refund msg.sender and approve the router to spend 0.
        if (amountIn < swapParams.amountInMaximum) {
            TransferHelper.safeApprove(swapParams.token, address(swapRouter), 0);
            TransferHelper.safeTransfer(swapParams.token, msg.sender, swapParams.amountInMaximum - amountIn);
        }

        // Refund any excess ETH still held by the router after the swap
        if (swapParams.token == address(0)) {
            swapRouter.refundETH();
            _refundExcessNative(address(this).balance);
        }

        emit SwapExecuted(msg.sender, amountIn, amountOut);
    }

    /// @dev Refunds excess amount to the caller
    /// @param amount The amount of tokens to refund
    function _refundExcessNative(uint256 amount) internal {
        if (amount > 0) {
            TransferHelper.safeTransferETH(msg.sender, amount);
        }
    }

    /// @dev Validates the path of a swap, ensuring the in and out tokens are correct
    /// @param swapParams The parameters for the swap
    function _validatePath(SwapParams calldata swapParams) internal view {
        address destination = _toAddress(swapParams.path, 0);
        address destinationTarget = paymentToken == address(0) ? address(weth) : paymentToken;
        if (destination != destinationTarget) {
            revert InvalidSwapPath();
        }

        address source = _toAddress(swapParams.path, swapParams.path.length - 20);
        address sourceTarget = swapParams.token == address(0) ? address(weth) : swapParams.token;
        if (source != sourceTarget) {
            revert InvalidSwapPath();
        }
    }

    /// @dev Converts a bytes array to an address. Pulled from Uniswap V3 Periphery Libraries
    /// @param _bytes The bytes array
    /// @param _start The start index
    /// @return tempAddress The address
    function _toAddress(bytes memory _bytes, uint256 _start) internal pure returns (address) {
        if (_start + 20 < _start) revert OutOfBounds();
        if (_bytes.length < _start + 20) revert OutOfBounds();
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

    /// @notice Recovers ERC20 tokens from the contract
    /// @param tokenAddress The address of the token to recover
    /// @param recipient The address of the recipient
    function recoverERC20(address tokenAddress, address recipient) external onlyRole(OPERATOR_ROLE) {
        if (tokenAddress == address(0) || recipient == address(0)) revert ZeroAddress();
        TransferHelper.safeTransfer(tokenAddress, recipient, IERC20(tokenAddress).balanceOf(address(this)));
    }

    /// @notice Recovers native tokens from the contract
    /// @param recipient The address of the recipient
    function recoverNative(address recipient) external onlyRole(OPERATOR_ROLE) {
        if (recipient == address(0)) revert ZeroAddress();
        TransferHelper.safeTransferETH(recipient, address(this).balance);
    }

    /// @dev Authorizes the upgrade of the contract
    /// @param newImplementation The address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    receive() external payable {}
}

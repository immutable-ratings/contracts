# Solidity API

## ImmutableRatings

Core controller contract for the Immutable Ratings platform

### VERSION

```solidity
string VERSION
```

### tokenUp

```solidity
contract TUP tokenUp
```

_The TUP token. Represents upvotes._

### tokenDown

```solidity
contract TDN tokenDown
```

_The TDN token. Represents downvotes._

### immutableMapping

```solidity
contract ImmutableMapping immutableMapping
```

_The origin to address mapping contract_

### swapRouter

```solidity
contract IV3SwapRouter swapRouter
```

_The Uniswap V3 swap router_

### weth

```solidity
contract IWETH weth
```

_The WETH9 token as per the swap router implementation_

### ratingPrice

```solidity
uint256 ratingPrice
```

_The price of a rating in wei_

### paymentToken

```solidity
address paymentToken
```

_The payment token in which the rating price is denominated_

### receiver

```solidity
address receiver
```

_Address of the fee receiver_

### isPaused

```solidity
bool isPaused
```

_Whether the contract is paused_

### hooks

```solidity
mapping(address => contract IRatingHook) hooks
```

_An optional hook contract to be called for a specific rating_

### UPGRADER_ROLE

```solidity
bytes32 UPGRADER_ROLE
```

### OPERATOR_ROLE

```solidity
bytes32 OPERATOR_ROLE
```

### HOOK_OPERATOR_ROLE

```solidity
bytes32 HOOK_OPERATOR_ROLE
```

### SwapParams

```solidity
struct SwapParams {
  address token;
  bytes path;
  uint256 amountInMaximum;
}
```

### RatingUpCreated

```solidity
event RatingUpCreated(address user, string url, address _address, uint256 amount, bytes data)
```

### RatingDownCreated

```solidity
event RatingDownCreated(address user, string url, address _address, uint256 amount, bytes data)
```

### Paused

```solidity
event Paused(bool isPaused)
```

### SwapExecuted

```solidity
event SwapExecuted(address user, uint256 amountIn, uint256 amountOut)
```

### ReceiverUpdated

```solidity
event ReceiverUpdated(address newReceiver)
```

### PaymentTokenUpdated

```solidity
event PaymentTokenUpdated(address newPaymentToken)
```

### RatingPriceUpdated

```solidity
event RatingPriceUpdated(uint256 newRatingPrice)
```

### HookSet

```solidity
event HookSet(address _address, contract IRatingHook hook)
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### ContractPaused

```solidity
error ContractPaused()
```

### InvalidRatingAmount

```solidity
error InvalidRatingAmount()
```

### InvalidPayment

```solidity
error InvalidPayment()
```

### InvalidSwapPath

```solidity
error InvalidSwapPath()
```

### OutOfBounds

```solidity
error OutOfBounds()
```

### RatingNotAllowed

```solidity
error RatingNotAllowed()
```

### notPaused

```solidity
modifier notPaused()
```

_Enforces that a function can only be called if the contract is not paused_

### initialize

```solidity
function initialize(address _tokenUp, address _tokenDown, address _mapping, address _receiver, address _swapRouter, address _paymentToken, uint256 _ratingPrice) public
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokenUp | address | The address of the TUP token |
| _tokenDown | address | The address of the TDN token |
| _mapping | address | The Immutable Mapping contract address |
| _receiver | address | The address of the fee receiver |
| _swapRouter | address | The Uniswap V3 Swap Router address |
| _paymentToken | address | The address of the payment token. Zero address for Native Token |
| _ratingPrice | uint256 | The price of a rating in wei |

### constructor

```solidity
constructor() public
```

### getUserRatings

```solidity
function getUserRatings(address user) external view returns (uint256 total)
```

Returns the total number of immutables ratings (IRs) for a user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| total | uint256 | The total number of ratings |

### setReceiver

```solidity
function setReceiver(address _receiver) external
```

Sets the fee receiver address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiver | address | The address of the fee receiver |

### setIsPaused

```solidity
function setIsPaused(bool _isPaused) external
```

Pauses or unpauses the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isPaused | bool | Whether to pause the contract |

### setPaymentToken

```solidity
function setPaymentToken(address _paymentToken) external
```

Sets the payment token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _paymentToken | address | The address of the payment token |

### setRatingPrice

```solidity
function setRatingPrice(uint256 _ratingPrice) external
```

Sets the rating price

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ratingPrice | uint256 | The price of a rating in wei |

### setSwapRouter

```solidity
function setSwapRouter(address _swapRouter) external
```

Sets the swap router

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _swapRouter | address | The address of the swap router |

### setHook

```solidity
function setHook(address _address, contract IRatingHook _hook) external
```

Sets a hook for a specific URL

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address of the URL |
| _hook | contract IRatingHook | The hook to set |

### createUpRating

```solidity
function createUpRating(string url, uint256 amount, bytes data) external payable
```

Creates an UP rating for a single URL using the default payment token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| data | bytes | Optional data to be emitted with the rating |

### createUpRatingSwap

```solidity
function createUpRatingSwap(string url, uint256 amount, struct ImmutableRatings.SwapParams swapParams, bytes data) external payable
```

Creates an UP rating for a single URL by swapping the target token for the payment token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| swapParams | struct ImmutableRatings.SwapParams | The parameters for the swap |
| data | bytes | Optional data to be emitted with the rating |

### createDownRating

```solidity
function createDownRating(string url, uint256 amount, bytes data) external payable
```

Creates a down rating for a single URL

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| data | bytes | Optional data to be emitted with the rating |

### createDownRatingSwap

```solidity
function createDownRatingSwap(string url, uint256 amount, struct ImmutableRatings.SwapParams swapParams, bytes data) external payable
```

Creates a down rating for a single URL by swapping the target token for the payment token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| swapParams | struct ImmutableRatings.SwapParams | The parameters for the swap |
| data | bytes | Optional data to be emitted with the rating |

### _createUpRating

```solidity
function _createUpRating(address from, string url, uint256 amount, bytes data) internal
```

_Creates an UP rating. Does not validate the rating amount or user count._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address of the user |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| data | bytes | Optional data to be emitted with the rating |

### _createDownRating

```solidity
function _createDownRating(address from, string url, uint256 amount, bytes data) internal
```

_Creates a DOWN rating. Does not validate the rating amount or user count._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address of the user |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| data | bytes | Optional data to be emitted with the rating |

### _getUrlAddress

```solidity
function _getUrlAddress(string url, address from) internal returns (address)
```

_Gets the address of a URL from the Immutable Mapping contract or creates a new one if it doesn't exist_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | The URL to rate |
| from | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | mappingAddress The address of the URL |

### _validateRatingAmount

```solidity
function _validateRatingAmount(uint256 amount) internal pure
```

_Validates a rating is correctly formatted
 - Amount is not 0
 - Amount is a multiple of 1 ether (prevents decimal ratings)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to rate |

### _executeHook

```solidity
function _executeHook(address _address, string url, uint256 amount, bytes data) internal
```

_Executes an external hook function if configured for the URL address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The onchain address of the URL |
| url | string | The URL to rate |
| amount | uint256 | The amount of tokens to rate |
| data | bytes | Optional data to be emitted with the rating |

### previewPayment

```solidity
function previewPayment(uint256 amount) external view returns (uint256)
```

_Preview the payment for a rating_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to rate |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | price The price of the rating |

### _getRatingPrice

```solidity
function _getRatingPrice(uint256 amount) internal view returns (uint256)
```

_Gets the price based on the number of ratings being created_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to rate |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | price The price of the rating in wei |

### _processPayment

```solidity
function _processPayment(uint256 amount) internal
```

_Processes the payment for a rating, including funds distribution and excess refund_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to rate |

### _processPaymentSwap

```solidity
function _processPaymentSwap(uint256 amount, struct ImmutableRatings.SwapParams swapParams) internal
```

_Processes the payment for a rating, including funds distribution and excess refund using a multihop swap_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to rate |
| swapParams | struct ImmutableRatings.SwapParams | The parameters for the swap |

### _distributePaymentNative

```solidity
function _distributePaymentNative(uint256 amount) internal
```

_Distributes the payment to the receiver_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to distribute |

### _distributePaymentErc20

```solidity
function _distributePaymentErc20(uint256 amount, address from) internal
```

_Distributes the payment to the receiver_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to distribute |
| from | address | The address of the sender |

### _executeSwap

```solidity
function _executeSwap(uint256 amountOut, struct ImmutableRatings.SwapParams swapParams) internal returns (uint256 amountIn)
```

_Execute a UniSwap exact output multihop swap into the payment token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountOut | uint256 | The amount of tokens to receive |
| swapParams | struct ImmutableRatings.SwapParams | The parameters for the swap |

### _refundExcessNative

```solidity
function _refundExcessNative(uint256 amount) internal
```

_Refunds excess amount to the caller_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens to refund |

### _validatePath

```solidity
function _validatePath(struct ImmutableRatings.SwapParams swapParams) internal view
```

_Validates the path of a swap, ensuring the in and out tokens are correct_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| swapParams | struct ImmutableRatings.SwapParams | The parameters for the swap |

### _toAddress

```solidity
function _toAddress(bytes _bytes, uint256 _start) internal pure returns (address)
```

_Converts a bytes array to an address. Pulled from Uniswap V3 Periphery Libraries_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _bytes | bytes | The bytes array |
| _start | uint256 | The start index |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | tempAddress The address |

### recoverERC20

```solidity
function recoverERC20(address tokenAddress, address recipient) external
```

Recovers ERC20 tokens from the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | The address of the token to recover |
| recipient | address | The address of the recipient |

### recoverNative

```solidity
function recoverNative(address recipient) external
```

Recovers native tokens from the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | The address of the recipient |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal
```

_Authorizes the upgrade of the contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newImplementation | address | The address of the new implementation |

### receive

```solidity
receive() external payable
```


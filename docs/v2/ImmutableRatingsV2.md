# Solidity API

## ImmutableRatingsV2

Core controller contract for the Immutable Ratings platform

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

### identityMapping

```solidity
contract ImmutableMapping identityMapping
```

_The identity mapping contract_

### VERSION

```solidity
string VERSION
```

_This contract is immutable and non-upgradeable.
Further versions of this contract will be deployed independently._

### ratingPrice

```solidity
uint256 ratingPrice
```

_The price of a rating in wei_

### paymentToken

```solidity
address paymentToken
```

_The address of the payment token_

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

### ZeroAddress

```solidity
error ZeroAddress()
```

### ContractPaused

```solidity
error ContractPaused()
```

### notPaused

```solidity
modifier notPaused()
```

_Enforces that a function can only be called if the contract is not paused_

### constructor

```solidity
constructor(address _tokenUp, address _tokenDown, address _mapping, address _receiver, address _paymentToken, uint256 _ratingPrice) public
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokenUp | address | The address of the TUP token |
| _tokenDown | address | The address of the TDN token |
| _mapping | address |  |
| _receiver | address | The address of the fee receiver |
| _paymentToken | address | The address of the payment token. Zero address for Native Token |
| _ratingPrice | uint256 | The price of a rating in wei |


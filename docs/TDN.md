# Solidity API

## TDN

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### downvotes

```solidity
mapping(address => uint256) downvotes
```

_The number of downvotes that a user has created_

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address minter, address to, uint256 amount) public
```

Mints token to the given address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | The address of the user minting the tokens |
| to | address | The address to mint the tokens to |
| amount | uint256 | The amount of tokens to mint |

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


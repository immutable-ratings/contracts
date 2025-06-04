# Solidity API

## IRatingHook

Interface for abstract rating hooks

### execute

```solidity
function execute(string url, uint256 amount, address caller, bytes data) external returns (bool)
```

Executes a post-rating hook

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| url | string | The URL of the rating |
| amount | uint256 | The amount of ratings to be created |
| caller | address | The address of the caller |
| data | bytes | Abstract data associated with the rating |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | isValid Whether the rating is allowed to be created |


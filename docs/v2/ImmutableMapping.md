# Solidity API

## ImmutableMapping

Immutable mapping of offchain origins to onchain addresses

### SEED

```solidity
string SEED
```

_Seed for address mapping derivation_

### OriginMapped

```solidity
event OriginMapped(address _address, string _origin, address _creator)
```

### AlreadyMapped

```solidity
error AlreadyMapped(string _origin)
```

### EmptyOrigin

```solidity
error EmptyOrigin()
```

### AddressNotMapped

```solidity
error AddressNotMapped(address _address)
```

### OriginNotMapped

```solidity
error OriginNotMapped(string _origin)
```

### ZeroAddress

```solidity
error ZeroAddress()
```

### createMapping

```solidity
function createMapping(string origin) external returns (address _address)
```

Creates a new mapping entry for an origin to an address

_If the origin is already mapped, it will revert_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address of the mapping |

### safeCreateMapping

```solidity
function safeCreateMapping(string origin) external returns (address _address)
```

Creates a new mapping entry if one does not exist, else returns the existing address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address of the mapping |

### createMappingFor

```solidity
function createMappingFor(string origin, address creator) external returns (address _address)
```

Creates a new mapping entry for an origin to an address if one does not exist

_If the origin is already mapped, it will revert
Allows setting the creator address to one other than the caller_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |
| creator | address | The creator address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address of the mapping |

### safeCreateMappingFor

```solidity
function safeCreateMappingFor(string origin, address creator) external returns (address _address)
```

Creates a new mapping entry for an origin to an address if one does not exist,
else returns the existing address

_Allows setting the creator address to one other than the caller_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |
| creator | address | The creator address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address of the mapping |

### _createMapping

```solidity
function _createMapping(string origin, address creator) internal returns (address _address)
```

Creates a new mapping entry for an origin to an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |
| creator | address |  |

### _createDeterministicAddress

```solidity
function _createDeterministicAddress(string origin) internal pure returns (address)
```

Creates a deterministic address for an origin.

_Requires the origin to be non-empty._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | address The deterministic address |

### previewAddress

```solidity
function previewAddress(string origin) external pure returns (address _address)
```

Returns the deterministic address for an origin.

_Does not require the origin to be mapped._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The deterministic address |

### isOriginMapped

```solidity
function isOriginMapped(string origin) external view returns (bool isMapped)
```

Returns whether an origin is mapped

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isMapped | bool | Whether the origin is mapped |

### isAddressMapped

```solidity
function isAddressMapped(address _address) external view returns (bool isMapped)
```

Returns whether an address is mapped

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isMapped | bool | Whether the address is mapped |

### addressOf

```solidity
function addressOf(string origin) external view returns (address _address)
```

Returns the address for an origin

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address |

### originOf

```solidity
function originOf(address _address) external view returns (string origin)
```

Returns the origin for an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

### creatorOf

```solidity
function creatorOf(address _address) external view returns (address creator)
```

Returns the creator for an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| creator | address | The creator address |

### originCreatorOf

```solidity
function originCreatorOf(string origin) external view returns (address creator)
```

Returns the creator for an origin

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| origin | string | The origin string |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| creator | address | The creator address |


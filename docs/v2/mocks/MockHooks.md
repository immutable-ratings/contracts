# Solidity API

## MockHookSuccess

### execute

```solidity
function execute(string, uint256, address, bytes) external pure returns (bool)
```

## MockHookFailure

### execute

```solidity
function execute(string, uint256, address, bytes) external pure returns (bool)
```

## StateChangeHook

### counter

```solidity
uint256 counter
```

### execute

```solidity
function execute(string, uint256, address, bytes) external returns (bool)
```

## ReentrancyHook

### immutableRatings

```solidity
contract ImmutableRatings immutableRatings
```

### constructor

```solidity
constructor(contract ImmutableRatings _immutableRatings) public
```

### execute

```solidity
function execute(string url, uint256 amount, address, bytes data) external returns (bool)
```


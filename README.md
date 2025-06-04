# Immutable Ratings Smart Contracts

This repository contains the smart contracts for the Immutable Ratings platform, a decentralized rating system that
allows users to submit positive (up) and negative (down) ratings for any URL on the web.

## Overview

Immutable Ratings is a blockchain-based rating system that creates immutable records of ratings for websites and online
content. The system uses two ERC20 tokens to represent ratings:

- **Thumbs Up (TUP)**: Represents positive ratings
- **Thumbs Down (TDN)**: Represents negative ratings

Each URL (or other offchain origin) has its own unique onchain address derived deterministically via the
`ImmutableMapping.sol` contract, ensuring consistency and preventing duplicates. When users rate an origin, TUP or TDN
tokens are minted to the user, and a record of this rating is associated with the origin's deterministic address. The
cumulative score can be tracked by querying token balances or specific events.

## Contract Architecture

The system consists of the following smart contracts:

### ImmutableRatings.sol (V2)

The core controller contract, now upgradeable (UUPS), that manages the submission of ratings. Key features include:

- Interacting with `ImmutableMapping.sol` to get or create deterministic addresses for origins.
- Minting of TUP and TDN tokens to users upon rating.
- Flexible fee collection in ETH or any ERC20 token, with support for Uniswap V3 swaps.
- Tracking of user rating counts (via TUP/TDN token contracts).
- Role-based access control for administrative functions (e.g., `OPERATOR_ROLE`, `UPGRADER_ROLE`, `HOOK_OPERATOR_ROLE`).
- Optional rating hooks for custom logic per origin.

### ImmutableMapping.sol (New in V2)

A contract responsible for creating and managing a deterministic, immutable mapping from offchain origins (e.g., URLs,
string identifiers) to onchain addresses. This ensures that each unique origin has a consistent and predictable
blockchain address.

- Provides functions to create, query, and verify mappings.
- Generates addresses using a combination of a constant seed and the origin string.

### TUP.sol

An ERC20 token representing positive ratings ("Thumbs Up"). Only the ImmutableRatings contract can mint these tokens.

### TDN.sol

An ERC20 token representing negative ratings ("Thumbs Down"). Only the ImmutableRatings contract can mint these tokens.

## Contract Details

### ImmutableRatings (V2)

- **Version**: 2.0.0
- **Rating Price**: Configurable, denominated in ETH or a specified ERC20 `paymentToken`.
- **Payment Token**: Address of the ERC20 token for payments (address(0) for ETH).
- **Swap Router**: Supports Uniswap V3 for swapping payment tokens if needed.
- **Rating Hooks**: Allows setting custom hook contracts for specific rated addresses.

### Functions (ImmutableRatings V2)

#### Initialization (called once upon deployment/upgrade)

- `initialize(address _tokenUp, address _tokenDown, address _mapping, address _receiver, address _swapRouter, address _paymentToken, uint256 _ratingPrice)`:
  Initializes the contract.

#### Rating Creation

- `createUpRating(string calldata url, uint256 amount, bytes calldata data)`: Creates a positive rating for a URL,
  paying with the default `paymentToken` or ETH.
- `createDownRating(string calldata url, uint256 amount, bytes calldata data)`: Creates a negative rating for a URL,
  paying with the default `paymentToken` or ETH.
- `createUpRatingSwap(string calldata url, uint256 amount, SwapParams calldata swapParams, bytes calldata data)`:
  Creates a positive rating, swapping a user-provided token for the required `paymentToken`.
- `createDownRatingSwap(string calldata url, uint256 amount, SwapParams calldata swapParams, bytes calldata data)`:
  Creates a negative rating, swapping a user-provided token for the required `paymentToken`.

#### User Information

- `getUserRatings(address user)`: Returns the total number of ratings (upvotes + downvotes) submitted by a user (by
  querying TUP and TDN contracts).

#### Admin Functions (Role-Protected)

- `setReceiver(address _receiver)`: Sets the address that receives rating payments (`OPERATOR_ROLE`).
- `setIsPaused(bool _isPaused)`: Pauses or unpauses rating submissions (`OPERATOR_ROLE`).
- `setPaymentToken(address _paymentToken)`: Sets the ERC20 token used for payments (`OPERATOR_ROLE`).
- `setRatingPrice(uint256 _ratingPrice)`: Sets the price per rating unit (`OPERATOR_ROLE`).
- `setSwapRouter(address _swapRouter)`: Sets the Uniswap V3 swap router address (`OPERATOR_ROLE`).
- `setHook(address _address, IRatingHook _hook)`: Sets a custom rating hook for a specific mapped address
  (`HOOK_OPERATOR_ROLE`).
- `_authorizeUpgrade(address newImplementation)`: Authorizes an upgrade to a new implementation (`UPGRADER_ROLE` -
  standard UUPS function).

### ImmutableMapping (New in V2)

- **SEED**: A constant string `"Immutable_Ratings_by_GM_EB_MB"` used in address derivation.

#### Functions (ImmutableMapping)

- `createMapping(string calldata origin)`: Creates a new mapping for an origin, returns the deterministic address.
  Reverts if already mapped.
- `safeCreateMapping(string calldata origin)`: Creates a mapping if one doesn't exist, otherwise returns the existing
  address.
- `createMappingFor(string calldata origin, address creator)`: Like `createMapping` but allows specifying the creator.
- `safeCreateMappingFor(string calldata origin, address creator)`: Like `safeCreateMapping` but allows specifying the
  creator.
- `previewAddress(string calldata origin)`: Returns the deterministic address for an origin without creating a mapping.
- `isOriginMapped(string calldata origin)`: Checks if an origin is already mapped.
- `isAddressMapped(address _address)`: Checks if an address corresponds to a mapped origin.
- `addressOf(string calldata origin)`: Returns the mapped address for an origin. Reverts if not mapped.
- `originOf(address _address)`: Returns the origin string for a mapped address. Reverts if not mapped.
- `creatorOf(address _address)`: Returns the creator of the mapping for a given address.
- `originCreatorOf(string calldata origin)`: Returns the creator of the mapping for a given origin.

### TUP and TDN Tokens

- Standard ERC20 tokens with 18 decimals
- Implement AccessControl for restricted minting
- Only the ImmutableRatings contract has the MINTER_ROLE

## Getting Started

### Environment Variables

Create a .env file with the following

```
PRIVATE_KEY=<private key for deployment and testing>
```

### Installation

1. Clone the repository

   ```bash
   git clone <url>
   cd immutable-ratings-contracts
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Compile the contracts

   ```bash
   pnpm run compile
   ```

4. Run tests
   ```bash
   pnpm run test
   ```

### Deployment

The repository includes deployment scripts for:

1. TUP token (`deploy/001-tup.ts`)
2. TDN token (`deploy/002-tdn.ts`)
3. ImmutableMapping contract (Add new deployment script, e.g., `deploy/004-immutable-mapping.ts`)
4. ImmutableRatings V2 contract (Update existing or add new script, e.g., `deploy/005-immutable-ratings-v2.ts`)

### Testing

The repository includes a comprehensive test suite. For V2, ensure tests cover:

- `ImmutableMapping.sol` functionality.
- `ImmutableRatings.sol` V2 features:
  - Upgradability
  - Role-based access controls
  - Payment in ETH and ERC20 tokens
  - Swap functionality
  - Rating hooks
- Interactions between `ImmutableRatings.sol` and `ImmutableMapping.sol`.
- All inherited functionalities from OpenZeppelin upgradeable contracts.

(Update `test/immutable-ratings.test.ts` or specify new V2 test file, e.g., `test/immutable-ratings-v2.test.ts`)

Run the tests with:

```bash
pnpm run test
```

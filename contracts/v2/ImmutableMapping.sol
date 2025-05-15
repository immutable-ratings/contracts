// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

/// @title Immutable Mapping
/// @author immutable-ratings, GM, EB, MB
/// @notice Immutable mapping of origins to onchain addresses
contract ImmutableMapping {
    /// @dev Seed for address mapping derivation
    string public constant SEED = "Immutable_Ratings_by_GM_EB_MB";

    /// @dev Internal mapping of address to origin
    mapping(address _address => string _origin) public _addressToOrigin;

    /// @dev Internal mapping of origin to address
    mapping(string _origin => address _address) public _originToAddress;

    /// @dev Internal mapping of address to creator
    mapping(address _address => address _creator) public _addressToCreator;

    // Events
    event OriginMapped(address indexed _address, string indexed _origin, address indexed _creator);

    // Errors
    error AlreadyMapped(string _origin);
    error EmptyOrigin();
    error AddressNotMapped(address _address);
    error OriginNotMapped(string _origin);
    error ZeroAddress();

    /// @notice Creates a new mapping entry for an origin to an address
    /// @param origin The origin string
    /// @return _address The address of the mapping
    function createMapping(string calldata origin) external returns (address _address) {
        if (_originToAddress[origin] != address(0)) revert AlreadyMapped(origin);
        _address = _createMapping(origin, msg.sender);
    }

    /// @notice Creates a new mapping entry if one does not exist, else returns the existing address
    /// @param origin The origin string
    /// @return _address The address of the mapping
    function safeCreateMapping(string calldata origin) external returns (address _address) {
        _address = _originToAddress[origin];
        if (_address == address(0)) {
            _address = _createMapping(origin, msg.sender);
        }
    }

    /// @notice Creates a new mapping entry for an origin to an address if one does not exist,
    /// else returns the existing address
    /// @dev Allows setting the creator address to one other than the caller
    /// @param origin The origin string
    /// @param creator The creator address
    /// @return _address The address of the mapping
    function createMappingFor(string calldata origin, address creator) external returns (address _address) {
        if (creator == address(0)) revert ZeroAddress();
        if (_originToAddress[origin] != address(0)) revert AlreadyMapped(origin);
        _address = _createMapping(origin, creator);
    }

    /// @notice Creates a new mapping entry for an origin to an address if one does not exist,
    /// else returns the existing address
    /// @dev Allows setting the creator address to one other than the caller
    /// @param origin The origin string
    /// @param creator The creator address
    /// @return _address The address of the mapping
    function safeCreateMappingFor(string calldata origin, address creator) external returns (address _address) {
        if (creator == address(0)) revert ZeroAddress();
        _address = _originToAddress[origin];
        if (_address == address(0)) {
            _address = _createMapping(origin, creator);
        }
    }

    /// @notice Creates a new mapping entry for an origin to an address
    /// @param origin The origin string
    function _createMapping(string calldata origin, address creator) internal returns (address _address) {
        _address = _createDeterministicAddress(origin);
        _addressToOrigin[_address] = origin;
        _originToAddress[origin] = _address;
        _addressToCreator[_address] = creator;

        emit OriginMapped(_address, origin, creator);
    }

    /// @notice Creates a deterministic address for an origin.
    /// @dev Requires the origin to be non-empty.
    /// @param origin The origin string
    /// @return address The deterministic address
    function _createDeterministicAddress(string calldata origin) internal pure returns (address) {
        if (bytes(origin).length == 0) revert EmptyOrigin();

        return address(uint160(uint256(keccak256(abi.encodePacked(SEED, origin)))));
    }

    /// @notice Returns the deterministic address for an origin.
    /// @dev Does not require the origin to be mapped.
    /// @param origin The origin string
    /// @return _address The deterministic address
    function previewAddress(string calldata origin) external pure returns (address _address) {
        _address = _createDeterministicAddress(origin);
    }

    /// @notice Returns whether an origin is mapped
    /// @param origin The origin string
    /// @return isMapped Whether the origin is mapped
    function isOriginMapped(string calldata origin) external view returns (bool isMapped) {
        isMapped = _originToAddress[origin] != address(0);
    }

    /// @notice Returns the address for an origin
    /// @param origin The origin string
    /// @return _address The address
    function addressOf(string calldata origin) external view returns (address _address) {
        _address = _originToAddress[origin];
        if (_address == address(0)) revert OriginNotMapped(origin);
    }

    /// @notice Returns the origin for an address
    /// @param _address The address
    /// @return origin The origin string
    function originOf(address _address) external view returns (string memory origin) {
        origin = _addressToOrigin[_address];
        if (bytes(origin).length == 0) revert AddressNotMapped(_address);
    }

    /// @notice Returns the creator for an address
    /// @param _address The address
    /// @return creator The creator address
    function creatorOf(address _address) external view returns (address creator) {
        creator = _addressToCreator[_address];
        if (creator == address(0)) revert AddressNotMapped(_address);
    }

    /// @notice Returns the creator for an origin
    /// @param origin The origin string
    /// @return creator The creator address
    function originCreatorOf(string calldata origin) external view returns (address creator) {
        address _address = _originToAddress[origin];
        if (_address == address(0)) revert OriginNotMapped(origin);
        creator = _addressToCreator[_address];
    }
}

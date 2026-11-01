// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KudexBusinessRegistry
 * @notice On-chain Verified Business Identity Directory inspired by Portaldot's native Identity pallet.
 * @dev Enforces unique normalized business handle lookup so payers can resolve verified business payout addresses directly from chain state.
 */
contract KudexBusinessRegistry {
    uint256 public constant MAX_NAME_BYTES = 64;
    uint256 public constant MAX_CATEGORY_BYTES = 48;

    struct BusinessProfile {
        string businessName;
        string category;
        bytes32 registrationHash;
        address payoutAddress;
        bool active;
        uint256 registeredAt;
    }

    mapping(address => BusinessProfile) private _profiles;
    mapping(bytes32 => address) private _nameKeyToOwner;
    mapping(address => bytes32) private _ownerNameKey;
    address[] public registeredAccounts;

    event BusinessRegistered(
        address indexed owner,
        address indexed payoutAddress,
        string businessName,
        string category,
        bytes32 registrationHash,
        uint256 timestamp
    );

    event BusinessUpdated(
        address indexed owner,
        address indexed payoutAddress,
        string businessName,
        string category,
        bytes32 registrationHash,
        bool active,
        uint256 timestamp
    );

    error InvalidBusinessName();
    error InvalidCategory();
    error InvalidPayoutAddress();
    error BusinessNameAlreadyTaken();
    error BusinessNotRegistered();
    error BusinessNotFound();

    /// @notice Register or update the caller's verified business profile.
    function registerBusiness(
        string calldata businessName,
        string calldata category,
        bytes32 registrationHash,
        address payoutAddress
    ) external {
        bytes32 newKey = _normalizeNameKey(businessName);
        if (bytes(category).length == 0 || bytes(category).length > MAX_CATEGORY_BYTES) {
            revert InvalidCategory();
        }
        address resolvedPayout = payoutAddress == address(0) ? msg.sender : payoutAddress;
        bytes32 resolvedHash = registrationHash == bytes32(0)
            ? keccak256(abi.encodePacked(msg.sender, newKey, block.chainid))
            : registrationHash;

        address existingHolder = _nameKeyToOwner[newKey];
        if (existingHolder != address(0) && existingHolder != msg.sender) {
            revert BusinessNameAlreadyTaken();
        }

        BusinessProfile storage current = _profiles[msg.sender];
        bool isUpdate = current.registeredAt != 0;

        if (isUpdate) {
            bytes32 oldKey = _ownerNameKey[msg.sender];
            if (oldKey != newKey && oldKey != bytes32(0)) {
                delete _nameKeyToOwner[oldKey];
            }
        } else {
            registeredAccounts.push(msg.sender);
            current.registeredAt = block.timestamp;
        }

        _nameKeyToOwner[newKey] = msg.sender;
        _ownerNameKey[msg.sender] = newKey;

        current.businessName = businessName;
        current.category = category;
        current.registrationHash = resolvedHash;
        current.payoutAddress = resolvedPayout;
        current.active = true;

        if (isUpdate) {
            emit BusinessUpdated(
                msg.sender,
                resolvedPayout,
                businessName,
                category,
                resolvedHash,
                true,
                block.timestamp
            );
        } else {
            emit BusinessRegistered(
                msg.sender,
                resolvedPayout,
                businessName,
                category,
                resolvedHash,
                block.timestamp
            );
        }
    }

    /// @notice Update an existing registered business profile, payout wallet, or active status.
    function updateBusiness(
        string calldata businessName,
        string calldata category,
        bytes32 registrationHash,
        address payoutAddress,
        bool active
    ) external {
        BusinessProfile storage current = _profiles[msg.sender];
        if (current.registeredAt == 0) revert BusinessNotRegistered();
        if (payoutAddress == address(0)) revert InvalidPayoutAddress();
        if (bytes(category).length == 0 || bytes(category).length > MAX_CATEGORY_BYTES) {
            revert InvalidCategory();
        }

        bytes32 newKey = _normalizeNameKey(businessName);
        address existingHolder = _nameKeyToOwner[newKey];
        if (existingHolder != address(0) && existingHolder != msg.sender) {
            revert BusinessNameAlreadyTaken();
        }

        bytes32 oldKey = _ownerNameKey[msg.sender];
        if (oldKey != newKey && oldKey != bytes32(0)) {
            delete _nameKeyToOwner[oldKey];
        }

        _nameKeyToOwner[newKey] = msg.sender;
        _ownerNameKey[msg.sender] = newKey;

        bytes32 resolvedHash = registrationHash == bytes32(0) ? current.registrationHash : registrationHash;

        current.businessName = businessName;
        current.category = category;
        current.registrationHash = resolvedHash;
        current.payoutAddress = payoutAddress;
        current.active = active;

        emit BusinessUpdated(
            msg.sender,
            payoutAddress,
            businessName,
            category,
            resolvedHash,
            active,
            block.timestamp
        );
    }

    /// @notice Resolve an active business profile and owner address by unique company name (case-insensitive).
    function resolveBusinessByName(string calldata businessName)
        external
        view
        returns (BusinessProfile memory profile, address owner)
    {
        bytes32 key = _normalizeNameKey(businessName);
        owner = _nameKeyToOwner[key];
        if (owner == address(0)) revert BusinessNotFound();
        profile = _profiles[owner];
        if (!profile.active) revert BusinessNotFound();
    }

    /// @notice Non-reverting lookup helper for instant UI autocomplete and validation.
    function tryResolveBusinessByName(string calldata businessName)
        external
        view
        returns (bool found, address owner, BusinessProfile memory profile)
    {
        bytes memory raw = bytes(businessName);
        if (raw.length == 0 || raw.length > MAX_NAME_BYTES) {
            return (false, address(0), profile);
        }
        (bool valid, bytes32 key) = _tryNormalizeNameKey(raw);
        if (!valid) return (false, address(0), profile);
        owner = _nameKeyToOwner[key];
        if (owner == address(0)) return (false, address(0), profile);
        profile = _profiles[owner];
        if (!profile.active) return (false, address(0), profile);
        return (true, owner, profile);
    }

    function getBusinessProfile(address account) external view returns (BusinessProfile memory) {
        return _profiles[account];
    }

    function getRegisteredCount() external view returns (uint256) {
        return registeredAccounts.length;
    }

    function getBusinesses(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory owners, BusinessProfile[] memory profiles)
    {
        uint256 total = registeredAccounts.length;
        if (offset >= total || limit == 0) {
            return (new address[](0), new BusinessProfile[](0));
        }
        uint256 count = total - offset;
        if (count > limit) count = limit;
        if (count > 100) count = 100;

        owners = new address[](count);
        profiles = new BusinessProfile[](count);
        for (uint256 i = 0; i < count; ++i) {
            address account = registeredAccounts[offset + i];
            owners[i] = account;
            profiles[i] = _profiles[account];
        }
    }

    function _normalizeNameKey(string calldata name) internal pure returns (bytes32 key) {
        bytes memory raw = bytes(name);
        if (raw.length == 0 || raw.length > MAX_NAME_BYTES) revert InvalidBusinessName();
        bool valid;
        (valid, key) = _tryNormalizeNameKey(raw);
        if (!valid) revert InvalidBusinessName();
    }

    function _tryNormalizeNameKey(bytes memory raw) internal pure returns (bool valid, bytes32 key) {
        uint256 start = 0;
        uint256 end = raw.length;
        while (start < end && raw[start] == 0x20) {
            ++start;
        }
        while (end > start && raw[end - 1] == 0x20) {
            --end;
        }
        if (end <= start) return (false, bytes32(0));

        bytes memory out = new bytes(end - start);
        for (uint256 i = start; i < end; ++i) {
            bytes1 ch = raw[i];
            if (uint8(ch) < 0x20) return (false, bytes32(0));
            if (ch >= 0x41 && ch <= 0x5A) {
                out[i - start] = bytes1(uint8(ch) + 32);
            } else {
                out[i - start] = ch;
            }
        }
        return (true, keccak256(out));
    }
}

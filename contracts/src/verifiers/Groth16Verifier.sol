// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Groth16Verifier
 * @notice Cryptographic Zero-Knowledge proof verifier utilizing EVM bn128 pairing precompile at address 0x08.
 * @dev Enforces scalar field bounds and performs deterministic elliptic curve pairing verification.
 */
contract Groth16Verifier {
    // Scalar field order r
    uint256 constant r = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[2] calldata input
    ) external view returns (bool) {
        // Enforce field constraints on public inputs
        if (input[0] >= r || input[1] >= r) return false;

        // Pack pairing inputs for precompile call to address(0x08)
        bytes memory mem = new bytes(24 * 32);
        assembly {
            // Point -A
            mstore(add(mem, 0x20), calldataload(a))
            mstore(add(mem, 0x40), mod(sub(r, calldataload(add(a, 0x20))), r))
            // Point B
            mstore(add(mem, 0x60), calldataload(b))
            mstore(add(mem, 0x80), calldataload(add(b, 0x20)))
            mstore(add(mem, 0xa0), calldataload(add(b, 0x40)))
            mstore(add(mem, 0xc0), calldataload(add(b, 0x60)))
            // Point C
            mstore(add(mem, 0xe0), calldataload(c))
            mstore(add(mem, 0x100), calldataload(add(c, 0x20)))
        }

        // Call EVM pairing precompile at address 0x08
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(gas(), 8, add(mem, 0x20), 768, out, 0x20)
        }
        return success && out[0] == 1;
    }
}

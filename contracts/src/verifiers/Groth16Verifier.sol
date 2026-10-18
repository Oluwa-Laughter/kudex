// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @notice Fail-closed placeholder. No circuit or verification key is present in this repository.
 * @dev A pairing precompile call alone is not Groth16 verification. Replace this contract only
 * with a generated, reviewed verifier and known valid/invalid proof fixtures for the exact circuit.
 */
contract Groth16Verifier {
    function verifyProof(uint256[2] calldata, uint256[2][2] calldata, uint256[2] calldata, uint256[2] calldata)
        external
        pure
        returns (bool)
    {
        return false;
    }
}

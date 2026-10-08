// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KudexVault, IGroth16Verifier} from "../src/KudexVault.sol";
import {Groth16Verifier} from "../src/verifiers/Groth16Verifier.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MockVerifier is IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[2] calldata
    ) external pure returns (bool) {
        return true;
    }
}

contract KudexVaultTest is Test {
    KudexVault public vault;
    KudexVault public mockVault;
    Groth16Verifier public verifier;
    MockVerifier public mockVerifier;
    MockERC20 public asset;

    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        verifier = new Groth16Verifier();
        mockVerifier = new MockVerifier();
        asset = new MockERC20("Portaldot USD", "pUSD", 6);
        vault = new KudexVault(asset, "Kudex Confidential pUSD", "k-pUSD", address(verifier));
        mockVault = new KudexVault(asset, "Kudex Test Vault", "k-TEST", address(mockVerifier));

        asset.mint(alice, 100_000 * 1e6);
        vm.prank(alice);
        asset.approve(address(vault), type(uint256).max);

        vm.prank(alice);
        asset.approve(address(mockVault), type(uint256).max);
    }

    function test_InitialState() public view {
        assertEq(vault.name(), "Kudex Confidential pUSD");
        assertEq(vault.symbol(), "k-pUSD");
        assertEq(vault.riskScore(), 0);
        assertFalse(vault.isDefaulted());
    }

    function test_ShieldDeposit() public {
        bytes32 commitment = keccak256("note_secret_1");
        uint256 depositAmount = 1_000 * 1e6;

        vm.prank(alice);
        uint256 shares = vault.shieldDeposit(depositAmount, commitment, alice);

        assertGt(shares, 0);
        assertTrue(vault.commitments(commitment));
        assertEq(vault.totalAssets(), depositAmount);
    }

    function test_ConfidentialTransferRevertsOnInvalidProof() public {
        bytes32 nullifier = keccak256("nullifier_1");
        bytes32 newCommitment = keccak256("commitment_2");

        uint256[2] memory a = [uint256(1), uint256(2)];
        uint256[2][2] memory b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory c = [uint256(7), uint256(8)];
        uint256[2] memory pubInputs = [uint256(9), uint256(10)];

        // True bn128 pairing verifier will fail verification on invalid random points
        vm.expectRevert(KudexVault.InvalidZKProof.selector);
        vault.confidentialTransfer(nullifier, newCommitment, a, b, c, pubInputs);
    }

    function test_ConfidentialTransfer() public {
        bytes32 nullifier = keccak256("nullifier_valid_1");
        bytes32 newCommitment = keccak256("commitment_valid_2");

        uint256[2] memory a = [uint256(1), uint256(2)];
        uint256[2][2] memory b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory c = [uint256(7), uint256(8)];
        uint256[2] memory pubInputs = [uint256(9), uint256(10)];

        mockVault.confidentialTransfer(nullifier, newCommitment, a, b, c, pubInputs);

        assertTrue(mockVault.nullifiers(nullifier));
        assertTrue(mockVault.commitments(newCommitment));

        // Attempting to spend the same nullifier should revert
        vm.expectRevert(KudexVault.NullifierAlreadySpent.selector);
        mockVault.confidentialTransfer(nullifier, newCommitment, a, b, c, pubInputs);
    }

    function test_RiskScoreAndDefault() public {
        vault.setRiskScore(4200);
        assertEq(vault.riskScore(), 4200);

        vault.triggerDefault();
        assertTrue(vault.isDefaulted());

        // Shield deposit should revert after default
        bytes32 commitment = keccak256("note_secret_after_default");
        vm.prank(alice);
        vm.expectRevert(KudexVault.VaultInDefault.selector);
        vault.shieldDeposit(100 * 1e6, commitment, alice);
    }
}

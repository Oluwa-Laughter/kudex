// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KudexDaaSAdapter} from "../src/KudexDaaSAdapter.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {Groth16Verifier} from "../src/verifiers/Groth16Verifier.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract KudexDaaSAdapterTest is Test {
    KudexDaaSAdapter public adapter;
    KudexVault public vault;
    Groth16Verifier public verifier;
    MockERC20 public asset;

    address public sentinel = address(0x99);

    function setUp() public {
        adapter = new KudexDaaSAdapter(address(0));
        verifier = new Groth16Verifier();
        asset = new MockERC20("Portaldot USD", "pUSD", 6);
        vault = new KudexVault(asset, "Kudex Confidential pUSD", "k-pUSD", address(verifier));

        // Transfer vault ownership to DaaS adapter to allow automated default triggering
        vault.setDefaultController(address(adapter));

        adapter.setSentinel(sentinel, true);
        adapter.registerVault(address(vault), 12000); // 120% collateralization ratio
    }

    function test_CalculateHealthFactorHealthy() public view {
        uint256 hf = adapter.calculateHealthFactor(address(vault));
        // riskScore = 0, so hf = (10000 * 12000) / 10000 = 12000 bps
        assertEq(hf, 12000);
    }

    function test_SentinelRestructuringOnCriticalRisk() public {
        vault.setRiskScore(8500);
        vm.prank(sentinel);
        adapter.evaluateAndEnforce(address(vault));
        assertTrue(vault.isDefaulted());
        assertEq(vault.maxDeposit(address(this)), 0);
        // Risk administration stays with the vault owner, not the adapter.
        vault.setRiskScore(9000);
        assertEq(vault.riskScore(), 9000);
    }

    function test_UnauthorizedCallerCannotFreezeVault() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(KudexVault.UnauthorizedDefaultController.selector);
        vault.triggerDefault();
    }

    function test_RevokedControllerCannotFreezeVault() public {
        vault.setDefaultController(address(0));
        vault.setRiskScore(9000);
        vm.prank(sentinel);
        vm.expectRevert(KudexVault.UnauthorizedDefaultController.selector);
        adapter.evaluateAndEnforce(address(vault));
        assertFalse(vault.isDefaulted());
    }
}

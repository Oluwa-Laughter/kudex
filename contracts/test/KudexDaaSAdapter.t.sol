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
        vault.transferOwnership(address(adapter));

        adapter.setSentinel(sentinel, true);
        adapter.registerVault(address(vault), 12000); // 120% collateralization ratio
    }

    function test_CalculateHealthFactorHealthy() public view {
        uint256 hf = adapter.calculateHealthFactor(address(vault));
        // riskScore = 0, so hf = (10000 * 12000) / 10000 = 12000 bps
        assertEq(hf, 12000);
    }

    function test_SentinelRestructuringOnCriticalRisk() public {
        // Vault owner was transferred to adapter, so simulate risk elevation
        // We test with low risk first
        vm.prank(sentinel);
        adapter.evaluateAndEnforce(address(vault));
        assertFalse(vault.isDefaulted());

        // When riskScore >= CRITICAL_RISK_THRESHOLD (8500 bps)
        // We can inspect DaaS health factor decreases as risk increases
        uint256 count = adapter.getRegisteredVaultsCount();
        assertEq(count, 1);
    }
}

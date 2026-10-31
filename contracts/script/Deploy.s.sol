// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexDaaSAdapter} from "../src/KudexDaaSAdapter.sol";
import {KudexTestToken} from "../src/KudexTestToken.sol";
import {Groth16Verifier} from "../src/verifiers/Groth16Verifier.sol";

contract DeployKudex is Script {
    function run() external {
        require(
            block.chainid == 420420777 && block.chainid == vm.envUint("PORTALDOT_CHAIN_ID"),
            "Unexpected deployment chain"
        );
        string memory assetValue = vm.envOr("PORTALDOT_COLLATERAL_ADDRESS", string(""));
        address asset = bytes(assetValue).length == 0 ? address(0) : vm.parseAddress(assetValue);
        bool useTestAsset = vm.envOr("KUDEX_DEPLOY_TEST_ASSET", false);
        require(asset != address(0) || useTestAsset, "Provide collateral or explicitly enable test token");
        if (asset != address(0)) require(asset.code.length > 0, "Collateral is not deployed");

        // Sign using Foundry's --account/--sender or hardware-wallet support.
        // No private key is read from an environment file by this script.
        vm.startBroadcast();
        if (asset == address(0)) {
            asset = address(new KudexTestToken());
            console2.log("KudexTestToken (unbacked test collateral):", asset);
        }
        Groth16Verifier verifier = new Groth16Verifier();
        KudexVault vault = new KudexVault(IERC20(asset), "Kudex Public Treasury Vault", "kVAULT", address(verifier));
        KudexRFQMarket router = new KudexRFQMarket();
        KudexDaaSAdapter adapter = new KudexDaaSAdapter(address(vault));
        vault.setDefaultController(address(adapter));
        router.setFeeRouting(address(vault), address(adapter));
        console2.log("Collateral:", asset);
        console2.log("Disabled privacy verifier:", address(verifier));
        console2.log("Public vault:", address(vault));
        console2.log("Signed RFQ router:", address(router));
        console2.log("Risk adapter:", address(adapter));
        vm.stopBroadcast();
    }
}

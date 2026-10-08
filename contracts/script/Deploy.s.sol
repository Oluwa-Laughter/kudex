// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexDaaSAdapter} from "../src/KudexDaaSAdapter.sol";
import {Groth16Verifier} from "../src/verifiers/Groth16Verifier.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock collateral asset for initial testnet liquidity if native Portaldot USDC does not exist yet
contract MockUSDC is ERC20 {
    constructor() ERC20("Portaldot USD Coin", "pUSDC") {
        _mint(msg.sender, 10_000_000 * 10**6);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract DeployKudex is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PORTALDOT_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Testnet Base Asset (if needed)
        MockUSDC usdc = new MockUSDC();
        console2.log("Mock USDC Deployed at:", address(usdc));

        // 2. Deploy Cryptographic ZK Verifier
        Groth16Verifier verifier = new Groth16Verifier();
        console2.log("Groth16 Verifier Deployed at:", address(verifier));

        // 3. Deploy Kudex ERC-4626 Shielded Vault
        KudexVault vault = new KudexVault(
            usdc,
            "Kudex Shielded Treasury Vault",
            "kUSDp",
            address(verifier)
        );
        console2.log("KudexVault Deployed at:", address(vault));

        // 4. Deploy Kudex RFQ Market Router
        KudexRFQMarket rfqMarket = new KudexRFQMarket();
        console2.log("KudexRFQMarket Deployed at:", address(rfqMarket));

        // 5. Deploy Default-as-a-Service Risk Adapter
        KudexDaaSAdapter daasAdapter = new KudexDaaSAdapter(address(vault));
        console2.log("KudexDaaSAdapter Deployed at:", address(daasAdapter));

        vm.stopBroadcast();
    }
}

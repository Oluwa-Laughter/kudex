// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexDaaSAdapter} from "../src/KudexDaaSAdapter.sol";
import {Groth16Verifier} from "../src/verifiers/Groth16Verifier.sol";

// Diagnostic assets are instantiated only in an eth_call sandbox. They are not RWA collateral.
contract SmokeToken is ERC20 {
    constructor(string memory symbol_) ERC20(symbol_, symbol_) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SmokeMaker is IERC1271 {
    bytes32 private approved;

    function approveOrder(bytes32 digest, IERC20 token, address router) external {
        approved = digest;
        token.approve(router, 100);
    }

    function isValidSignature(bytes32 digest, bytes memory) external view returns (bytes4) {
        return digest == approved ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }
}

/// @notice Constructor executed via read-only eth_call. No broadcast or durable deployment.
/// @dev Returns a diagnostic ABI payload instead of deployed runtime code.
contract RuntimeSmoke {
    constructor() {
        SmokeToken token = new SmokeToken("SMOKE");
        Groth16Verifier verifier = new Groth16Verifier();
        KudexVault vault = new KudexVault(token, "Smoke Vault", "sVAULT", address(verifier));
        token.mint(address(this), 1000);
        token.approve(address(vault), 100);
        vault.deposit(100, address(this));
        require(vault.totalAssets() == 100, "Deposit mismatch");
        vault.withdraw(40, address(this), address(this));
        require(vault.totalAssets() == 60, "Withdrawal mismatch");

        SmokeToken quoteToken = new SmokeToken("QUOTE");
        KudexRFQMarket router = new KudexRFQMarket();
        SmokeMaker maker = new SmokeMaker();
        token.mint(address(maker), 100);
        quoteToken.mint(address(this), 50);
        quoteToken.approve(address(router), 50);
        KudexRFQMarket.Order memory order =
            KudexRFQMarket.Order(address(maker), address(token), address(quoteToken), 100, 50, block.timestamp + 60, 1);
        maker.approveOrder(router.hashOrder(order), token, address(router));
        router.fillOrder(order, "");
        require(quoteToken.balanceOf(address(maker)) == 50, "RFQ mismatch");
        require(router.nonceUsed(address(maker), 1), "Nonce not consumed");
        try router.fillOrder(order, "") {
            revert("RFQ replay accepted");
        } catch {}
        order.nonce = 2;
        try router.fillOrder(order, "") {
            revert("Unsigned RFQ accepted");
        } catch {}

        KudexDaaSAdapter adapter = new KudexDaaSAdapter(address(vault));
        vault.setDefaultController(address(adapter));
        vault.setRiskScore(8500);
        adapter.evaluateAndEnforce(address(vault));
        require(vault.isDefaulted() && vault.maxDeposit(address(this)) == 0, "Freeze failed");
        require(vault.maxWithdraw(address(this)) == 60, "Exit incorrectly frozen");
        uint256[2] memory point;
        uint256[2][2] memory b;
        require(!verifier.verifyProof(point, b, point, point), "Placeholder verifier accepted proof");
        bytes memory report =
            abi.encode(true, vault.totalAssets(), quoteToken.balanceOf(address(maker)), vault.isDefaulted());
        assembly { return(add(report, 32), mload(report)) }
    }
}

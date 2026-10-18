// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {KudexTestToken} from "../src/KudexTestToken.sol";

contract KudexTestTokenTest is Test {
    function test_FixedSupplyOnTestnet() public {
        vm.chainId(420420777);
        KudexTestToken token = new KudexTestToken();
        assertEq(token.symbol(), "KTEST");
        assertEq(token.decimals(), 6);
        assertEq(token.totalSupply(), 1_000_000e6);
        assertEq(token.balanceOf(address(this)), token.totalSupply());
    }

    function test_DeploymentRejectedOnOtherChains() public {
        vm.chainId(1);
        vm.expectRevert("Testnet only");
        new KudexTestToken();
    }
}

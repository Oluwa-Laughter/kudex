// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {RuntimeSmoke} from "../testnet/RuntimeSmoke.sol";

contract RuntimeSmokeTest is Test {
    function test_ConstructorDiagnostic() public {
        RuntimeSmoke smoke = new RuntimeSmoke();
        (bool passed, uint256 assets, uint256 makerReceived, bool frozen) =
            abi.decode(address(smoke).code, (bool, uint256, uint256, bool));
        assertTrue(passed);
        assertEq(assets, 60);
        assertEq(makerReceived, 50);
        assertTrue(frozen);
    }
}

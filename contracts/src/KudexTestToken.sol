// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Fixed-supply test collateral. No USD peg, yield or RWA backing is claimed.
/// @dev Deployment is restricted to the announced Portaldot V3 testnet.
contract KudexTestToken is ERC20 {
    constructor() ERC20("Kudex Test Collateral", "KTEST") {
        require(block.chainid == 420420777, "Testnet only");
        _mint(msg.sender, 1_000_000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

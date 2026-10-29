// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Constructor used exclusively inside eth_call; never publishes a verifier.
contract CryptoProbe {
    constructor() {
        uint256 p = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        uint256[4] memory g2 = [
            uint256(11559732032986387107991004021392285783925812861821192530917403151452391805634),
            10857046999023057135944570762232829481370756359578518086990519993285655852781,
            4082367875863433681332203403145435568316851327593401208105741076214120093531,
            8495653923123431417604973247489272438418190587263600148770280649306958101930
        ];
        bool[5] memory checks;
        (bool ok, bytes memory out) = address(6).staticcall(abi.encode(uint256(1), uint256(2), uint256(0), uint256(0)));
        checks[0] = ok && keccak256(out) == keccak256(abi.encode(uint256(1), uint256(2)));
        (ok, out) = address(7).staticcall(abi.encode(uint256(1), uint256(2), uint256(1)));
        checks[1] = ok && keccak256(out) == keccak256(abi.encode(uint256(1), uint256(2)));
        (ok, out) = address(8).staticcall(abi.encode(uint256(1), uint256(2), g2));
        checks[2] = ok && keccak256(out) == keccak256(abi.encode(uint256(0)));
        (ok, out) = address(8).staticcall(abi.encode(uint256(1), uint256(2), g2, uint256(1), p - 2, g2));
        checks[3] = ok && keccak256(out) == keccak256(abi.encode(uint256(1)));
        (ok,) = address(8).staticcall{gas: 300000}(abi.encode(uint256(1), uint256(3), g2));
        checks[4] = !ok;
        bytes memory result = abi.encode(checks);
        assembly { return(add(result, 32), mload(result)) }
    }
}

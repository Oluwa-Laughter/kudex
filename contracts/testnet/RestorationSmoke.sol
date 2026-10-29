// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {SmokeToken, SmokeMaker} from "./RuntimeSmoke.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexRfqExecutor} from "../src/KudexRfqExecutor.sol";
import {KudexTestCreditFacility as Facility} from "../src/KudexTestCreditFacility.sol";

contract SmokeDelegate {
    function fill(KudexRfqExecutor executor, bytes32 id, KudexRFQMarket.Order calldata order) external {
        executor.execute(id, order, "");
    }
}

/// @dev Ephemeral read-only constructor diagnostic. No public deployment or real assets.
contract RestorationSmoke {
    constructor() {
        _rfq();
        _credit();
        bytes memory report = abi.encode(true, true);
        assembly { return(add(report, 32), mload(report)) }
    }

    function _rfq() private {
        SmokeToken buy = new SmokeToken("DIAGNOSTIC-BUY");
        SmokeToken pay = new SmokeToken("DIAGNOSTIC-PAY");
        KudexRFQMarket router = new KudexRFQMarket();
        KudexRfqExecutor executor = new KudexRfqExecutor(router);
        SmokeMaker maker = new SmokeMaker();
        SmokeDelegate delegate = new SmokeDelegate();
        buy.mint(address(maker), 100);
        pay.mint(address(this), 50);
        bytes32 id = executor.createPolicy(
            KudexRfqExecutor.Terms(
                address(delegate),
                address(maker),
                address(buy),
                address(pay),
                uint64(block.timestamp + 1 hours),
                2,
                1,
                50,
                50,
                50
            )
        );
        pay.approve(address(executor), 50);
        KudexRFQMarket.Order memory order =
            KudexRFQMarket.Order(address(maker), address(buy), address(pay), 100, 50, block.timestamp + 60, 1);
        maker.approveOrder(router.hashOrder(order), buy, address(router));
        delegate.fill(executor, id, order);
        require(buy.balanceOf(address(this)) == 100 && pay.balanceOf(address(maker)) == 50, "Exact RFQ failure");
        require(
            executor.policy(id).spent == 50 && pay.allowance(address(executor), address(router)) == 0,
            "Budget/allowance failure"
        );
        require(buy.balanceOf(address(executor)) == 0 && pay.balanceOf(address(executor)) == 0, "Unexpected custody");
        executor.revokePolicy(id);
        require(executor.policy(id).revoked, "Revocation failed");
    }

    function _credit() private {
        SmokeToken token = new SmokeToken("DIAGNOSTIC-CREDIT");
        Facility facility = new Facility(
            token,
            address(this),
            address(this),
            keccak256("unbacked diagnostic"),
            600,
            400,
            uint64(block.timestamp + 1 hours),
            uint64(block.timestamp + 2 hours),
            0
        );
        token.mint(address(this), 1000);
        token.approve(address(facility), 2000);
        facility.setEligibility(address(this), true);
        facility.subscribe(true, 600);
        facility.subscribe(false, 400);
        facility.disburse();
        facility.repay(300);
        require(
            facility.claimable(address(this), true) == 300 && facility.claimable(address(this), false) == 0,
            "Seniority failure"
        );
        facility.repay(700);
        facility.claim(true);
        facility.claim(false);
        require(
            facility.totalClaimed() == 1000 && token.balanceOf(address(facility)) == 0
                && uint256(facility.state()) == 3,
            "Credit conservation failure"
        );
    }
}

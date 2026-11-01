// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexDaaSAdapter} from "../src/KudexDaaSAdapter.sol";
import {KudexInvoiceEscrow} from "../src/KudexInvoiceEscrow.sol";
import {KudexBusinessRegistry} from "../src/KudexBusinessRegistry.sol";
import {KudexPOTStaking} from "../src/KudexPOTStaking.sol";
import {Groth16Verifier} from "../src/verifiers/Groth16Verifier.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract KudexPortaldotPrimitivesTest is Test {
    uint256 internal constant ONE_POT = 10 ** 14;
    uint256 internal constant HUNDRED_POT = 100 * ONE_POT;

    KudexVault internal vault;
    KudexRFQMarket internal router;
    KudexDaaSAdapter internal adapter;
    KudexInvoiceEscrow internal escrow;
    KudexBusinessRegistry internal registry;
    KudexPOTStaking internal potStaking;
    Groth16Verifier internal verifier;
    MockERC20 internal pusd;
    MockERC20 internal wdot;

    uint256 internal makerPk = 0xA11CE;
    address internal maker;
    address internal taker = address(0xB0B);
    address internal vendor = address(0xCAFE);
    address internal payer = address(0xD00D);
    address internal cfo = address(0xCF01);
    address internal ceo = address(0xCE02);
    address internal sentinel = address(0x5E77);

    function setUp() public {
        maker = vm.addr(makerPk);

        pusd = new MockERC20("Portaldot USD", "pUSD", 6);
        wdot = new MockERC20("Wrapped DOT", "wDOT", 10);
        verifier = new Groth16Verifier();

        vault = new KudexVault(pusd, "Kudex Treasury Vault", "kPUSD", address(verifier));
        router = new KudexRFQMarket();
        adapter = new KudexDaaSAdapter(address(vault));
        potStaking = new KudexPOTStaking(address(pusd));
        registry = new KudexBusinessRegistry();
        escrow = new KudexInvoiceEscrow(address(vault), address(adapter), address(potStaking));

        vault.setDefaultController(address(adapter));
        adapter.setSentinel(sentinel, true);
        router.setFeeRouting(address(vault), address(adapter));
        router.setPotStaking(address(potStaking), 1_000); // 10% of collected fees to POT stakers

        // Seed initial vault depositor so share value appreciation is measurable
        pusd.mint(address(this), 50_000e6);
        pusd.approve(address(vault), 50_000e6);
        vault.deposit(50_000e6, address(this));
    }

    function _signOrder(KudexRFQMarket.Order memory order) internal view returns (bytes memory) {
        bytes32 digest = router.hashOrder(order);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_BusinessRegistryUniqueLookupUpdateAndRename() public {
        bytes32 regHash = keccak256("PORTALDOT-CORP-90210");

        vm.prank(vendor);
        registry.registerBusiness("Northstar Logistics LLC", "Logistics & Freight", regHash, vendor);

        (KudexBusinessRegistry.BusinessProfile memory resolved, address ownerAddr) =
            registry.resolveBusinessByName("  northstar logistics llc  ");
        assertEq(ownerAddr, vendor);
        assertEq(resolved.payoutAddress, vendor);
        assertEq(resolved.category, "Logistics & Freight");
        assertTrue(resolved.active);

        // Another account cannot claim the same handle (even with different casing)
        vm.prank(payer);
        vm.expectRevert(KudexBusinessRegistry.BusinessNameAlreadyTaken.selector);
        registry.registerBusiness("NORTHSTAR LOGISTICS LLC", "Supplier", bytes32(0), payer);

        // Vendor renames company and updates payout wallet; old name becomes available
        address treasuryWallet = address(0x7777);
        vm.prank(vendor);
        registry.updateBusiness(
            "Northstar Global Freight",
            "Global Supply Chain",
            regHash,
            treasuryWallet,
            true
        );

        (bool oldFound,,) = registry.tryResolveBusinessByName("Northstar Logistics LLC");
        assertFalse(oldFound);

        (bool newFound, address newOwner, KudexBusinessRegistry.BusinessProfile memory updated) =
            registry.tryResolveBusinessByName("Northstar Global Freight");
        assertTrue(newFound);
        assertEq(newOwner, vendor);
        assertEq(updated.payoutAddress, treasuryWallet);
    }

    function test_InvoiceEscrowMultiApproverSignOffAndDirectSettlement() public {
        address[] memory approvers = new address[](2);
        approvers[0] = cfo;
        approvers[1] = ceo;

        bytes32 encRef = keccak256("INV-2026-11-Q4-HARDWARE");
        uint256 amount = 10_000e6;

        vm.prank(vendor);
        bytes32 invoiceId = escrow.createInvoice(
            bytes32(0),
            payer,
            address(pusd),
            amount,
            block.timestamp + 30 days,
            encRef,
            approvers
        );

        KudexInvoiceEscrow.Invoice memory inv = escrow.getInvoice(invoiceId);
        assertEq(uint8(inv.status), uint8(KudexInvoiceEscrow.InvoiceStatus.Pending));
        assertEq(inv.approvalCount, 0);

        pusd.mint(payer, amount);
        vm.prank(payer);
        pusd.approve(address(escrow), amount);

        // Cannot pay before CFO + CEO sign off
        vm.prank(payer);
        vm.expectRevert(KudexInvoiceEscrow.ApprovalsIncomplete.selector);
        escrow.payInvoice(invoiceId);

        // CFO approves (1 of 2)
        vm.prank(cfo);
        escrow.approveInvoice(invoiceId);
        assertEq(uint8(escrow.getInvoice(invoiceId).status), uint8(KudexInvoiceEscrow.InvoiceStatus.Pending));

        // CEO approves (2 of 2 -> Approved)
        vm.prank(ceo);
        escrow.approveInvoice(invoiceId);
        assertEq(uint8(escrow.getInvoice(invoiceId).status), uint8(KudexInvoiceEscrow.InvoiceStatus.Approved));

        // Payer settles invoice in 1 click (10 bps fee = 10 USDC: 1 USDC POT stakers, 7 USDC Vault, 2 USDC Reserve)
        vm.prank(payer);
        escrow.payInvoice(invoiceId);

        assertEq(uint8(escrow.getInvoice(invoiceId).status), uint8(KudexInvoiceEscrow.InvoiceStatus.Settled));
        assertEq(pusd.balanceOf(vendor), 9_990e6);
        assertEq(adapter.getReserveBalance(address(pusd)), 2e6);
        assertEq(vault.totalYieldDistributed(), 7e6);
        assertEq(potStaking.totalRewardsDistributed(), 1e6);
    }

    function test_InvoiceEscrowConfidentialSettlementViaVault() public {
        address[] memory noApprovers = new address[](0);
        uint256 amount = 5_000e6;

        vm.prank(vendor);
        bytes32 invoiceId = escrow.createInvoice(
            bytes32(0),
            payer,
            address(pusd),
            amount,
            block.timestamp + 14 days,
            keccak256("STEALTH-INV-01"),
            noApprovers
        );

        pusd.mint(payer, amount);
        vm.prank(payer);
        pusd.approve(address(escrow), amount);

        bytes32 commitment = keccak256("CONFIDENTIAL-INVOICE-COMMITMENT-1");
        bytes memory memo = hex"01020304aabbccdd";

        vm.prank(payer);
        escrow.payInvoiceConfidential(invoiceId, commitment, memo);

        assertTrue(vault.commitments(commitment));
        assertGt(vault.balanceOf(vendor), 0);
        assertEq(uint8(escrow.getInvoice(invoiceId).status), uint8(KudexInvoiceEscrow.InvoiceStatus.Settled));
    }

    function test_PotStaking14DecimalFeeWaiverAndRewardsInRfqAndInvoices() public {
        address staker = address(0x57A4E);
        vm.deal(staker, 500 * ONE_POT);
        vm.deal(taker, 500 * ONE_POT);

        // Staker locks 200 POT (14 decimals) to earn protocol revenue
        vm.prank(staker);
        potStaking.stakePOT{value: 200 * ONE_POT}();
        assertTrue(potStaking.qualifiesForFeeWaiver(staker));

        // Taker stakes 99.99 POT (< 100 * 10^14) -> does NOT qualify for fee waiver yet
        vm.prank(taker);
        potStaking.stakePOT{value: HUNDRED_POT - 1}();
        assertFalse(potStaking.qualifiesForFeeWaiver(taker));
        assertEq(router.effectiveFeeBps(maker, taker), 10);

        // Trade #1: Standard 10 bps fee applies, routing revenue to stakers + vault + reserve
        wdot.mint(maker, 2_000e10);
        pusd.mint(taker, 20_000e6);
        vm.prank(maker);
        wdot.approve(address(router), type(uint256).max);
        vm.prank(taker);
        pusd.approve(address(router), type(uint256).max);

        KudexRFQMarket.Order memory order1 = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(wdot),
            tokenOut: address(pusd),
            amountIn: 1_000e10,
            amountOut: 10_000e6,
            deadline: block.timestamp + 1 hours,
            nonce: 1
        });
        bytes memory sig1 = _signOrder(order1);
        vm.prank(taker);
        router.fillOrder(order1, sig1);

        // 10 bps of 10,000 pUSD = 10 pUSD fee -> maker got 9,990 pUSD
        assertEq(pusd.balanceOf(maker), 9_990e6);
        assertGt(potStaking.claimableRewards(staker), 0);

        // Staker claims pUSD protocol rewards
        uint256 stakerBefore = pusd.balanceOf(staker);
        vm.prank(staker);
        uint256 claimed = potStaking.claimRewards();
        assertEq(pusd.balanceOf(staker) - stakerBefore, claimed);
        assertGt(claimed, 0);

        // Taker adds 1 base unit of POT -> reaches exact 100 * 10^14 threshold -> 0 bps Fee-Free!
        vm.prank(taker);
        potStaking.stakePOT{value: 1}();
        assertEq(potStaking.stakedBalanceOf(taker), HUNDRED_POT);
        assertTrue(potStaking.qualifiesForFeeWaiver(taker));
        assertEq(router.effectiveFeeBps(maker, taker), 0);

        // Trade #2: 0 bps Fee-Free settlement! Maker receives full 10,000 pUSD
        KudexRFQMarket.Order memory order2 = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(wdot),
            tokenOut: address(pusd),
            amountIn: 1_000e10,
            amountOut: 10_000e6,
            deadline: block.timestamp + 1 hours,
            nonce: 2
        });
        bytes memory sig2 = _signOrder(order2);
        vm.prank(taker);
        router.fillOrder(order2, sig2);
        assertEq(pusd.balanceOf(maker), 19_990e6);

        // Invoice paid by POT-staked taker also settles at 0 bps fee!
        address[] memory noApprovers = new address[](0);
        vm.prank(vendor);
        bytes32 invId = escrow.createInvoice(
            bytes32(0),
            taker,
            address(pusd),
            1_500e6,
            block.timestamp + 7 days,
            keccak256("FEE-FREE-INV"),
            noApprovers
        );
        pusd.mint(taker, 1_500e6);
        vm.prank(taker);
        pusd.approve(address(escrow), 1_500e6);
        vm.prank(taker);
        escrow.payInvoice(invId);
        assertEq(pusd.balanceOf(vendor), 1_500e6);

        // Taker unstakes 50 POT and drops back below threshold
        uint256 nativeBefore = taker.balance;
        vm.prank(taker);
        potStaking.unstakePOT(50 * ONE_POT);
        assertEq(taker.balance - nativeBefore, 50 * ONE_POT);
        assertFalse(potStaking.qualifiesForFeeWaiver(taker));
    }

    function test_FiveStageDaaSLifecycleAndProRataRecoveryClaim() public {
        address alice = address(0xA11CE01);
        address bob = address(0xB0B02);

        // Remove setUp's seed shares so Alice (60%) and Bob (40%) are the exact depositors
        vault.redeem(vault.balanceOf(address(this)), address(this), address(this));
        assertEq(vault.totalSupply(), 0);

        pusd.mint(alice, 6_000e6);
        vm.startPrank(alice);
        pusd.approve(address(vault), 6_000e6);
        uint256 aliceShares = vault.deposit(6_000e6, alice);
        vm.stopPrank();

        pusd.mint(bob, 4_000e6);
        vm.startPrank(bob);
        pusd.approve(address(vault), 4_000e6);
        uint256 bobShares = vault.deposit(4_000e6, bob);
        vm.stopPrank();

        // Fund the Payment Protection Reserve with 2,000 pUSD
        pusd.mint(address(this), 2_000e6);
        pusd.approve(address(adapter), 2_000e6);
        adapter.fundReserve(address(pusd), 2_000e6);
        assertEq(adapter.getReserveBalance(address(pusd)), 2_000e6);

        // Risk crosses threshold (90%)
        vault.setRiskScore(9_000);

        // Stage 1: Triggered
        vm.prank(sentinel);
        adapter.triggerDaaS(address(vault), keccak256("MISSED-OBLIGATION-42"));
        assertEq(uint8(adapter.getDaaSRecoveryState(address(vault)).stage), 1);

        // Stage 2: Validated
        vm.prank(sentinel);
        assertEq(adapter.advanceDaaSStage(address(vault)), 2);

        // Stage 3: AssetsControlled (Vault frozen)
        vm.prank(sentinel);
        assertEq(adapter.advanceDaaSStage(address(vault)), 3);
        assertTrue(vault.isDefaulted());
        assertEq(vault.maxDeposit(alice), 0);

        // Stage 4: LossAllocated (2,000 pUSD safety reserve committed)
        vm.prank(sentinel);
        assertEq(adapter.advanceDaaSStage(address(vault)), 4);
        assertEq(adapter.getDaaSRecoveryState(address(vault)).reserveCommitted, 2_000e6);
        assertEq(adapter.getReserveBalance(address(pusd)), 0);

        // Stage 5: RecoveryActive
        vm.prank(sentinel);
        assertEq(adapter.advanceDaaSStage(address(vault)), 5);

        // Alice claims 60% -> 6,000 vault + 1,200 reserve = 7,200 pUSD
        vm.startPrank(alice);
        vault.approve(address(adapter), aliceShares);
        uint256 aliceRecovered = adapter.claimRecoveryShare(aliceShares);
        vm.stopPrank();
        assertEq(aliceRecovered, 7_200e6);
        assertEq(pusd.balanceOf(alice), 7_200e6);

        // Bob claims 40% -> 4,000 vault + 800 reserve = 4,800 pUSD
        vm.startPrank(bob);
        vault.approve(address(adapter), bobShares);
        uint256 bobRecovered = adapter.claimRecoveryShare(address(vault), bobShares);
        vm.stopPrank();
        assertEq(bobRecovered, 4_800e6);
        assertEq(pusd.balanceOf(bob), 4_800e6);

        assertEq(vault.totalSupply(), 0);
        assertEq(adapter.getDaaSRecoveryState(address(vault)).snapshotShares, 0);
    }

    function testFuzz_PotStakeThresholdAndExactWaiver(uint96 rawStake) public {
        uint256 stakeAmt = bound(uint256(rawStake), 1, 5_000 * ONE_POT);
        address user = address(0xF022);
        vm.deal(user, stakeAmt);

        vm.prank(user);
        potStaking.stakePOT{value: stakeAmt}();

        if (stakeAmt >= HUNDRED_POT) {
            assertTrue(potStaking.qualifiesForFeeWaiver(user));
            assertEq(router.effectiveFeeBps(maker, user), 0);
        } else {
            assertFalse(potStaking.qualifiesForFeeWaiver(user));
            assertEq(router.effectiveFeeBps(maker, user), 10);
        }
    }

    function testFuzz_FiveStageDaaSRecoveryProRataConservation(
        uint96 rawA,
        uint96 rawB,
        uint96 rawReserve
    ) public {
        uint256 depA = bound(uint256(rawA), 1e6, 10_000_000e6);
        uint256 depB = bound(uint256(rawB), 1e6, 10_000_000e6);
        uint256 reserveAmt = bound(uint256(rawReserve), 1e6, 5_000_000e6);

        vault.redeem(vault.balanceOf(address(this)), address(this), address(this));

        address userA = address(0x1111);
        address userB = address(0x2222);

        pusd.mint(userA, depA);
        vm.startPrank(userA);
        pusd.approve(address(vault), depA);
        uint256 sharesA = vault.deposit(depA, userA);
        vm.stopPrank();

        pusd.mint(userB, depB);
        vm.startPrank(userB);
        pusd.approve(address(vault), depB);
        uint256 sharesB = vault.deposit(depB, userB);
        vm.stopPrank();

        pusd.mint(address(this), reserveAmt);
        pusd.approve(address(adapter), reserveAmt);
        adapter.fundReserve(address(pusd), reserveAmt);

        vault.setRiskScore(9_500);
        vm.startPrank(sentinel);
        adapter.advanceDaaSStage(address(vault)); // 1
        adapter.advanceDaaSStage(address(vault)); // 2
        adapter.advanceDaaSStage(address(vault)); // 3
        adapter.advanceDaaSStage(address(vault)); // 4
        adapter.advanceDaaSStage(address(vault)); // 5
        vm.stopPrank();

        vm.startPrank(userA);
        vault.approve(address(adapter), sharesA);
        uint256 outA = adapter.claimRecoveryShare(sharesA);
        vm.stopPrank();

        vm.startPrank(userB);
        vault.approve(address(adapter), sharesB);
        uint256 outB = adapter.claimRecoveryShare(sharesB);
        vm.stopPrank();

        assertEq(outA + outB, depA + depB + reserveAmt);
        assertEq(pusd.balanceOf(userA) + pusd.balanceOf(userB), depA + depB + reserveAmt);
    }
}

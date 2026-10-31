// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KudexVault, IGroth16Verifier} from "../src/KudexVault.sol";
import {KudexRFQMarket} from "../src/KudexRFQMarket.sol";
import {KudexDaaSAdapter} from "../src/KudexDaaSAdapter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract AcceptingNoteVerifier is IGroth16Verifier {
    bool public accept = true;

    function setAccept(bool value) external {
        accept = value;
    }

    function verifyProof(uint256[2] calldata, uint256[2][2] calldata, uint256[2] calldata, uint256[2] calldata)
        external
        view
        returns (bool)
    {
        return accept;
    }
}

contract KudexProductionUpgradesTest is Test {
    KudexVault public vault;
    KudexRFQMarket public market;
    KudexDaaSAdapter public adapter;
    AcceptingNoteVerifier public verifier;
    MockERC20 public usdc;
    MockERC20 public wpot;

    uint256 private constant MAKER_KEY = 0xA11CE;
    address public maker;
    address public taker = address(0x20);
    address public depositor = address(0x30);
    address public payrollSender = address(0x40);

    function setUp() public {
        maker = vm.addr(MAKER_KEY);
        verifier = new AcceptingNoteVerifier();
        usdc = new MockERC20("USD Coin", "USDC", 6);
        wpot = new MockERC20("Wrapped POT", "wPOT", 18);

        vault = new KudexVault(usdc, "Kudex Short-Term Treasury Vault", "kUSDC", address(verifier));
        adapter = new KudexDaaSAdapter(address(vault));
        market = new KudexRFQMarket();

        vault.setDefaultController(address(adapter));
        vault.setConfidentialNoteCircuitEnabled(true);
        market.setFeeRouting(address(vault), address(adapter));

        usdc.mint(depositor, 5_000_000e6);
        usdc.mint(payrollSender, 5_000_000e6);
        usdc.mint(taker, 5_000_000e6);
        usdc.mint(maker, 5_000_000e6);
        wpot.mint(maker, 5_000_000e18);
        wpot.mint(taker, 5_000_000e18);

        vm.prank(depositor);
        usdc.approve(address(vault), type(uint256).max);

        vm.prank(payrollSender);
        usdc.approve(address(vault), type(uint256).max);

        vm.prank(maker);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(maker);
        wpot.approve(address(market), type(uint256).max);

        vm.prank(taker);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(taker);
        wpot.approve(address(market), type(uint256).max);
    }

    function test_ShieldDepositEmitsEncryptedNoteSynced() public {
        bytes32 commitment = keccak256("encrypted-note-1");
        bytes memory ciphertext = hex"01aabbccddeeff00112233445566778899aabbccddeeff";
        address recipient = address(0xBEEF);

        vm.expectEmit(true, true, false, true, address(vault));
        emit KudexVault.EncryptedNoteSynced(recipient, commitment, ciphertext, block.timestamp);

        vm.prank(payrollSender);
        uint256 shares = vault.shieldDeposit(2_500e6, commitment, recipient, ciphertext);

        assertEq(shares, 2_500e6);
        assertTrue(vault.commitments(commitment));
        assertEq(vault.balanceOf(recipient), 2_500e6);
    }

    function test_ConfidentialTransferWithEncryptedMemoEmitsSyncEvent() public {
        bytes32 nullifier = keccak256("spend-nullifier-1");
        bytes32 newCommitment = keccak256("new-stealth-commitment-1");
        bytes memory ciphertext = hex"0102030405060708090a0b0c0d0e0f1011121314";

        uint256[2] memory a = [uint256(1), uint256(2)];
        uint256[2][2] memory b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory c = [uint256(7), uint256(8)];
        uint256[2] memory inputs = [uint256(nullifier), uint256(newCommitment)];

        vm.expectEmit(true, true, false, true, address(vault));
        emit KudexVault.EncryptedNoteSynced(depositor, newCommitment, ciphertext, block.timestamp);

        vm.prank(depositor);
        vault.confidentialTransfer(nullifier, newCommitment, a, b, c, inputs, ciphertext);

        assertTrue(vault.nullifiers(nullifier));
        assertTrue(vault.commitments(newCommitment));

        // Double spend must revert
        bytes32 replayCommitment = keccak256("replay-commitment");
        uint256[2] memory replayInputs = [uint256(nullifier), uint256(replayCommitment)];
        vm.prank(depositor);
        vm.expectRevert(KudexVault.NullifierAlreadySpent.selector);
        vault.confidentialTransfer(nullifier, replayCommitment, a, b, c, replayInputs, ciphertext);
    }

    function test_BatchShieldDepositUpToFiftyRecipientsAndRejectsFiftyOne() public {
        KudexVault.BatchShieldItem[] memory items = new KudexVault.BatchShieldItem[](50);
        uint256 expectedTotal = 0;

        for (uint256 i = 0; i < 50; ++i) {
            uint256 amount = (i + 1) * 100e6;
            expectedTotal += amount;
            items[i] = KudexVault.BatchShieldItem({
                assets: amount,
                commitment: keccak256(abi.encodePacked("payroll-batch-", i)),
                receiver: address(uint160(0x1000 + i)),
                encryptedMemo: abi.encodePacked(uint8(1), bytes12(uint96(i + 1)), "encrypted-payroll-memo")
            });
        }

        vm.prank(payrollSender);
        uint256 totalShares = vault.batchShieldDeposit(items);

        assertEq(totalShares, expectedTotal);
        assertEq(vault.totalAssets(), expectedTotal);
        assertTrue(vault.commitments(items[0].commitment));
        assertTrue(vault.commitments(items[49].commitment));
        assertEq(vault.balanceOf(address(0x1000)), 100e6);

        // Batch of 0 or 51 must revert with BatchSizeInvalid
        KudexVault.BatchShieldItem[] memory empty = new KudexVault.BatchShieldItem[](0);
        vm.prank(payrollSender);
        vm.expectRevert(KudexVault.BatchSizeInvalid.selector);
        vault.batchShieldDeposit(empty);

        KudexVault.BatchShieldItem[] memory oversized = new KudexVault.BatchShieldItem[](51);
        vm.prank(payrollSender);
        vm.expectRevert(KudexVault.BatchSizeInvalid.selector);
        vault.batchShieldDeposit(oversized);
    }

    function testFuzz_BatchShieldDepositConservesAssets(uint8 rawCount, uint64 rawUnit) public {
        uint256 count = bound(rawCount, 1, 25);
        uint256 baseAmount = bound(rawUnit, 1e6, 5_000e6);

        KudexVault.BatchShieldItem[] memory items = new KudexVault.BatchShieldItem[](count);
        uint256 expectedTotal = 0;
        for (uint256 i = 0; i < count; ++i) {
            uint256 amt = baseAmount + i;
            expectedTotal += amt;
            items[i] = KudexVault.BatchShieldItem({
                assets: amt,
                commitment: keccak256(abi.encodePacked("fuzz-batch", count, baseAmount, i)),
                receiver: address(uint160(0x5000 + i)),
                encryptedMemo: hex"01aa"
            });
        }

        uint256 beforeSender = usdc.balanceOf(payrollSender);
        vm.prank(payrollSender);
        uint256 mintedShares = vault.batchShieldDeposit(items);

        assertEq(mintedShares, expectedTotal);
        assertEq(usdc.balanceOf(payrollSender), beforeSender - expectedTotal);
        assertEq(vault.totalAssets(), expectedTotal);
    }

    function test_BatchConfidentialTransferAtomicExecutionAndRollback() public {
        KudexVault.BatchConfidentialItem[] memory items = new KudexVault.BatchConfidentialItem[](5);
        uint256[2] memory a = [uint256(1), uint256(2)];
        uint256[2][2] memory b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        uint256[2] memory c = [uint256(7), uint256(8)];

        for (uint256 i = 0; i < 5; ++i) {
            bytes32 nul = keccak256(abi.encodePacked("batch-nul-", i));
            bytes32 com = keccak256(abi.encodePacked("batch-com-", i));
            items[i] = KudexVault.BatchConfidentialItem({
                nullifier: nul,
                newCommitment: com,
                a: a,
                b: b,
                c: c,
                publicInputs: [uint256(nul), uint256(com)],
                noteOwner: address(uint160(0x2000 + i)),
                encryptedMemo: hex"01bbccdd"
            });
        }

        vm.prank(payrollSender);
        vault.batchConfidentialTransfer(items);

        for (uint256 i = 0; i < 5; ++i) {
            assertTrue(vault.nullifiers(items[i].nullifier));
            assertTrue(vault.commitments(items[i].newCommitment));
        }

        // Duplicate nullifier in batch rolls back entire batch
        KudexVault.BatchConfidentialItem[] memory badBatch = new KudexVault.BatchConfidentialItem[](2);
        bytes32 freshNul = keccak256("fresh-nul");
        bytes32 freshCom = keccak256("fresh-com");
        badBatch[0] = KudexVault.BatchConfidentialItem({
            nullifier: freshNul,
            newCommitment: freshCom,
            a: a,
            b: b,
            c: c,
            publicInputs: [uint256(freshNul), uint256(freshCom)],
            noteOwner: payrollSender,
            encryptedMemo: hex"01ee"
        });
        badBatch[1] = items[0]; // already spent nullifier

        vm.prank(payrollSender);
        vm.expectRevert(KudexVault.NullifierAlreadySpent.selector);
        vault.batchConfidentialTransfer(badBatch);
        assertFalse(vault.nullifiers(freshNul));
        assertFalse(vault.commitments(freshCom));
    }

    function test_RfqProtocolFeeRoutes80ToVaultAnd20ToProtectionReserve() public {
        // 1. Depositor deposits $10,000 USDC into KudexVault
        vm.prank(depositor);
        uint256 depositorShares = vault.deposit(10_000e6, depositor);
        assertEq(depositorShares, 10_000e6);
        assertEq(vault.exchangeRatePerShare(), 1e6); // 1.000000 USDC per share

        // 2. RFQ trade settles for $100,000 USDC (10 bps = $100 fee -> $80 to Vault, $20 to Protection Reserve)
        KudexRFQMarket.Order memory order = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(wpot),
            tokenOut: address(usdc),
            amountIn: 50_000e18,
            amountOut: 100_000e6,
            deadline: block.timestamp + 1 hours,
            nonce: 101
        });
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(MAKER_KEY, market.hashOrder(order));

        uint256 makerUsdcBefore = usdc.balanceOf(maker);
        vm.prank(taker);
        market.fillOrder(order, abi.encodePacked(r, s, v));

        // Total fee = 100 USDC (100e6): 80 USDC to Vault, 20 USDC to DaaS Protection Reserve
        assertEq(vault.totalYieldDistributed(), 80e6);
        assertEq(vault.totalAssets(), 10_080e6);
        assertEq(adapter.reserveBalances(address(usdc)), 20e6);
        assertEq(adapter.getReserveBalance(address(usdc)), 20e6);
        assertEq(usdc.balanceOf(maker) - makerUsdcBefore, 99_900e6);

        // Vault share price increased above 1.000000 USDC!
        assertGt(vault.exchangeRatePerShare(), 1e6);

        // Depositor redeems all shares and receives initial $10,000 + distributed yield!
        uint256 depositorUsdcBefore = usdc.balanceOf(depositor);
        vm.prank(depositor);
        uint256 redeemed = vault.redeem(depositorShares, depositor, depositor);
        assertGt(redeemed, 10_000e6);
        assertApproxEqAbs(redeemed, 10_080e6, 1);
        assertEq(usdc.balanceOf(depositor) - depositorUsdcBefore, redeemed);
    }

    function testFuzz_ProtocolFeeRoutingIncreasesDepositorShareValue(uint96 rawDeposit, uint96 rawTrade, uint16 rawBps)
        public
    {
        uint256 depositAmt = bound(rawDeposit, 100e6, 500_000e6);
        uint256 tradeAmt = bound(rawTrade, 1_000e6, 1_000_000e6);
        uint256 feeBps = bound(rawBps, 5, 100); // 5 bps to 100 bps

        market.setProtocolFeeBps(feeBps);

        vm.prank(depositor);
        uint256 shares = vault.deposit(depositAmt, depositor);
        uint256 rateBefore = vault.convertToAssets(shares);

        KudexRFQMarket.Order memory order = KudexRFQMarket.Order({
            maker: maker,
            tokenIn: address(usdc),
            tokenOut: address(wpot),
            amountIn: tradeAmt,
            amountOut: 1_000e18,
            deadline: block.timestamp + 1 hours,
            nonce: 777
        });
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(MAKER_KEY, market.hashOrder(order));

        vm.prank(taker);
        market.fillOrder(order, abi.encodePacked(r, s, v));

        uint256 expectedTotalFee = (tradeAmt * feeBps) / 10_000;
        uint256 expectedVaultShare = (expectedTotalFee * 8_000) / 10_000;
        uint256 expectedReserveShare = expectedTotalFee - expectedVaultShare;

        assertEq(vault.totalYieldDistributed(), expectedVaultShare);
        assertEq(adapter.reserveBalances(address(usdc)), expectedReserveShare);
        assertEq(vault.totalAssets(), depositAmt + expectedVaultShare);

        uint256 rateAfter = vault.convertToAssets(shares);
        assertGt(rateAfter, rateBefore);
    }
}

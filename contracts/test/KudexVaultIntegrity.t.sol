// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {KudexVault} from "../src/KudexVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TaxAsset is MockERC20 {
    bool public tax;
    constructor() MockERC20("Tax", "TAX", 6) {}
    function setTax(bool enabled) external { tax = enabled; }
    function _update(address from, address to, uint256 value) internal override {
        if (tax && from != address(0) && to != address(0)) {
            super._update(from, address(0), value / 100);
            value -= value / 100;
        }
        super._update(from, to, value);
    }
}
contract CallbackAsset is MockERC20 {
    KudexVault public target;
    bool public depositBlocked;
    bool public redemptionBlocked;
    constructor() MockERC20("Callback", "CB", 6) {}
    function setTarget(KudexVault vault) external { target = vault; }
    function _update(address from, address to, uint256 amount) internal override {
        super._update(from, to, amount);
        if (address(target) == address(0) || from == address(0) || to != address(target)) return;
        try target.deposit(1, address(this)) { revert("Reentrant deposit accepted"); }
        catch (bytes memory reason) { depositBlocked = bytes4(reason) == bytes4(keccak256("ReentrancyGuardReentrantCall()")); }
        try target.redeem(0, address(this), address(this)) { revert("Reentrant redemption accepted"); }
        catch (bytes memory reason) { redemptionBlocked = bytes4(reason) == bytes4(keccak256("ReentrancyGuardReentrantCall()")); }
    }
}
contract VaultHandler is Test {
    KudexVault public vault;
    MockERC20 public token;
    constructor(KudexVault v, MockERC20 t) { vault = v; token = t; token.approve(address(v), type(uint256).max); }
    function deposit(uint128 raw) external {
        uint256 assets = bound(raw, 1, 1e24);
        token.mint(address(this), assets);
        vault.depositWithMinimum(assets, address(this), assets, block.timestamp);
    }
    function redeem(uint128 raw) external {
        uint256 shares = vault.balanceOf(address(this));
        if (shares == 0) return;
        shares = bound(raw, 1, shares);
        vault.redeemWithMinimum(shares, address(this), shares, block.timestamp);
    }
}
contract KudexVaultIntegrityTest is Test {
    MockERC20 token;
    KudexVault vault;
    function setUp() public {
        token = new MockERC20("Test", "TEST", 6);
        vault = new KudexVault(IERC20(address(token)), "Vault", "V", address(0));
        token.mint(address(this), 1e30);
        token.approve(address(vault), type(uint256).max);
    }
    function testFuzz_BoundedRoundTrip(uint128 raw) public {
        uint256 amount = bound(raw, 1, 1e24);
        uint256 beforeBalance = token.balanceOf(address(this));
        uint256 shares = vault.depositWithMinimum(amount, address(this), amount, block.timestamp);
        assertEq(shares, amount);
        assertEq(vault.redeemWithMinimum(shares, address(this), amount, block.timestamp), amount);
        assertEq(token.balanceOf(address(this)), beforeBalance);
        assertEq(vault.totalSupply(), 0);
    }
    function test_MinimumOutputAndExpiryRollback() public {
        vm.expectRevert(KudexVault.MinimumOutputNotMet.selector);
        vault.depositWithMinimum(100, address(this), 101, block.timestamp);
        assertEq(vault.totalAssets(), 0);
        assertEq(vault.balanceOf(address(this)), 0);
        vault.deposit(100, address(this));
        vm.expectRevert(KudexVault.MinimumOutputNotMet.selector);
        vault.redeemWithMinimum(100, address(this), 101, block.timestamp);
        assertEq(vault.balanceOf(address(this)), 100);
        vm.warp(100);
        vm.expectRevert(KudexVault.TransactionExpired.selector);
        vault.depositWithMinimum(1, address(this), 1, 99);
        vm.expectRevert(KudexVault.TransactionExpired.selector);
        vault.redeemWithMinimum(1, address(this), 1, 99);
    }
    function test_DonationCannotViolateReviewedMinimum() public {
        vault.deposit(1, address(this));
        token.transfer(address(vault), 1e12);
        vm.expectRevert(KudexVault.ZeroDepositNotAllowed.selector);
        vault.depositWithMinimum(100, address(this), 100, block.timestamp);
    }
    function test_TaxedDepositAndWithdrawalRevertAtomically() public {
        TaxAsset taxToken = new TaxAsset();
        KudexVault taxVault = new KudexVault(IERC20(address(taxToken)), "Vault", "V", address(0));
        taxToken.mint(address(this), 1000);
        taxToken.approve(address(taxVault), 1000);
        taxToken.setTax(true);
        vm.expectRevert(KudexVault.InexactAssetTransfer.selector);
        taxVault.deposit(1000, address(this));
        assertEq(taxToken.balanceOf(address(this)), 1000);
        assertEq(taxVault.totalSupply(), 0);
        taxToken.setTax(false);
        taxVault.deposit(1000, address(this));
        taxToken.setTax(true);
        vm.expectRevert(KudexVault.InexactAssetTransfer.selector);
        taxVault.redeem(1000, address(this), address(this));
        assertEq(taxVault.balanceOf(address(this)), 1000);
        assertEq(taxVault.totalAssets(), 1000);
    }
    function test_TokenCallbackCannotReenterStandardEntryPoints() public {
        CallbackAsset callback = new CallbackAsset();
        KudexVault guarded = new KudexVault(IERC20(address(callback)), "Guarded", "G", address(0));
        callback.setTarget(guarded);
        callback.mint(address(this), 1000);
        callback.approve(address(guarded), 1000);
        assertEq(guarded.depositWithMinimum(1000, address(this), 1000, block.timestamp), 1000);
        assertTrue(callback.depositBlocked());
        assertTrue(callback.redemptionBlocked());
        assertEq(guarded.totalAssets(), 1000);
        assertEq(guarded.balanceOf(address(this)), 1000);
    }
    function test_OnlyOwnerMaySetRiskOrController() public {
        vm.startPrank(address(0xbeef));
        vm.expectRevert(); vault.setRiskScore(1);
        vm.expectRevert(); vault.setDefaultController(address(1));
        vm.expectRevert(KudexVault.UnauthorizedDefaultController.selector); vault.triggerDefault();
        vm.stopPrank();
    }
}
contract VaultAccountingInvariantTest is StdInvariant, Test {
    KudexVault vault;
    VaultHandler handler;
    function setUp() public {
        MockERC20 token = new MockERC20("Test", "TEST", 6);
        vault = new KudexVault(IERC20(address(token)), "Vault", "V", address(0));
        handler = new VaultHandler(vault, token);
        targetContract(address(handler));
    }
    function invariant_AssetsMatchIssuedSharesWithoutDonations() public view {
        assertEq(vault.totalAssets(), vault.totalSupply());
        assertEq(vault.balanceOf(address(handler)), vault.totalSupply());
        assertEq(vault.convertToAssets(vault.totalSupply()), vault.totalAssets());
    }
}

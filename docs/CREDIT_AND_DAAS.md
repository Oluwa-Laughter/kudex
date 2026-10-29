# Test credit foundation and DaaS boundary

`KudexTestCreditFacility` is restricted at construction to chain 420420777. It is a
zero-interest, unbacked test model with one immutable debtor, administrator, asset and
document reference. Its senior/junior principal targets, funding deadline, maturity
and grace are fixed. An administrator permits subscriptions; this is a permission list,
not KYC, independent underwriting or verification of a document's truth.

Fully funded capital disburses once, only to the debtor, before the funding deadline.
If not disbursed by the deadline, subscriptions are individually refundable even if
eligibility was revoked. Depositors cannot transfer claims or infer redeemable vault
shares. Funding ends at disbursement, so historical tranche denominators never change.

Let R be actual cumulative repayments, S senior principal and J junior principal.
Cumulative senior allocation is min(R,S); junior allocation is max(R-S,0). An investor
can withdraw floor(allocation * subscription / trancheTarget) minus prior withdrawals.
No depositor scan, external debt seizure, yield accrual or administrator cash rescue
exists. Repayment cannot exceed S+J. Claims persist after default and eligibility
revocation. Rounding dust remains in custody; no arbitrary operator sweep is present.

After maturity+grace anyone may classify unpaid active debt as defaulted. Default does
not invent cash. Actual later repayments follow the same waterfall; full recovery
marks the facility repaid. Principal losses are observable unpaid claims, not a promise
that all investors recover. More sophisticated scheduled interest, transferable claims,
tranche voting, write-downs, collateral enforcement and restructuring remain future work.

Without donations, after disbursement `cash + totalClaimed = repaid <= S+J`.
During failed funding `cash + totalRefunded = seniorFunded + juniorFunded`.
Donations do not increase subscriptions or repayment allocation. Exact-transfer,
non-rebasing, reviewed tokens are assumed; proxy governance and hostile token callbacks
require independent review. No source code makes malicious collateral economically safe.

Portaldot's [public description](https://www.portaldot.world/) advertises DaaS; it is
not a callable deployment manifest. Runtime 3002 metadata inspected on October 29 exposed
an account-recovery pallet among name-matched candidates. Its friend/inheritor recovery
methods are not a credit-default liquidation interface. No verified DaaS contract address,
ABI, role authority, trigger/reversal semantics or callable recovery integration was
established. The existing KudexDaaSAdapter remains a locally administered risk/freeze
adapter. No assertion of native DaaS recovery is made.

Live activation needs issuer/legal rights, borrower/servicer identities, exact token
review, independent contract/economic review, constructor manifest and separately
authorized test deployment. The frontend deliberately lists no investable facilities.

# PayMemo Contracts

`BatchPayout.sol` is a minimal optional helper for Morph Hoodi demos.

The dApp MVP works with sequential wallet sends first. This contract can be deployed later when the demo needs atomic payroll or vendor payouts.

Functions:

- `batchPayETH(bytes32 batchId, address payable[] recipients, uint256[] amounts)`
- `batchPayERC20(bytes32 batchId, IERC20 token, address[] recipients, uint256[] amounts)`

Each payout emits an event that PayMemo can link back to encrypted batch metadata in the private vault.

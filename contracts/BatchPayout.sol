// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract BatchPayout {
    event EthPayout(bytes32 indexed batchId, address indexed sender, address indexed recipient, uint256 amount);
    event Erc20Payout(
        bytes32 indexed batchId,
        address indexed sender,
        address indexed token,
        address recipient,
        uint256 amount
    );

    error LengthMismatch();
    error IncorrectEthValue();
    error TransferFailed();

    function batchPayETH(bytes32 batchId, address payable[] calldata recipients, uint256[] calldata amounts)
        external
        payable
    {
        if (recipients.length != amounts.length) revert LengthMismatch();

        uint256 total;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        if (msg.value != total) revert IncorrectEthValue();

        for (uint256 i = 0; i < recipients.length; i++) {
            (bool ok,) = recipients[i].call{value: amounts[i]}("");
            if (!ok) revert TransferFailed();
            emit EthPayout(batchId, msg.sender, recipients[i], amounts[i]);
        }
    }

    function batchPayERC20(
        bytes32 batchId,
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        if (recipients.length != amounts.length) revert LengthMismatch();

        for (uint256 i = 0; i < recipients.length; i++) {
            bool ok = token.transferFrom(msg.sender, recipients[i], amounts[i]);
            if (!ok) revert TransferFailed();
            emit Erc20Payout(batchId, msg.sender, address(token), recipients[i], amounts[i]);
        }
    }
}

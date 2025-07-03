// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MutablePaymentSplitter is Ownable {
    event PayeeAdded(address account, uint256 shares);
    event PayeeRemoved(address account);
    event PaymentReleased(address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    struct Payee {
        address account;
        uint256 shares;
    }

    Payee[] private _payees;
    mapping(address => uint256) private _released;
    uint256 private _totalShares;
    uint256 private _totalReleased;

    constructor(address[] memory payees, uint256[] memory shares_) payable Ownable() {
        require(payees.length == shares_.length, "PaymentSplitter: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitter: no payees");

        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares_[i]);
        }
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function totalShares() public view returns (uint256) {
        return _totalShares;
    }

    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    function shares(address account) public view returns (uint256) {
        for (uint256 i = 0; i < _payees.length; i++) {
            if (_payees[i].account == account) {
                return _payees[i].shares;
            }
        }
        return 0;
    }

    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    function payee(uint256 index) public view returns (address) {
        return _payees[index].account;
    }

    function getPayees() public view returns (Payee[] memory) {
        return _payees;
    }

    function release(address payable account) public {
        require(shares(account) > 0, "PaymentSplitter: account has no shares");

        uint256 payment = pendingPayment(account);
        require(payment != 0, "PaymentSplitter: account is not due payment");

        _released[account] += payment;
        _totalReleased += payment;

        (bool success, ) = account.call{value: payment}("");
        require(success, "PaymentSplitter: transfer failed");

        emit PaymentReleased(account, payment);
    }

    function pendingPayment(address account) public view returns (uint256) {
        uint256 totalReceived = address(this).balance + _totalReleased;
        return (totalReceived * shares(account)) / _totalShares - _released[account];
    }

    function addPayee(address account, uint256 shares_) public onlyOwner {
        require(account != address(0), "PaymentSplitter: account is the zero address");
        require(shares_ > 0, "PaymentSplitter: shares are 0");
        require(shares(account) == 0, "PaymentSplitter: account already has shares");

        _addPayee(account, shares_);
    }

    function removePayee(address account) public {
        require(
            msg.sender == owner() || msg.sender == account,
            "PaymentSplitter: only owner or payee can remove"
        );
        require(shares(account) > 0, "PaymentSplitter: account has no shares");

        uint256 payment = pendingPayment(account);
        if (payment > 0) {
            release(payable(account));
        }

        for (uint256 i = 0; i < _payees.length; i++) {
            if (_payees[i].account == account) {
                _totalShares -= _payees[i].shares;
                _payees[i] = _payees[_payees.length - 1];
                _payees.pop();
                emit PayeeRemoved(account);
                break;
            }
        }
    }

    function _addPayee(address account, uint256 shares_) private {
        _payees.push(Payee({account: account, shares: shares_}));
        _totalShares += shares_;
        emit PayeeAdded(account, shares_);
    }
}
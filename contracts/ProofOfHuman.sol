// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract ProofOfHuman {
    ISemaphore public semaphore;
    uint256 public groupId;
    address public owner;

    mapping(uint256 => bool) public nullifierUsed;

    event HumanVerified(uint256 nullifier);
    event MemberAdded(uint256 identityCommitment);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _semaphore) {
        semaphore = ISemaphore(_semaphore);
        owner = msg.sender;
        groupId = semaphore.createGroup();
    }

    function addHuman(uint256 identityCommitment) external {
        semaphore.addMember(groupId, identityCommitment);
        emit MemberAdded(identityCommitment);
    }

    function proveHuman(ISemaphore.SemaphoreProof calldata proof) external {
        require(!nullifierUsed[proof.nullifier], "Already used");
        semaphore.validateProof(groupId, proof);
        nullifierUsed[proof.nullifier] = true;
        emit HumanVerified(proof.nullifier);
    }

    function isNullifierUsed(uint256 nullifier) external view returns (bool) {
        return nullifierUsed[nullifier];
    }
}
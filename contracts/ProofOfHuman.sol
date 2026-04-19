// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract ProofOfHuman {
    ISemaphore public semaphore;
    uint256 public groupId;
    address public owner;

    // Track which nullifiers have been used per action
    mapping(uint256 => bool) public nullifierUsed;

    event HumanVerified(uint256 nullifier);
    event MemberAdded(uint256 identityCommitment);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _semaphore, uint256 _groupId) {
        semaphore = ISemaphore(_semaphore);
        groupId = _groupId;
        owner = msg.sender;
    }

    // Issuer adds a verified human to the group
    function addHuman(uint256 identityCommitment) external onlyOwner {
        semaphore.addMember(groupId, identityCommitment);
        emit MemberAdded(identityCommitment);
    }

    // Human proves they are unique and haven't acted before
    function proveHuman(
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // Check nullifier hasn't been used
        require(!nullifierUsed[proof.nullifier], "Already used");

        // Verify the ZK proof via Semaphore
        semaphore.validateProof(groupId, proof);

        // Record nullifier
        nullifierUsed[proof.nullifier] = true;

        emit HumanVerified(proof.nullifier);
    }

    // Check if a nullifier has been used
    function isNullifierUsed(uint256 nullifier) external view returns (bool) {
        return nullifierUsed[nullifier];
    }
}
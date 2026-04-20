// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "./ProofOfHuman.sol";

contract SimpleVoting {
    ProofOfHuman public proofOfHuman;

    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        bool active;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(uint256 => bool)) public nullifierUsedForProposal;
    uint256 public proposalCount;

    event ProposalCreated(uint256 proposalId, string description);
    event VoteCast(uint256 proposalId, bool support, uint256 nullifier);

    constructor(address _proofOfHuman) {
        proofOfHuman = ProofOfHuman(_proofOfHuman);
    }

    function createProposal(string calldata description) external returns (uint256) {
        uint256 proposalId = proposalCount++;
        proposals[proposalId] = Proposal(description, 0, 0, true);
        emit ProposalCreated(proposalId, description);
        return proposalId;
    }

    function vote(
        uint256 proposalId,
        bool support,
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        require(proposals[proposalId].active, "Proposal not active");
        require(!nullifierUsedForProposal[proposalId][proof.nullifier], "Already voted");

        proofOfHuman.proveHuman(proof);

        nullifierUsedForProposal[proposalId][proof.nullifier] = true;

        if (support) {
            proposals[proposalId].yesVotes++;
        } else {
            proposals[proposalId].noVotes++;
        }

        emit VoteCast(proposalId, support, proof.nullifier);
    }

    function getResults(uint256 proposalId) external view returns (
        string memory description,
        uint256 yesVotes,
        uint256 noVotes,
        bool active
    ) {
        Proposal memory p = proposals[proposalId];
        return (p.description, p.yesVotes, p.noVotes, p.active);
    }
}
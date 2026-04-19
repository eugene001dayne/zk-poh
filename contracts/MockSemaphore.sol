// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract MockSemaphore is ISemaphore {
    mapping(uint256 => bool) public nullifiers;
    uint256 public groupCounter;

    function createGroup() external returns (uint256) {
        return 1;
    }

    function createGroup(address) external returns (uint256) {
        return 1;
    }

    function createGroup(address, uint256) external returns (uint256) {
        return 1;
    }

    function updateGroupAdmin(uint256, address) external {}

    function acceptGroupAdmin(uint256) external {}

    function updateGroupMerkleTreeDuration(uint256, uint256) external {}

    function addMember(uint256, uint256) external {}

    function addMembers(uint256, uint256[] calldata) external {}

    function updateMember(
        uint256,
        uint256,
        uint256,
        uint256[] calldata
    ) external {}

    function removeMember(
        uint256,
        uint256,
        uint256[] calldata
    ) external {}

    function validateProof(
        uint256,
        SemaphoreProof calldata proof
    ) external {
        require(!nullifiers[proof.nullifier], "Nullifier already used");
        nullifiers[proof.nullifier] = true;
    }

    function verifyProof(
        uint256,
        SemaphoreProof calldata
    ) external pure returns (bool) {
        return true;
    }
}
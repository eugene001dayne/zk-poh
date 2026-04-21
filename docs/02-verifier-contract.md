# Document 02 — The Verifier Contract Reference
## How On-Chain ZK Proof Verification Works in zk-poh

**Project:** zk-poh — Zero-Knowledge Proof of Human
**Author:** Eugene Dayne Mawuli
**GitHub:** https://github.com/eugene001dayne/zk-poh
**Status:** Live on Sepolia Testnet
**Last Updated:** April 20, 2026

---

## 0. Purpose of This Document

Document 01 explained the four components and the full flow. This document goes deeper on one specific piece: the verifier contract — how on-chain ZK proof verification actually works, what it checks, why it is trustworthy, and how a developer integrates it.

---

## 1. The Three Contracts in the Stack

When a user submits a vote, three contracts interact in sequence:

```
SimpleVoting.sol
  └── calls ProofOfHuman.sol
        └── calls Semaphore.sol (Ethereum Foundation)
              └── calls SemaphoreVerifier.sol
```

---

## 2. SemaphoreVerifier.sol — The Math

The lowest level. Contains Groth16 verification keys generated during a trusted setup ceremony.

Given a proof and public inputs, it checks whether the proof is mathematically valid using elliptic curve pairings.

**Trusted setup:** Before the verifier can work, a ceremony generates the verification keys. The secret is destroyed after the ceremony — nobody can fake a proof, and the secret no longer exists. Semaphore's trusted setup was run publicly with multiple independent participants.

**Why trust it:** Deployed at a fixed address by the Ethereum Foundation's Privacy & Scaling Explorations team. Immutable. The same verifier secures production systems like Zupass.

**Address on Sepolia:** `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8`

---

## 3. SemaphoreGroups.sol — The Membership Registry

Manages groups. Each group is a LeanIMT (Lean Incremental Merkle Tree) where each member's commitment is a leaf and the root is a single number representing the entire set.

Each group has an admin — the address that can add or remove members. In zk-poh, `ProofOfHuman` is the admin of its own group.

When a member is added, the Merkle root changes. Semaphore V4 accepts proofs generated against roots from up to 1 hour ago (the merkleTreeDuration window) — so if someone joins the group after you generate your proof but before you submit it, your proof still works.

---

## 4. Semaphore.sol — The Orchestrator

The main contract. Inherits SemaphoreGroups and adds two functions:

### verifyProof (read-only)

```solidity
function verifyProof(uint256 groupId, SemaphoreProof calldata proof) external view returns (bool)
```

Checks if a proof is valid. Does not record anything. Use for pre-flight checks.

### validateProof (state-changing)

```solidity
function validateProof(uint256 groupId, SemaphoreProof calldata proof) external
```

Does three things in sequence:
1. Checks the nullifier has not been used before in this group
2. Verifies the proof mathematically
3. Records the nullifier permanently

If any check fails, the transaction reverts. If all pass, the nullifier is saved forever.

**Address on Sepolia:** `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`

---

## 5. The SemaphoreProof Struct

```solidity
struct SemaphoreProof {
    uint256 merkleTreeDepth;    // Depth of the Merkle tree
    uint256 merkleTreeRoot;     // Root the proof was generated against
    uint256 nullifier;          // Unique identifier for this proof
    uint256 message;            // The message being signed
    uint256 scope;              // Application ID
    uint256[8] points;          // The Groth16 proof (8 field elements)
}
```

`merkleTreeDepth` and `merkleTreeRoot` — prove membership. The verifier checks the user is in the group at this root.

`nullifier` — prevents double use. Derived from identity private key and scope. Same identity + same scope = same nullifier always.

`message` — what the user is proving. In zk-poh this is the vote.

`scope` — the application ID. In zk-poh this is GROUP_ID (500). Changing scope changes nullifier — the same identity can participate in different groups without linking.

`points` — the actual cryptographic proof. Eight 256-bit numbers encoding the Groth16 proof.

---

## 6. ProofOfHuman.sol — The Application Layer

zk-poh's contract. Wraps Semaphore and adds application-specific logic.

```solidity
function proveHuman(ISemaphore.SemaphoreProof calldata proof) external {
    require(!nullifierUsed[proof.nullifier], "Already used");
    semaphore.validateProof(groupId, proof);
    nullifierUsed[proof.nullifier] = true;
    emit HumanVerified(proof.nullifier);
}
```

**Why does ProofOfHuman check the nullifier if Semaphore also checks it?**

Defensive programming. Each layer protects against failures at other layers. Two locks on the same door.

**Why does ProofOfHuman create its own group in the constructor?**

```solidity
constructor(address _semaphore) {
    semaphore = ISemaphore(_semaphore);
    owner = msg.sender;
    groupId = semaphore.createGroup();
}
```

When `ProofOfHuman` calls `createGroup()`, Semaphore records `ProofOfHuman`'s address as the group admin. Only `ProofOfHuman` can then call `addMember()`. If the group were created externally, there is a risk the wrong address becomes admin and all `addMember` calls revert with `CallerIsNotTheGroupAdmin`.

---

## 7. What Cannot Be Faked

**Valid proof without private key:** Impossible. The verification equation only holds if the prover knows the secret.

**Reused proof:** Impossible. Nullifier is recorded permanently after first use.

**Linking two proofs to same identity:** Impossible. Different scopes produce completely different nullifiers with no mathematical relationship.

**Fake Merkle membership:** Impossible. Poseidon hash used in LeanIMT is collision-resistant.

---

## 8. What Can Be Gamed

**Credential selling.** A real human can give their private key to someone else. The proof is cryptographically valid — the system cannot detect this. Defense is social and economic, not cryptographic.

**Colluding humans.** Multiple real people coordinating votes is not a cryptographic problem.

**Front-running.** Someone seeing your proof in the mempool cannot use it (duplicate nullifier) but could delay your transaction. General Ethereum problem.

---

## 9. Error Reference

| Error | Meaning | Fix |
|---|---|---|
| `CallerIsNotTheGroupAdmin` | `addMember` called by wrong address | Ensure `ProofOfHuman` creates its own group in constructor |
| `Semaphore__InvalidProof` | Proof failed math verification | Rebuild group from on-chain members using `@semaphore-protocol/data` |
| `Semaphore__YouAreUsingTheSameNullifierTwice` | Nullifier already used | User already participated — expected behavior |
| `Already used` | ProofOfHuman's nullifier check | Same as above at application layer |
| `Proposal not active` | Proposal doesn't exist | Run `create-proposal.ts` first |

---

## 10. Verifying a Proof Off-Chain

```typescript
import { verifyProof } from "@semaphore-protocol/proof"

const isValid = await verifyProof(proof)
console.log("Proof valid:", isValid)
```

Same math as on-chain. No gas. Nullifier not recorded. Use for pre-flight checks in frontend.

---

## 11. Reading Contract State

```typescript
import { SemaphoreEthers } from "@semaphore-protocol/data"

const semaphoreEthers = new SemaphoreEthers("sepolia")
const members = await semaphoreEthers.getGroupMembers(groupId.toString())
const admin = await semaphoreEthers.getGroupAdmin(groupId.toString())
```

---

## 12. Deployed Addresses (Sepolia)

| Contract | Address | Role |
|---|---|---|
| SemaphoreVerifier | `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8` | Math verifier |
| Semaphore | `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D` | Orchestrator |
| ProofOfHuman | `0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5` | Application layer |
| SimpleVoting | `0x06bEE821216e16fd07e61033b55AA073ca7408B6` | Reference implementation |

---

*This document describes a live system. All contracts are deployed and callable on Sepolia.*

*zk-poh — making zero-knowledge proof of humanity accessible to every developer.*
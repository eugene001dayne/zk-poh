# Document 01 — The Circuit Spec
## ZK Proof of Human: Architecture, Components, and Integration Reference

**Project:** zk-poh — Zero-Knowledge Proof of Human
**Author:** Eugene Dayne Mawuli
**GitHub:** https://github.com/eugene001dayne/zk-poh
**Status:** Live on Sepolia Testnet — End to End Working
**Last Updated:** April 20, 2026

---

## 0. Purpose of This Document

This document explains how zk-poh works — from the problem it solves, to the cryptographic components it uses, to the deployed contracts and frontend a developer can use today.

It is written for developers who want to integrate ZK proof of humanity into their application without needing a PhD in cryptography.

Every claim in this document is backed by code that runs. Every address is live on Sepolia.

---

## 1. The Problem

### Sybil Attacks

A Sybil attack is when one entity creates many fake identities to gain an unfair advantage:

- One person votes 1,000 times in a DAO governance proposal
- One person claims 500 airdrops from a single wallet farm
- One person drains a quadratic funding pool by splitting donations across fake accounts
- Bot armies manipulate social media sentiment at scale

### Why Current Solutions Fail

| Solution | Fatal Flaw |
|---|---|
| CAPTCHA | AI solves it better than humans now |
| Phone verification | Virtual numbers cost pennies to buy in bulk |
| Government ID / KYC | Doxxes the user. Excludes billions with no formal ID |
| Biometrics (e.g. iris scan) | People sell their scans for cash |
| Social graph verification | Wealth-biased. Gameable by anyone with connections |

### The Gap

The cryptographic tools to solve this problem already exist. What does not exist is clear documentation a developer can follow, accessible contract templates they can deploy, and a standard they can adopt without reading 40 academic papers.

This project fills that gap.

---

## 2. The Solution

A user can prove they are a unique, verified human without revealing who they are.

- No name required
- No government ID required
- No phone number required
- No biometric data stored
- One person = one action per application, enforced by math

---

## 3. The Four Components

### 3.1 The Commitment

A trusted issuer registers your cryptographic commitment on-chain. The commitment contains no identifying information — it is proof of membership in the verified human set. Your private key never leaves your device.

```typescript
import { Identity } from "@semaphore-protocol/identity"
const identity = new Identity()
// identity.commitment — registered on-chain
// private key never leaves the device
```

### 3.2 The Nullifier

Every time you use an application, your credential generates a nullifier — a unique code tied to both your identity and that specific application.

```
same identity + same application = same nullifier (always)
same identity + different application = completely different nullifier
```

### 3.3 The Circuit

Takes your private identity and public inputs, checks group membership, and produces a proof without revealing your identity.

**Critical implementation note:** The group must be built from on-chain members using `@semaphore-protocol/data`. The Semaphore LeanIMT on-chain computes roots differently from a locally constructed tree. This is required for proof verification to succeed.

```javascript
const { SemaphoreEthers } = await import("@semaphore-protocol/data")
const semaphoreEthers = new SemaphoreEthers("sepolia")
const members = await semaphoreEthers.getGroupMembers(GROUP_ID.toString())
const group = new Group(members)
const proof = await generateProof(identity, group, BigInt(GROUP_ID), GROUP_ID)
```

### 3.4 The Verifier Contract

Checks the proof is mathematically valid and the nullifier hasn't been used before. If both pass: action allowed, nullifier recorded permanently.

---

## 4. The Full Flow

```
USER (Browser)
  │  Identity generated locally — private key never leaves device
  ▼
[ProofOfHuman Contract]
  │  addHuman(commitment) — registers in Semaphore group
  │  Contract is group admin — calls Semaphore directly
  ▼
[Browser — proof generation]
  │  Fetches on-chain members via @semaphore-protocol/data
  │  Builds correct Merkle tree
  │  Generates ZK proof locally
  ▼
[SimpleVoting Contract]
  │  vote(proposalId, support, proof)
  │  Calls ProofOfHuman.proveHuman(proof)
  │  Which calls semaphore.validateProof(groupId, proof)
  ▼
[Semaphore V4 — Ethereum Foundation]
  │  Verifies proof mathematically
  │  Checks nullifier not used before
  ▼
✅ Vote counted. Nullifier recorded. Identity never revealed.
```

---

## 5. Critical Architecture Decision

`ProofOfHuman` must create its own Semaphore group in its constructor — not have the group created externally. This guarantees `ProofOfHuman` is the group admin.

```solidity
constructor(address _semaphore) {
    semaphore = ISemaphore(_semaphore);
    owner = msg.sender;
    groupId = semaphore.createGroup(); // Contract creates group, becomes admin
}
```

If the group is created externally and the group ID is passed in, there is a risk of ID mismatch. Creating the group in the constructor eliminates this class of bugs entirely.

---

## 6. Deployed Addresses (Sepolia Testnet)

| Contract | Address |
|---|---|
| Semaphore V4 (Ethereum Foundation) | `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D` |
| ProofOfHuman | `0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5` |
| SimpleVoting | `0x06bEE821216e16fd07e61033b55AA073ca7408B6` |

**Group ID:** 500
**Deployed:** April 20, 2026

Etherscan:
- https://sepolia.etherscan.io/address/0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5
- https://sepolia.etherscan.io/address/0x06bEE821216e16fd07e61033b55AA073ca7408B6

---

## 7. Test Results

```
✔ should add a human and verify their proof
✔ should reject a double submission
✔ should create a proposal
✔ should allow a verified human to vote yes
✔ should reject a double vote
✔ should count yes and no votes correctly

6 passing
```

---

## 8. Security Notes

**What this prevents:** double voting, bot bypasses, cross-app identity linking, identity revelation.

**What this does not prevent:** credential selling. A real human can sell their private key. The nullifier system raises the cost of attack dramatically but cannot eliminate it entirely.

**Note on addHuman:** In the current demo, `addHuman` is callable by anyone. In production, restrict this to a trusted issuer.

---

*This document describes a working system. Every code sample has been run. The contracts are live. The tests pass. The frontend works.*
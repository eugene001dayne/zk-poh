# Proof of Human: The Problem & The Solution
### Document 00 — Foundation Spec
*Version 1.0 — Living Document*

> **Author:** Eugene Dayne Mawuli ([@eugene001dayne](https://github.com/eugene001dayne))  
> **Status:** Active Development — v0.1  
> **License:** MIT
---

## The Problem

Every day, people create thousands of fake identities to cheat systems that were built for real humans.

They farm airdrops. They manipulate DAO votes. They drain quadratic funding pools that were meant to support public goods. They run bot armies that fake community sentiment.

This is called a **Sybil attack** — one entity pretending to be many.

The current solutions are broken in one of two ways:

- **Too invasive** — they ask for your passport, your phone number, your face scan. You prove you're human by giving up your privacy.
- **Too weak** — they ask for a Twitter account or an ETH balance. Both can be bought, farmed, or faked.

Nobody has solved the middle ground: *prove you are a unique human, without revealing who you are.*

---

## What We Are Building

We are not building a global identity system.
We are not building a biometric database.
We are not building another "connect your social media" verification tool.

We are building the **documentation, standards, and circuit templates** that make zero-knowledge proof of humanity accessible to any developer — so they can build those things, correctly, on top of a solid foundation.

Think of it this way: we are writing the manual for a lock that already exists, so that builders stop installing it upside down.

---

## The Core Concepts

### 1. The Commitment

A trusted issuer — Gitcoin Passport, Proof of Humanity, a university, a government, anyone trusted — verifies that you are a real human. They give you a cryptographic credential: a **commitment**.

This commitment contains no name. No birthday. No address. It simply says: *"this person is on the verified list."*

You hold this commitment privately. Nobody else can see it.

### 2. The Nullifier

Every time you interact with an application — a DAO vote, an airdrop, a funding round — your credential generates a unique code called a **nullifier**.

The nullifier is deterministic:

```
same credential + same app = same nullifier code, always
same credential + different app = completely different code
```

This means:
- Nobody can link your activity across different apps
- But if you try to claim the same airdrop twice, the system sees the same nullifier appear twice and rejects it

You are caught — without anyone knowing who you are.

### 3. The Circuit

A **circuit** is a math machine with rules baked in. You feed it your secret credential and the app ID. It checks:

- Is this credential genuinely in the verified set?
- Is this the correct nullifier for this app?

If both checks pass, it outputs a small **proof** — a piece of cryptographic data that says *"the rules were satisfied"* — without revealing your credential or your identity.

The proof is what goes on the blockchain. Not you.

### 4. The Verifier Contract

A lightweight smart contract on-chain with exactly two jobs:

1. Is this proof valid? (Did it come from a real circuit run?)
2. Has this nullifier been used before in this app?

If both checks pass: the action is allowed.
The nullifier is recorded. Forever. Publicly. As a code like `0x7f3a...ef12` — no name attached.

---

## The Full Flow

```
You
  │
  ▼
[Issuer] — verifies you're human → gives you a Commitment
  │
  ▼
[Circuit] — takes your Commitment + App ID
          → checks you're in the verified set
          → outputs: Proof + Nullifier
  │
  ▼
[Verifier Contract] — checks Proof is valid
                    — checks Nullifier hasn't been used
  │
  ▼
✅ Action allowed. You're in. Anonymously.
```

---

## What This Does Not Solve

Intellectual honesty matters. This system has real limits.

**It does not stop credential selling.**
If a real human gets verified and sells their credential to someone else, that buyer has one valid credential. They can use it once per app — the same as the original human would. Our system cannot distinguish intent.

This is not a flaw in our design. It is a fundamental limit of any cryptographic approach. Even iris-scan systems like Worldcoin face this — people in Argentina, Ghana, and Kenya have been documented selling their biometric scans for cash.

What our system does is **raise the cost of attack dramatically**. Instead of one person creating 1,000 fake identities from nothing, an attacker now needs 1,000 real humans to cooperate. That is a different problem — a social and economic one, not a cryptographic one.

**It does not stop coordinated real humans.**
Groups of real people can still collude — donating to each other's projects in quadratic funding rounds, voting as a bloc. These are real attacks. They require social and game-theoretic solutions layered on top of cryptographic ones.

---

## Who This Is For

**DAO founders** who want governance that cannot be manipulated by one person with fifty wallets.

**Airdrop designers** who want tokens to reach real communities, not farming bots.

**Quadratic funding platforms** who want matching pools to reflect genuine human preference, not manufactured consensus.

**Developers** who want to add Sybil resistance to their protocol with a single function call:

```solidity
verifyProof(nullifier, appId) → true / false
```

---

## The Landscape

People are trying to solve this. Nobody has fully solved it.

| Project | Approach | Weakness |
|---|---|---|
| Worldcoin | Iris scan | People sell their scans for cash |
| Gitcoin Passport | Aggregated social stamps | Gameable, wealth-biased |
| Proof of Humanity | Video verification | Slow, hard to scale |
| Semaphore / Zupass | ZK nullifier schemes | Powerful but inaccessible to most developers |

The technical primitives exist. What does not exist is clear documentation, accessible templates, and a standard that developers can adopt without a PhD in cryptography.

That is the gap. That is what this project fills.

---

## What Comes Next

- **Document 01** — The Circuit Spec: how the nullifier scheme works mathematically
- **Document 02** — The Verifier Contract: a reference Solidity implementation
- **Document 03** — The SDK: how a developer integrates this in under an hour
- **Document 04** — The Issuer Interface: how existing identity systems plug in

---

*This is a living document. It will be updated as the specification matures.*
*Maintained by the Proof of Human project.*
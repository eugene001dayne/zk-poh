# Document 03 — The Developer Integration Guide
## How to Add ZK Proof of Humanity to Your Application

**Project:** zk-poh — Zero-Knowledge Proof of Human
**Author:** Eugene Dayne Mawuli
**GitHub:** https://github.com/eugene001dayne/zk-poh
**Last Updated:** April 22, 2026

---

## 0. Who This Document Is For

You are a developer. You have an application — a DAO, a voting system, an airdrop, a grant platform — and you want to prevent Sybil attacks without KYC or biometrics.

This document walks you through integrating zk-poh from scratch. No ZK knowledge required. By the end you will have a contract that gates any action behind proof of humanity.

---

## 1. What You Are Building

You will deploy two contracts:

- **ProofOfHuman** — handles identity registration and ZK proof verification
- **YourApplication** — your contract, which calls ProofOfHuman before allowing any action

The flow:
1. User registers their ZK identity commitment on-chain
2. User generates a ZK proof in the browser
3. User submits the proof to your contract
4. Your contract calls ProofOfHuman to verify
5. If valid: action allowed. Nullifier recorded. One person, one action.

---

## 2. Setup

**Requirements:**
- Node.js v20+
- npm
- A wallet with Sepolia ETH (get free ETH at https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

**Install:**
```bash
git clone https://github.com/eugene001dayne/zk-poh.git
cd zk-poh
npm install --legacy-peer-deps
```

**Environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

Get a free Alchemy key at alchemy.com. Use a dedicated test wallet — never your main wallet.

---

## 3. Deploy ProofOfHuman

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Output:
```
ProofOfHuman deployed to: 0x...
Group ID: 501
SimpleVoting deployed to: 0x...
```

Save these addresses. You will need them.

---

## 4. Write Your Contract

Import and use ProofOfHuman as a gate:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "./ProofOfHuman.sol";

contract YourApplication {
    ProofOfHuman public proofOfHuman;
    mapping(uint256 => bool) public nullifierUsed;

    constructor(address _proofOfHuman) {
        proofOfHuman = ProofOfHuman(_proofOfHuman);
    }

    function doSomething(
        ISemaphore.SemaphoreProof calldata proof
    ) external {
        // Gate: must be a verified human, one action per nullifier
        require(!nullifierUsed[proof.nullifier], "Already acted");
        proofOfHuman.proveHuman(proof);
        nullifierUsed[proof.nullifier] = true;

        // Your logic here
        // e.g. mint tokens, cast vote, claim airdrop
    }
}
```

That's it. Any action in your contract can be gated behind `proofOfHuman.proveHuman(proof)`.

---

## 5. Deploy Your Contract

Add a deploy script at `scripts/deploy-your-app.ts`:

```typescript
import { network } from "hardhat"

const { ethers } = await network.create()

const POH_ADDRESS = "0x..." // Your ProofOfHuman address from step 3

async function main() {
  const [deployer] = await ethers.getSigners()
  
  const App = await ethers.getContractFactory("YourApplication")
  const app = await App.deploy(POH_ADDRESS)
  await app.waitForDeployment()
  console.log("YourApplication deployed to:", await app.getAddress())
}

main().catch(console.error)
```

```bash
npx hardhat run scripts/deploy-your-app.ts --network sepolia
```

---

## 6. Frontend Integration

Install the required packages:

```bash
npm install ethers @semaphore-protocol/identity @semaphore-protocol/group @semaphore-protocol/proof @semaphore-protocol/data
```

Full proof generation and submission flow:

```javascript
import { ethers } from "ethers"
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof } from "@semaphore-protocol/proof"
import { SemaphoreEthers } from "@semaphore-protocol/data"

const POH_ADDRESS = "0x..." // Your ProofOfHuman address
const APP_ADDRESS = "0x..." // Your application address
const GROUP_ID = 501        // Your group ID from deployment

const POH_ABI = [
  "function addHuman(uint256 identityCommitment) external",
]

const APP_ABI = [
  "function doSomething(tuple(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 message, uint256 scope, uint256[8] points) proof) external",
]

async function participate() {
  // Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum)
  await provider.send("eth_requestAccounts", [])
  const signer = await provider.getSigner()

  // Generate identity (store this — user needs the same identity each time)
  const identity = new Identity()

  // Register on-chain
  const poh = new ethers.Contract(POH_ADDRESS, POH_ABI, signer)
  await (await poh.addHuman(identity.commitment)).wait()

  // Fetch on-chain group members — required for valid proof
  const semaphoreEthers = new SemaphoreEthers("sepolia")
  const members = await semaphoreEthers.getGroupMembers(GROUP_ID.toString())
  const group = new Group(members)

  // Generate ZK proof
  const proof = await generateProof(identity, group, BigInt(GROUP_ID), GROUP_ID)

  // Submit to your contract
  const app = new ethers.Contract(APP_ADDRESS, APP_ABI, signer)
  await (await app.doSomething(proof)).wait()

  console.log("Action completed. Nullifier:", proof.nullifier.toString())
}
```

---

## 7. Identity Persistence

The user's identity must be the same every time they interact. If they generate a new identity on each visit, they will need to register again and pay gas.

Store the identity in localStorage:

```javascript
// On first visit — generate and save
let identity
const saved = localStorage.getItem("zk-identity")
if (saved) {
  identity = new Identity(saved)
} else {
  identity = new Identity()
  localStorage.setItem("zk-identity", identity.privateKey.toString())
}
```

**Security note:** The private key in localStorage is as secure as the user's browser. For a production application, consider more secure storage or a wallet-derived identity.

---

## 8. Testing Your Integration

Write tests using MockSemaphore — available in this repo — so you don't need real ZK proof generation in your test suite:

```typescript
import { expect } from "chai"
import { network } from "hardhat"
import { Identity, Group, generateProof } from "@semaphore-protocol/core"

const { ethers } = await network.create()

describe("YourApplication", function () {
  it("should allow a verified human to act", async function () {
    // Deploy MockSemaphore and ProofOfHuman
    const MockSemaphore = await ethers.getContractFactory("MockSemaphore")
    const semaphore = await MockSemaphore.deploy()
    
    const PoH = await ethers.getContractFactory("ProofOfHuman")
    const poh = await PoH.deploy(await semaphore.getAddress())

    const App = await ethers.getContractFactory("YourApplication")
    const app = await App.deploy(await poh.getAddress())

    // Register and prove
    const identity = new Identity()
    const group = new Group()
    group.addMember(identity.commitment)
    
    await poh.addHuman(identity.commitment)
    
    const proof = await generateProof(identity, group, "prove-human", 1)
    await app.doSomething(proof)

    expect(await app.nullifierUsed(proof.nullifier)).to.equal(true)
  })
})
```

---

## 9. Production Checklist

Before going to mainnet:

- [ ] Restrict `addHuman` to a trusted issuer — don't let anyone self-register
- [ ] Decide on your issuer — a DAO multisig, a KYC provider, an attestation service
- [ ] Audit your contracts — especially the integration with ProofOfHuman
- [ ] Test on Sepolia with real users before mainnet
- [ ] Monitor nullifier usage — build a dashboard to track participation
- [ ] Handle the case where a user loses their identity key

---

## 10. Restricting addHuman (Production)

In the current demo, `addHuman` is open. For production:

```solidity
address public issuer;

modifier onlyIssuer() {
    require(msg.sender == issuer, "Not issuer");
    _;
}

function addHuman(uint256 identityCommitment) external onlyIssuer {
    semaphore.addMember(groupId, identityCommitment);
    emit MemberAdded(identityCommitment);
}

function setIssuer(address _issuer) external onlyOwner {
    issuer = _issuer;
}
```

The issuer can be:
- Your deployer wallet (for controlled onboarding)
- A multisig (for decentralized approval)
- A smart contract that integrates with Gitcoin Passport or Proof of Humanity

---

## 11. Use Cases

**Anonymous voting:**
Gate each vote behind `proveHuman`. One human, one vote, no names.

**Sybil-resistant airdrops:**
Gate token claims behind `proveHuman`. One human, one claim.

**Quadratic funding:**
Use nullifiers to prevent one person from splitting donations across fake accounts.

**Anonymous feedback:**
Let employees or community members submit feedback without revealing who they are — but guarantee each person can only submit once.

**Rate limiting:**
Allow one free API call per human per day, without accounts or phone numbers.

---

## 12. Live Reference Implementation

The full working implementation is live on Sepolia:

| Contract | Address |
|---|---|
| ProofOfHuman | `0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5` |
| SimpleVoting | `0x06bEE821216e16fd07e61033b55AA073ca7408B6` |

Frontend: https://zk-poh.vercel.app
Source: https://github.com/eugene001dayne/zk-poh

---

*zk-poh — making zero-knowledge proof of humanity accessible to every developer.*
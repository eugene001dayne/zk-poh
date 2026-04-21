# zk-poh

**Zero-Knowledge Proof of Human**

Prove you are a unique human. Vote anonymously. No name, no ID, pure cryptography.

Live on Sepolia testnet. Open source. Built on Semaphore V4.

---

## What This Is

zk-poh is a system that lets a user prove they are a unique human without revealing who they are. It uses zero-knowledge proofs to prevent Sybil attacks — one entity creating many fake identities to manipulate votes, airdrops, or governance.

No KYC. No biometrics. No phone number. The math enforces the rules.

---

## Live Demo

Contracts are deployed on Sepolia testnet:

| Contract | Address |
|---|---|
| ProofOfHuman | [`0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5`](https://sepolia.etherscan.io/address/0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5) |
| SimpleVoting | [`0x06bEE821216e16fd07e61033b55AA073ca7408B6`](https://sepolia.etherscan.io/address/0x06bEE821216e16fd07e61033b55AA073ca7408B6) |
| Semaphore V4 (Ethereum Foundation) | [`0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`](https://sepolia.etherscan.io/address/0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D) |

To try it yourself: clone the repo, run the frontend locally, connect MetaMask on Sepolia, and vote.

---

## How It Works

**1. Identity** — A ZK identity is generated in your browser. The private key never leaves your device.

**2. Registration** — Your cryptographic commitment is registered on-chain. No name, no address — just a number that proves membership.

**3. Proof** — When you vote, a zero-knowledge proof is generated locally. It proves you are a registered human without revealing which one.

**4. Verification** — The proof is verified on-chain by the Ethereum Foundation's Semaphore contract. If valid and nullifier unused: vote counted.

**5. Nullifier** — Every vote produces a unique nullifier. If you try to vote twice, the duplicate nullifier is caught. Your identity is never revealed — just the number that says "this slot is taken."

---

## Project Structure

```
zk-poh/
├── contracts/
│   ├── ProofOfHuman.sol      ← Main contract
│   ├── SimpleVoting.sol      ← Reference voting implementation
│   └── MockSemaphore.sol     ← For testing
├── frontend/
│   └── src/
│       └── App.jsx           ← React frontend
├── scripts/
│   ├── deploy.ts             ← Deployment script
│   ├── create-proposal.ts    ← Create a proposal on-chain
│   └── interact.ts           ← Manual interaction demo
├── test/
│   ├── ProofOfHuman.ts       ← 2 passing tests
│   └── SimpleVoting.ts       ← 4 passing tests
└── docs/
    └── 01-circuit-spec.md    ← Full architecture documentation
```

---

## Setup

**Requirements:** Node.js v20+, npm, MetaMask

```bash
git clone https://github.com/eugene001dayne/zk-poh.git
cd zk-poh
npm install --legacy-peer-deps
```

**Run tests:**
```bash
npx hardhat test
```

**Run frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173` in Chrome with MetaMask on Sepolia.

**Deploy your own instance:**
```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env

npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/create-proposal.ts --network sepolia
```

---

## Tests

```
ProofOfHuman
  ✔ should add a human and verify their proof
  ✔ should reject a double submission

SimpleVoting
  ✔ should create a proposal
  ✔ should allow a verified human to vote yes
  ✔ should reject a double vote
  ✔ should count yes and no votes correctly

6 passing
```

---

## Technical Stack

- **Smart Contracts:** Solidity 0.8.28, Hardhat 3
- **ZK Protocol:** Semaphore V4 (Ethereum Foundation)
- **Frontend:** React + Vite + ethers.js v6
- **Testing:** Mocha + Chai
- **Network:** Ethereum Sepolia testnet

---

## Documentation

Full architecture documentation in [`docs/01-circuit-spec.md`](docs/01-circuit-spec.md).

Covers the four components (commitment, nullifier, circuit, verifier), the full flow, deployed addresses, test results, security considerations, and integration guide.

---

## What's Next

- [ ] Deploy frontend publicly (Vercel)
- [ ] Restrict `addHuman` to trusted issuer
- [ ] Integrate Gitcoin Passport as issuer
- [ ] Document 02 — The Verifier Contract Reference
- [ ] Mainnet deployment (after audit)

---

## Built By

**Eugene Dayne Mawuli** — Accra, Ghana

The goal: make zero-knowledge proof of humanity as accessible as WordPress made websites.

---

## License

MIT

---

*Built on [Semaphore](https://semaphore.pse.dev) by the Ethereum Foundation's Privacy & Scaling Explorations team.*
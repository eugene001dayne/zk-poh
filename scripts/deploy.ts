import { network } from "hardhat"

const { ethers } = await network.create()

// Real Semaphore V4 on Sepolia — deployed by Ethereum Foundation
const REAL_SEMAPHORE_SEPOLIA = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying from:", deployer.address)

  // Deploy ProofOfHuman pointing at real Semaphore
  const groupId = 1
  const PoH = await ethers.getContractFactory("ProofOfHuman")
  const poh = await PoH.deploy(REAL_SEMAPHORE_SEPOLIA, groupId)
  await poh.waitForDeployment()
  console.log("ProofOfHuman deployed to:", await poh.getAddress())

  // Deploy SimpleVoting pointing at ProofOfHuman
  const Voting = await ethers.getContractFactory("SimpleVoting")
  const voting = await Voting.deploy(await poh.getAddress())
  await voting.waitForDeployment()
  console.log("SimpleVoting deployed to:", await voting.getAddress())

  console.log("\nSemaphore (real):", REAL_SEMAPHORE_SEPOLIA)
  console.log("Group ID:", groupId)
}

main().catch(console.error)
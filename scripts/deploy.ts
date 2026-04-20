import { network } from "hardhat"

const { ethers } = await network.create()

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying from:", deployer.address)

  // Deploy MockSemaphore
  const MockSemaphore = await ethers.getContractFactory("MockSemaphore")
  const semaphore = await MockSemaphore.deploy()
  await semaphore.waitForDeployment()
  console.log("MockSemaphore deployed to:", await semaphore.getAddress())

  // Deploy ProofOfHuman
  const groupId = 1
  const PoH = await ethers.getContractFactory("ProofOfHuman")
  const poh = await PoH.deploy(await semaphore.getAddress(), groupId)
  await poh.waitForDeployment()
  console.log("ProofOfHuman deployed to:", await poh.getAddress())

  // Deploy SimpleVoting
  const Voting = await ethers.getContractFactory("SimpleVoting")
  const voting = await Voting.deploy(await poh.getAddress())
  await voting.waitForDeployment()
  console.log("SimpleVoting deployed to:", await voting.getAddress())
}

main().catch(console.error)
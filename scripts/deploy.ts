import { network } from "hardhat"

const { ethers } = await network.create()

const REAL_SEMAPHORE_SEPOLIA = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying from:", deployer.address)

  // ProofOfHuman creates its own group in constructor
  const PoH = await ethers.getContractFactory("ProofOfHuman")
  const poh = await PoH.deploy(REAL_SEMAPHORE_SEPOLIA)
  await poh.waitForDeployment()
  const pohAddress = await poh.getAddress()
  const groupId = await poh.groupId()
  console.log("ProofOfHuman deployed to:", pohAddress)
  console.log("Group ID:", groupId.toString())

  const Voting = await ethers.getContractFactory("SimpleVoting")
  const voting = await Voting.deploy(pohAddress)
  await voting.waitForDeployment()
  console.log("SimpleVoting deployed to:", await voting.getAddress())

  console.log("\nUpdate App.jsx GROUP_ID to:", groupId.toString())
}

main().catch(console.error)
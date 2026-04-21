import { network } from "hardhat"

const { ethers } = await network.create()

const VOTING_ADDRESS = "0x06bEE821216e16fd07e61033b55AA073ca7408B6"

async function main() {
  const [deployer] = await ethers.getSigners()
  
  const voting = new ethers.Contract(
    VOTING_ADDRESS,
    ["function createProposal(string calldata description) external returns (uint256)"],
    deployer
  )

  const tx = await voting.createProposal("Should we adopt ZK proof of humanity as a standard for anonymous voting?")
  await tx.wait()
  console.log("✅ Proposal #0 created")
}

main().catch(console.error)
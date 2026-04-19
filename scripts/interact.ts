import { network } from "hardhat"
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof } from "@semaphore-protocol/proof"

const { ethers } = await network.create()

const POH_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const GROUP_ID = 1

const POH_ABI = [
  "function addHuman(uint256 identityCommitment) external",
  "function proveHuman(tuple(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 message, uint256 scope, uint256[8] points) proof) external",
  "function isNullifierUsed(uint256 nullifier) external view returns (bool)"
]

async function main() {
  const [signer] = await ethers.getSigners()
  const poh = new ethers.Contract(POH_ADDRESS, POH_ABI, signer)

  // Create identity and group
  const identity = new Identity()
  const group = new Group()
  group.addMember(identity.commitment)

  console.log("Identity commitment:", identity.commitment.toString())

  // Register as human
  const addTx = await poh.addHuman(identity.commitment)
  await addTx.wait()
  console.log("✅ Human added to contract")

  // Generate and submit proof
  const proof = await generateProof(identity, group, "prove-human", GROUP_ID)
  const proveTx = await poh.proveHuman(proof)
  await proveTx.wait()
  console.log("✅ Proof submitted on-chain")

  // Confirm nullifier is recorded
  const used = await poh.isNullifierUsed(proof.nullifier)
  console.log("Nullifier used:", used)
}

main().catch(console.error)
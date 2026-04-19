import { Identity } from "@semaphore-protocol/core"
import { Group } from "@semaphore-protocol/core"
import { generateProof } from "@semaphore-protocol/core"

async function main() {
  console.log("--- Proof of Human Demo ---\n")

  // Step 1: Create an identity (commitment)
  const identity = new Identity()
  console.log("✅ Identity created")
  console.log("Commitment:", identity.commitment.toString())

  // Step 2: Create a group and add the identity
  const group = new Group()
  group.addMember(identity.commitment)
  console.log("\n✅ Added to group")
  console.log("Group root:", group.root.toString())

  // Step 3: Generate a ZK proof
  const appId = 1 // our app ID
  const proof = await generateProof(identity, group, "vote-yes", appId)
  console.log("\n✅ Proof generated")
  console.log("Nullifier:", proof.nullifier.toString())
}

main().catch(console.error)
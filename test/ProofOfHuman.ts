import { expect } from "chai"
import { network } from "hardhat"
import { Identity, Group, generateProof } from "@semaphore-protocol/core"

const { ethers } = await network.create()

describe("ProofOfHuman", function () {
  let semaphore: any
  let poh: any
  const groupId = 1

  before(async function () {
    const SemaphoreFactory = await ethers.getContractFactory("MockSemaphore")
    semaphore = await SemaphoreFactory.deploy()
    await semaphore.waitForDeployment()

    const PoH = await ethers.getContractFactory("ProofOfHuman")
    poh = await PoH.deploy(await semaphore.getAddress(), groupId)
    await poh.waitForDeployment()

    await semaphore.createGroup()
  })

  it("should add a human and verify their proof", async function () {
    const identity = new Identity()
    const group = new Group()
    group.addMember(identity.commitment)

    await poh.addHuman(identity.commitment)

    const proof = await generateProof(identity, group, "prove-human", groupId)

    const tx = await poh.proveHuman(proof)
    await tx.wait()

    expect(await poh.isNullifierUsed(proof.nullifier)).to.equal(true)
  })

  it("should reject a double submission", async function () {
    const identity = new Identity()
    const group = new Group()
    group.addMember(identity.commitment)

    await poh.addHuman(identity.commitment)

    const proof = await generateProof(identity, group, "prove-human", groupId)

    await poh.proveHuman(proof)

    await expect(poh.proveHuman(proof)).to.be.revertedWith("Already used")
  })
})
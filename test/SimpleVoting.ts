import { expect } from "chai"
import { network } from "hardhat"
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof } from "@semaphore-protocol/proof"

const { ethers } = await network.create()

describe("SimpleVoting", function () {
  let semaphore: any
  let poh: any
  let voting: any
  const groupId = 1

  before(async function () {
    // Deploy MockSemaphore
    const MockSemaphore = await ethers.getContractFactory("MockSemaphore")
    semaphore = await MockSemaphore.deploy()
    await semaphore.waitForDeployment()

    // Deploy ProofOfHuman
    const PoH = await ethers.getContractFactory("ProofOfHuman")
    poh = await PoH.deploy(await semaphore.getAddress(), groupId)
    await poh.waitForDeployment()

    // Deploy SimpleVoting
    const Voting = await ethers.getContractFactory("SimpleVoting")
    voting = await Voting.deploy(await poh.getAddress())
    await voting.waitForDeployment()
  })

  it("should create a proposal", async function () {
    const tx = await voting.createProposal("Should we adopt ZK proof of humanity?")
    await tx.wait()

    const results = await voting.getResults(0)
    expect(results.description).to.equal("Should we adopt ZK proof of humanity?")
    expect(results.yesVotes).to.equal(0n)
    expect(results.noVotes).to.equal(0n)
    expect(results.active).to.equal(true)
  })

  it("should allow a verified human to vote yes", async function () {
    const identity = new Identity()
    const group = new Group()
    group.addMember(identity.commitment)

    await poh.addHuman(identity.commitment)

    const proof = await generateProof(identity, group, "prove-human", groupId)
    await voting.vote(0, true, proof)

    const results = await voting.getResults(0)
    expect(results.yesVotes).to.equal(1n)
  })

  it("should reject a double vote", async function () {
    const identity = new Identity()
    const group = new Group()
    group.addMember(identity.commitment)

    await poh.addHuman(identity.commitment)

    const proof = await generateProof(identity, group, "prove-human", groupId)
    await voting.vote(0, true, proof)

    await expect(voting.vote(0, true, proof)).to.be.revertedWith("Already voted")
  })

  it("should count yes and no votes correctly", async function () {
    // Create a fresh proposal
    await voting.createProposal("Should we expand to mainnet?")

    const identityYes = new Identity()
    const identityNo = new Identity()
    const group = new Group()
    group.addMember(identityYes.commitment)
    group.addMember(identityNo.commitment)

    await poh.addHuman(identityYes.commitment)
    await poh.addHuman(identityNo.commitment)

    const proofYes = await generateProof(identityYes, group, "prove-human", groupId)
    const proofNo = await generateProof(identityNo, group, "prove-human", groupId)

    await voting.vote(1, true, proofYes)
    await voting.vote(1, false, proofNo)

    const results = await voting.getResults(1)
    expect(results.yesVotes).to.equal(1n)
    expect(results.noVotes).to.equal(1n)
  })
})
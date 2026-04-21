import { network } from "hardhat"

const { ethers } = await network.create()

const REAL_SEMAPHORE = "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D"
const POH_ADDRESS = "0x90bb40Cecd28B25eFfBd7683C7224602948050ba"

async function main() {
  const [signer] = await ethers.getSigners()
  
  const semaphore = new ethers.Contract(
    REAL_SEMAPHORE,
    [
      "function groupCounter() external view returns (uint256)",
      "function getMerkleTreeRoot(uint256 groupId) external view returns (uint256)",
      "function getMerkleTreeSize(uint256 groupId) external view returns (uint256)"
    ],
    signer
  )

  const poh = new ethers.Contract(
    POH_ADDRESS,
    ["function groupId() external view returns (uint256)"],
    signer
  )

  const counter = await semaphore.groupCounter()
  const pohGroupId = await poh.groupId()
  const treeSize = await semaphore.getMerkleTreeSize(pohGroupId)

  console.log("Semaphore groupCounter:", counter.toString())
  console.log("ProofOfHuman groupId:", pohGroupId.toString())
  console.log("Group tree size:", treeSize.toString())
  console.log("ProofOfHuman address:", POH_ADDRESS)
}

main().catch(console.error)
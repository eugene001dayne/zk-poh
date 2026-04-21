import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";

// ─── Contract Config ───────────────────────────────────────────────────────
const POH_ADDRESS = "0x12F957c0FAA1b56745a663eFc4f351EC49f7F5C5";
const VOTING_ADDRESS = "0x06bEE821216e16fd07e61033b55AA073ca7408B6";
const GROUP_ID = 500;

const POH_ABI = [
  "function addHuman(uint256 identityCommitment) external",
  "function proveHuman(tuple(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 message, uint256 scope, uint256[8] points) proof) external",
  "function isNullifierUsed(uint256 nullifier) external view returns (bool)",
];

const VOTING_ABI = [
  "function createProposal(string calldata description) external returns (uint256)",
  "function vote(uint256 proposalId, bool support, tuple(uint256 merkleTreeDepth, uint256 merkleTreeRoot, uint256 nullifier, uint256 message, uint256 scope, uint256[8] points) proof) external",
  "function getResults(uint256 proposalId) external view returns (string memory description, uint256 yesVotes, uint256 noVotes, bool active)",
  "event MemberAdded(uint256 identityCommitment)",
];

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#e8e6e0",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  glow: {
    position: "fixed",
    top: "-200px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "400px",
    background: "radial-gradient(ellipse, rgba(99,255,180,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "3rem 1.5rem",
    position: "relative",
    zIndex: 1,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    fontFamily: "'Space Mono', monospace",
    fontSize: "10px",
    color: "#63ffb4",
    background: "rgba(99,255,180,0.08)",
    border: "0.5px solid rgba(99,255,180,0.25)",
    borderRadius: "100px",
    padding: "5px 14px",
    marginBottom: "2rem",
    letterSpacing: "0.5px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#63ffb4",
  },
  title: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "36px",
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 0.5rem",
    letterSpacing: "-1px",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(232,230,224,0.5)",
    margin: "0 0 3rem",
    lineHeight: 1.7,
    fontWeight: 300,
    maxWidth: "360px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.75rem",
    marginBottom: "1rem",
  },
  label: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "9px",
    color: "rgba(232,230,224,0.35)",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "0.75rem",
    display: "block",
  },
  proposalText: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#ffffff",
    margin: "0 0 1.5rem",
    lineHeight: 1.5,
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    border: "0.5px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#e8e6e0",
    transition: "all 0.2s",
    marginBottom: "0.75rem",
  },
  btnPrimary: {
    background: "rgba(99,255,180,0.1)",
    border: "0.5px solid rgba(99,255,180,0.3)",
    color: "#63ffb4",
  },
  btnYes: {
    background: "rgba(99,255,180,0.08)",
    border: "0.5px solid rgba(99,255,180,0.2)",
    color: "#63ffb4",
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnNo: {
    background: "rgba(255,99,99,0.08)",
    border: "0.5px solid rgba(255,99,99,0.2)",
    color: "#ff6363",
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  voteGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "1.25rem",
  },
  tallyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  stat: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "12px",
    textAlign: "center",
  },
  statNum: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "28px",
    fontWeight: 700,
    margin: "0 0 2px",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "11px",
    color: "rgba(232,230,224,0.4)",
    margin: 0,
  },
  divider: {
    height: "0.5px",
    background: "rgba(255,255,255,0.06)",
    margin: "1.25rem 0",
  },
  monoSmall: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "10px",
    color: "rgba(232,230,224,0.35)",
    wordBreak: "break-all",
    lineHeight: 1.7,
    margin: 0,
  },
  walletRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "1.5rem",
  },
  walletPill: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    color: "rgba(232,230,224,0.5)",
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "100px",
    padding: "5px 12px",
  },
  statusBox: {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "12px 14px",
    fontFamily: "'Space Mono', monospace",
    fontSize: "11px",
    color: "rgba(232,230,224,0.5)",
    marginTop: "0.75rem",
    lineHeight: 1.6,
  },
  successIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(99,255,180,0.1)",
    border: "0.5px solid rgba(99,255,180,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1rem",
  },
  footer: {
    marginTop: "3rem",
    paddingTop: "1.5rem",
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "10px",
    color: "rgba(232,230,224,0.2)",
    letterSpacing: "0.5px",
  },
};

// ─── Pulse animation injected once ─────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("zkp-styles")) return;
  const el = document.createElement("style");
  el.id = "zkp-styles";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
    @keyframes zkpulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes zkfade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .zk-pulse { animation: zkpulse 2s infinite; }
    .zk-fade { animation: zkfade 0.4s ease forwards; }
    button:hover { opacity: 0.85; }
    button:active { transform: scale(0.98); }
  `;
  document.head.appendChild(el);
};

// ─── Helper ─────────────────────────────────────────────────────────────────
const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
const shortNum = (n) => {
  const s = n.toString();
  return s.length > 20 ? `${s.slice(0, 10)}...${s.slice(-8)}` : s;
};

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("connect"); // connect | vote | confirm
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ yes: 0n, no: 0n });
  const [nullifier, setNullifier] = useState("");
  const [identity, setIdentity] = useState(null);

  useEffect(() => { injectStyles(); }, []);

  // Load vote counts when on vote screen
  useEffect(() => {
    if (screen === "vote" && signer) fetchResults();
  }, [screen, signer]);

  const fetchResults = async () => {
    try {
      const voting = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);
      const r = await voting.getResults(0);
      setResults({ yes: r.yesVotes, no: r.noVotes });
    } catch {
      // proposal may not exist yet
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not found. Please install it.");
      return;
    }
    try {
      setLoading(true);
      setStatus("Connecting wallet...");
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();

      // Check Sepolia
      const net = await prov.getNetwork();
      if (net.chainId !== 11155111n) {
        setStatus("Please switch MetaMask to Sepolia testnet.");
        setLoading(false);
        return;
      }

      setProvider(prov);
      setSigner(sign);
      setWallet(addr);

      // Generate and store identity
      const id = new Identity();
      setIdentity(id);

      setStatus("");
      setScreen("vote");
    } catch (e) {
      setStatus("Connection failed. " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (support) => {
    if (!signer || !identity) return;
    try {
      setLoading(true);
      setStatus("Registering identity on-chain...");

      const poh = new ethers.Contract(POH_ADDRESS, POH_ABI, signer);
      const voting = new ethers.Contract(VOTING_ADDRESS, VOTING_ABI, signer);

      // Register commitment
      const addTx = await poh.addHuman(identity.commitment);
      await addTx.wait();

      setStatus("Generating ZK proof... this takes a moment.");

      // Fetch on-chain members to build correct group
const { SemaphoreEthers } = await import("@semaphore-protocol/data")
const semaphoreEthers = new SemaphoreEthers("sepolia")
const members = await semaphoreEthers.getGroupMembers(GROUP_ID.toString())
const group = new Group(members)

// Generate proof
const proof = await generateProof(identity, group, BigInt(GROUP_ID), GROUP_ID)
      setStatus("Submitting vote on-chain...");

      // Submit vote
      const voteTx = await voting.vote(0, support, proof);
      await voteTx.wait();

      setNullifier(proof.nullifier.toString());
      await fetchResults();
      setStatus("");
      setScreen("confirm");
    } catch (e) {
      setStatus("Error: " + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  // ── Screen: Connect ──────────────────────────────────────────────────────
  if (screen === "connect") return (
    <div style={styles.root}>
      <div style={styles.grid} />
      <div style={styles.glow} />
      <div style={styles.container} className="zk-fade">
        <div style={styles.badge}>
          <div style={styles.dot} className="zk-pulse" />
          sepolia testnet · live
        </div>

        <h1 style={styles.title}>zk-poh</h1>
        <p style={styles.subtitle}>
          Prove you are a unique human.<br />
          Vote anonymously. No name, no ID,<br />
          pure cryptography.
        </p>

        <div style={styles.card}>
          <span style={styles.label}>step 01 — connect</span>
          <p style={{ ...styles.proposalText, fontSize: "14px", color: "rgba(232,230,224,0.6)", marginBottom: "1.25rem" }}>
            Connect your MetaMask wallet on Sepolia to begin. A new ZK identity will be generated locally on your device.
          </p>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
          {status && <div style={styles.statusBox}>{status}</div>}
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>built on semaphore v4</span>
          <a href="https://github.com/eugene001dayne/zk-poh" target="_blank" rel="noreferrer"
            style={{ ...styles.footerText, color: "rgba(99,255,180,0.4)", textDecoration: "none" }}>
            github →
          </a>
        </div>
      </div>
    </div>
  );

  // ── Screen: Vote ─────────────────────────────────────────────────────────
  if (screen === "vote") return (
    <div style={styles.root}>
      <div style={styles.grid} />
      <div style={styles.glow} />
      <div style={styles.container} className="zk-fade">
        <div style={styles.badge}>
          <div style={styles.dot} className="zk-pulse" />
          sepolia testnet · live
        </div>

        <h1 style={styles.title}>zk-poh</h1>
        <p style={styles.subtitle}>Your identity is ready. Cast your vote.</p>

        <div style={styles.card}>
          <div style={styles.walletRow}>
            <div style={{ ...styles.dot, background: "#63ffb4" }} className="zk-pulse" />
            <span style={styles.walletPill}>{shortAddr(wallet)}</span>
          </div>

          <span style={styles.label}>proposal #0 · active</span>
          <p style={styles.proposalText}>
            Should we adopt ZK proof of humanity as a standard for anonymous voting?
          </p>

          <div style={styles.voteGrid}>
            <button style={styles.btnYes} onClick={() => castVote(true)} disabled={loading}>
              {loading ? "..." : "Vote Yes"}
            </button>
            <button style={styles.btnNo} onClick={() => castVote(false)} disabled={loading}>
              {loading ? "..." : "Vote No"}
            </button>
          </div>

          <div style={styles.divider} />

          <div style={styles.tallyGrid}>
            <div style={styles.stat}>
              <p style={{ ...styles.statNum, color: "#63ffb4" }}>{results.yes.toString()}</p>
              <p style={styles.statLabel}>yes</p>
            </div>
            <div style={styles.stat}>
              <p style={{ ...styles.statNum, color: "#ff6363" }}>{results.no.toString()}</p>
              <p style={styles.statLabel}>no</p>
            </div>
          </div>

          {status && <div style={styles.statusBox}>{status}</div>}
        </div>

        <div style={styles.card}>
          <span style={styles.label}>your zk identity</span>
          <p style={styles.monoSmall}>
            commitment: {identity ? shortNum(identity.commitment.toString()) : "—"}
          </p>
          <p style={{ ...styles.monoSmall, marginTop: "6px", color: "rgba(99,255,180,0.3)" }}>
            your secret never leaves this device
          </p>
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>built on semaphore v4</span>
          <a href="https://github.com/eugene001dayne/zk-poh" target="_blank" rel="noreferrer"
            style={{ ...styles.footerText, color: "rgba(99,255,180,0.4)", textDecoration: "none" }}>
            github →
          </a>
        </div>
      </div>
    </div>
  );

  // ── Screen: Confirm ──────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <div style={styles.grid} />
      <div style={styles.glow} />
      <div style={styles.container} className="zk-fade">
        <div style={styles.badge}>
          <div style={styles.dot} className="zk-pulse" />
          sepolia testnet · live
        </div>

        <h1 style={styles.title}>zk-poh</h1>

        <div style={styles.card}>
          <div style={styles.successIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9.5L7 13L14.5 5.5" stroke="#63ffb4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#ffffff", margin: "0 0 0.35rem" }}>
              Vote counted
            </p>
            <p style={{ fontSize: "13px", color: "rgba(232,230,224,0.4)", margin: 0 }}>
              Your identity was never revealed
            </p>
          </div>

          <div style={styles.divider} />

          <div style={styles.tallyGrid}>
            <div style={styles.stat}>
              <p style={{ ...styles.statNum, color: "#63ffb4" }}>{results.yes.toString()}</p>
              <p style={styles.statLabel}>yes</p>
            </div>
            <div style={styles.stat}>
              <p style={{ ...styles.statNum, color: "#ff6363" }}>{results.no.toString()}</p>
              <p style={styles.statLabel}>no</p>
            </div>
          </div>

          <div style={styles.divider} />

          <span style={styles.label}>your nullifier — proof you voted</span>
          <p style={styles.monoSmall}>{nullifier}</p>
          <p style={{ ...styles.monoSmall, marginTop: "6px", color: "rgba(99,255,180,0.25)" }}>
            this number proves you voted without revealing who you are
          </p>
        </div>

        <div style={styles.footer}>
          <span style={styles.footerText}>built on semaphore v4</span>
          <a href="https://github.com/eugene001dayne/zk-poh" target="_blank" rel="noreferrer"
            style={{ ...styles.footerText, color: "rgba(99,255,180,0.4)", textDecoration: "none" }}>
            github →
          </a>
        </div>
      </div>
    </div>
  );
}
# GreenMint Smart Contracts

GreenMint is a blockchain-based platform for carbon tracking, rewards, governance, and community engagement. This repository contains the core smart contracts for the GreenMint ecosystem, including carbon activity tracking, NFT rewards, governance, payments, leaderboards, and more.

## Contracts Overview

- **CarbonTrackingContract**: Records and tracks users' carbon-saving activities.
- **ChallengeManagementContract**: Manages eco-friendly challenges and participation.
- **GovernanceContract**: Enables decentralized governance and proposal voting.
- **LeaderboardContract**: Maintains user rankings based on eco-activities and achievements.
- **NFTRewardContract**: Issues NFT rewards for verified eco-friendly actions.
- **PaymentContract**: Handles payments and reward distributions.
- **RewardPoolContract**: Manages pooled NFT rewards and their distribution.
- **SolanaAdapterContract**: Facilitates data synchronization with the Solana blockchain.
- **UserProfileContract**: Stores and updates user profile information.
- **VerificationContract**: Manages submission and approval of eco-action verifications.

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Running Tests
```bash
npx hardhat test
```

### Deployment
To deploy contracts using Hardhat Ignition:
```bash
npx hardhat ignition deploy ./ignition/modules/deploy.ts
```

### Useful Hardhat Commands
```bash
npx hardhat help
npx hardhat node
```

## Project Structure
- `contracts/` — Solidity smart contracts
- `test/` — Test scripts for contracts
- `ignition/modules/` — Deployment scripts

## License
MIT

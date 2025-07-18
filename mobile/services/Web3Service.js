import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CONTRACT_ADDRESSES = {
  AMOY_TESTNET: {
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    contracts: {
      NFTReward: '0x65F7eA3A8F78cC4Da392215bb6407301fFA2c37A',
      Verification: '0x2580A8c411bd206d9E9127880BD126efBC8749f7',
      Leaderboard: '0x6B4Fd5cE9e72FD565923d6ecc3b55628D473b150',
      CarbonTracking: '0x97Ff1edcd1158568Df7b1e51A1E99F3AcF559cA6',
      Marketplace: '0x9561F0d68ECb0bB891ea00a34Bb2aD53b55bB0F1',
      IPFSStorage: '0x15B7C3659fd442CbCd134F29EBE30aC922A33C62'
    }
  }
};

// Contract ABIs (simplified for demo)
const NFT_REWARD_ABI = [
  "function mintNFT(address recipient, string memory tokenUri) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

const VERIFICATION_ABI = [
  "function submitVerification(address user, uint256 activityId, string memory ipfsHash) external",
  "function approveVerifications(uint256[] memory verificationIds) external",
  "function rejectVerifications(uint256[] memory verificationIds, string[] memory reasons) external",
  "function verifications(uint256 id) external view returns (address user, uint256 activityId, string memory ipfsHash, bool isVerified, bool isRejected, address verifier, string memory rejectionReason)",
  "function verificationCount() external view returns (uint256)",
  "event VerificationSubmitted(uint256 indexed verificationId, address user, string ipfsHash)",
  "event VerificationApproved(uint256 indexed verificationId, address verifier)",
  "event VerificationRejected(uint256 indexed verificationId, address verifier, string reason)"
];

const LEADERBOARD_ABI = [
  "function getUserScore(address user) external view returns (uint256)",
  "function getTopUsers(uint256 limit) external view returns (address[], uint256[])",
  "function updateUserScore(address user, uint256 score) external",
  "event ScoreUpdated(address indexed user, uint256 score)"
];

const CARBON_TRACKING_ABI = [
  "function getUserCarbonCredits(address user) external view returns (uint256)",
  "function trackCarbonReduction(address user, uint256 amount) external",
  "function getTotalCarbonReduction() external view returns (uint256)",
  "event CarbonReductionTracked(address indexed user, uint256 amount)"
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.providers.JsonRpcProvider(
        CONTRACT_ADDRESSES.AMOY_TESTNET.rpcUrl
      );

      // Initialize contracts
      this.contracts = {
        nftReward: new ethers.Contract(
          CONTRACT_ADDRESSES.AMOY_TESTNET.contracts.NFTReward,
          NFT_REWARD_ABI,
          this.provider
        ),
        verification: new ethers.Contract(
          CONTRACT_ADDRESSES.AMOY_TESTNET.contracts.Verification,
          VERIFICATION_ABI,
          this.provider
        ),
        leaderboard: new ethers.Contract(
          CONTRACT_ADDRESSES.AMOY_TESTNET.contracts.Leaderboard,
          LEADERBOARD_ABI,
          this.provider
        ),
        carbonTracking: new ethers.Contract(
          CONTRACT_ADDRESSES.AMOY_TESTNET.contracts.CarbonTracking,
          CARBON_TRACKING_ABI,
          this.provider
        )
      };

      this.isInitialized = true;
      console.log('Web3Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web3Service:', error);
      throw error;
    }
  }

  async connectWallet() {
    try {
      // For demo purposes, we'll use a simulated wallet connection
      // In a real app, this would integrate with MetaMask Mobile or WalletConnect
      const demoAddress = '0x742d35Cc6634C0532925a3b8D4C8dCC4D1b4F3';
      await AsyncStorage.setItem('connectedAddress', demoAddress);
      return demoAddress;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async getUserNFTs(userAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Web3Service not initialized');
      }

      // For demo purposes, return mock NFT data
      // In a real implementation, this would query the blockchain
      const mockNFTs = [
        {
          tokenId: 1,
          name: 'Green Commuter',
          description: 'Earned for using public transportation',
          image: 'https://example.com/nft1.png',
          attributes: [
            { trait_type: 'Activity', value: 'Public Transport' },
            { trait_type: 'CO2 Saved', value: '5kg' }
          ]
        },
        {
          tokenId: 2,
          name: 'Solar Power Champion',
          description: 'Earned for using solar energy',
          image: 'https://example.com/nft2.png',
          attributes: [
            { trait_type: 'Activity', value: 'Solar Energy' },
            { trait_type: 'CO2 Saved', value: '10kg' }
          ]
        }
      ];

      return mockNFTs;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }

  async getUserVerifications(userAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Web3Service not initialized');
      }

      // For demo purposes, return mock verification data
      const mockVerifications = [
        {
          id: 1,
          activityId: 101,
          ipfsHash: 'QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',
          isVerified: true,
          isRejected: false,
          verifier: '0x123...',
          rejectionReason: ''
        },
        {
          id: 2,
          activityId: 102,
          ipfsHash: 'QmYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy',
          isVerified: false,
          isRejected: true,
          verifier: '0x456...',
          rejectionReason: 'Insufficient proof provided'
        },
        {
          id: 3,
          activityId: 103,
          ipfsHash: 'QmZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZzZz',
          isVerified: false,
          isRejected: false,
          verifier: '0x000...',
          rejectionReason: ''
        }
      ];

      return mockVerifications;
    } catch (error) {
      console.error('Failed to get user verifications:', error);
      return [];
    }
  }

  async submitVerification(activityId, ipfsHash) {
    try {
      if (!this.isInitialized) {
        throw new Error('Web3Service not initialized');
      }

      // For demo purposes, simulate submission
      console.log('Submitting verification:', { activityId, ipfsHash });
      
      // In a real implementation, this would call the smart contract
      // const tx = await this.contracts.verification.submitVerification(
      //   userAddress,
      //   activityId,
      //   ipfsHash
      // );
      // await tx.wait();

      return { success: true, transactionHash: '0xmockTxHash' };
    } catch (error) {
      console.error('Failed to submit verification:', error);
      throw error;
    }
  }

  async getLeaderboard() {
    try {
      if (!this.isInitialized) {
        throw new Error('Web3Service not initialized');
      }

      // For demo purposes, return mock leaderboard data
      const mockLeaderboard = [
        { address: '0x1234567890123456789012345678901234567890', credits: 1500 },
        { address: '0x2345678901234567890123456789012345678901', credits: 1200 },
        { address: '0x3456789012345678901234567890123456789012', credits: 1000 },
        { address: '0x4567890123456789012345678901234567890123', credits: 800 },
        { address: '0x5678901234567890123456789012345678901234', credits: 600 }
      ];

      return mockLeaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  async getCarbonCredits(userAddress) {
    try {
      if (!this.isInitialized) {
        throw new Error('Web3Service not initialized');
      }

      // For demo purposes, return mock carbon credits
      return 750;
    } catch (error) {
      console.error('Failed to get carbon credits:', error);
      return 0;
    }
  }

  async trackCarbonReduction(userAddress, amount) {
    try {
      if (!this.isInitialized) {
        throw new Error('Web3Service not initialized');
      }

      // For demo purposes, simulate tracking
      console.log('Tracking carbon reduction:', { userAddress, amount });
      
      // In a real implementation, this would call the smart contract
      // const tx = await this.contracts.carbonTracking.trackCarbonReduction(
      //   userAddress,
      //   amount
      // );
      // await tx.wait();

      return { success: true, transactionHash: '0xmockTxHash' };
    } catch (error) {
      console.error('Failed to track carbon reduction:', error);
      throw error;
    }
  }

  async getContractBalance(contractAddress) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(contractAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Failed to get contract balance:', error);
      return '0';
    }
  }

  async getNetworkInfo() {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const network = await this.provider.getNetwork();
      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber: await this.provider.getBlockNumber()
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  formatAmount(amount, decimals = 18) {
    try {
      return ethers.utils.formatUnits(amount, decimals);
    } catch (error) {
      console.error('Failed to format amount:', error);
      return '0';
    }
  }

  parseAmount(amount, decimals = 18) {
    try {
      return ethers.utils.parseUnits(amount.toString(), decimals);
    } catch (error) {
      console.error('Failed to parse amount:', error);
      return ethers.BigNumber.from('0');
    }
  }
}

export default new Web3Service();

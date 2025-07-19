import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Web3Service from './services/Web3Service';

const GreenMintApp = () => {
  const [userNFTs, setUserNFTs] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [carbonCredits, setCarbonCredits] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activityId, setActivityId] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      await Web3Service.initialize();
      const savedAddress = await AsyncStorage.getItem('userAddress');
      if (savedAddress) {
        setUserAddress(savedAddress);
        setIsConnected(true);
        await loadUserData(savedAddress);
      }
      const netInfo = await Web3Service.getNetworkInfo();
      setNetworkInfo(netInfo);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Error', 'Failed to initialize the app. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      const address = await Web3Service.connectWallet();
      setUserAddress(address);
      setIsConnected(true);
      await AsyncStorage.setItem('userAddress', address);
      await loadUserData(address);
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      Alert.alert('Error', 'Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsConnected(false);
      setUserAddress('');
      setUserNFTs([]);
      setVerifications([]);
      setLeaderboard([]);
      setCarbonCredits(0);
      await AsyncStorage.removeItem('userAddress');
      Alert.alert('Success', 'Wallet disconnected successfully!');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const loadUserData = async (address) => {
    try {
      const [nfts, userVerifications, leaderboardData, credits] = await Promise.all([
        Web3Service.getUserNFTs(address),
        Web3Service.getUserVerifications(address),
        Web3Service.getLeaderboard(),
        Web3Service.getCarbonCredits(address),
      ]);
      
      setUserNFTs(nfts);
      setVerifications(userVerifications);
      setLeaderboard(leaderboardData);
      setCarbonCredits(credits);
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userAddress) {
      await loadUserData(userAddress);
    }
    setRefreshing(false);
  };

  const submitVerification = async () => {
    if (!activityId || !ipfsHash) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await Web3Service.submitVerification(parseInt(activityId), ipfsHash);
      Alert.alert('Success', 'Verification submitted successfully!');
      setActivityId('');
      setIpfsHash('');
      setShowSubmitModal(false);
      // Reload verifications
      const userVerifications = await Web3Service.getUserVerifications(userAddress);
      setVerifications(userVerifications);
    } catch (error) {
      console.error('Failed to submit verification:', error);
      Alert.alert('Error', 'Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{carbonCredits}</Text>
          <Text style={styles.statLabel}>Carbon Credits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{userNFTs.length}</Text>
          <Text style={styles.statLabel}>NFT Rewards</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{verifications.length}</Text>
          <Text style={styles.statLabel}>Verifications</Text>
        </View>
      </View>

      <View style={styles.networkInfo}>
        <Text style={styles.networkTitle}>Network Status</Text>
        {networkInfo && (
          <View style={styles.networkDetails}>
            <Text style={styles.networkText}>Chain ID: {networkInfo.chainId}</Text>
            <Text style={styles.networkText}>Block: {networkInfo.blockNumber}</Text>
            <Text style={styles.networkText}>Network: {networkInfo.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowSubmitModal(true)}
        >
          <Text style={styles.actionButtonText}>Submit Verification</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={styles.actionButtonText}>View Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderNFTItem = ({ item }) => (
    <View style={styles.nftItem}>
      <Image source={{ uri: item.image }} style={styles.nftImage} />
      <View style={styles.nftDetails}>
        <Text style={styles.nftTitle}>{item.name}</Text>
        <Text style={styles.nftDescription}>{item.description}</Text>
        <Text style={styles.nftTokenId}>Token ID: {item.tokenId}</Text>
        {item.attributes && (
          <View style={styles.nftAttributes}>
            {item.attributes.map((attr, index) => (
              <Text key={index} style={styles.nftAttribute}>
                {attr.trait_type}: {attr.value}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderVerificationItem = ({ item }) => (
    <View style={styles.verificationItem}>
      <View style={styles.verificationHeader}>
        <Text style={styles.verificationActivity}>Activity #{item.activityId}</Text>
        <View style={styles.verificationStatus}>
          <Text style={[
            styles.statusText,
            item.isVerified ? styles.verified : 
            item.isRejected ? styles.rejected : styles.pending
          ]}>
            {item.isVerified ? '✅ Verified' : 
             item.isRejected ? '❌ Rejected' : '⏳ Pending'}
          </Text>
        </View>
      </View>
      <Text style={styles.verificationHash}>
        IPFS: {item.ipfsHash.substring(0, 20)}...
      </Text>
      {item.isRejected && (
        <View style={styles.rejectionContainer}>
          <Text style={styles.rejectionReason}>
            Reason: {item.rejectionReason || 'No reason provided'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.leaderboardRank}>
        <Text style={styles.rankNumber}>#{index + 1}</Text>
      </View>
      <View style={styles.leaderboardInfo}>
        <Text style={styles.leaderboardAddress}>
          {Web3Service.formatAddress(item.address)}
        </Text>
        <Text style={styles.leaderboardCredits}>{item.credits} Credits</Text>
      </View>
      {item.address.toLowerCase() === userAddress.toLowerCase() && (
        <View style={styles.currentUserBadge}>
          <Text style={styles.currentUserText}>You</Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      
      case 'nfts':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Your NFT Collection</Text>
            <FlatList
              data={userNFTs}
              keyExtractor={(item) => item.tokenId.toString()}
              renderItem={renderNFTItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No NFTs found</Text>
                  <Text style={styles.emptySubtext}>
                    Complete green activities to earn NFT rewards
                  </Text>
                </View>
              }
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        );
      
      case 'verifications':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Verification History</Text>
            <FlatList
              data={verifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderVerificationItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No verifications found</Text>
                  <Text style={styles.emptySubtext}>
                    Submit your first green activity for verification
                  </Text>
                </View>
              }
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        );
      
      case 'leaderboard':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Community Leaderboard</Text>
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.address}
              renderItem={renderLeaderboardItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No leaderboard data</Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to earn carbon credits!
                  </Text>
                </View>
              }
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderSubmitModal = () => (
    <Modal
      visible={showSubmitModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSubmitModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Submit Verification</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Activity ID"
            value={activityId}
            onChangeText={setActivityId}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="IPFS Hash"
            value={ipfsHash}
            onChangeText={setIpfsHash}
            multiline
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSubmitModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={submitVerification}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Initializing GreenMint...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 GreenMint</Text>
        {isConnected && (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectWallet}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!isConnected ? (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome to GreenMint</Text>
          <Text style={styles.welcomeSubtext}>
            Join the carbon-neutral revolution and earn rewards for your green activities
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={connectWallet}>
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.userInfo}>
            <Text style={styles.addressText}>
              {Web3Service.formatAddress(userAddress)}
            </Text>
          </View>
          
          <View style={styles.tabContainer}>
            {['dashboard', 'nfts', 'verifications', 'leaderboard'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {renderTabContent()}
          {renderSubmitModal()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  networkInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  networkDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkText: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nftItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nftImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  nftDetails: {
    flex: 1,
  },
  nftTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nftDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  nftTokenId: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  nftAttributes: {
    marginTop: 5,
  },
  nftAttribute: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  verificationItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verificationActivity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  verificationHash: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  verificationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  verified: {
    color: '#4CAF50',
  },
  rejected: {
    color: '#f44336',
  },
  pending: {
    color: '#ff9800',
  },
  rejectionContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#f44336',
    fontStyle: 'italic',
  },
  leaderboardItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  leaderboardCredits: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  currentUserBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentUserText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GreenMintApp;

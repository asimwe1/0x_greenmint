import React, { useEffect, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('nfts');
  const [activityId, setActivityId] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');

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
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Error', 'Failed to initialize the app. Please try again.');
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
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

  const refreshData = async () => {
    if (userAddress) {
      await loadUserData(userAddress);
    }
  };

  const renderNFTItem = ({ item }) => (
    <View style={styles.nftItem}>
      <Image source={{ uri: item.image }} style={styles.nftImage} />
      <View style={styles.nftDetails}>
        <Text style={styles.nftTitle}>{item.name}</Text>
        <Text style={styles.nftDescription}>{item.description}</Text>
        <Text style={styles.nftTokenId}>Token ID: {item.tokenId}</Text>
      </View>
    </View>
  );

  const renderVerificationItem = ({ item }) => (
    <View style={styles.verificationItem}>
      <Text style={styles.verificationActivity}>Activity ID: {item.activityId}</Text>
      <Text style={styles.verificationHash}>IPFS: {item.ipfsHash.substring(0, 20)}...</Text>
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
      {item.isRejected && (
        <Text style={styles.rejectionReason}>Reason: {item.rejectionReason}</Text>
      )}
    </View>
  );

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={styles.leaderboardItem}>
      <Text style={styles.leaderboardRank}>#{index + 1}</Text>
      <Text style={styles.leaderboardAddress}>
        {item.address.substring(0, 6)}...{item.address.substring(-4)}
      </Text>
      <Text style={styles.leaderboardCredits}>{item.credits} Credits</Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nfts':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Your NFT Rewards</Text>
            <FlatList
              data={userNFTs}
              keyExtractor={(item) => item.tokenId.toString()}
              renderItem={renderNFTItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No NFTs found</Text>
              }
              refreshing={loading}
              onRefresh={refreshData}
            />
          </View>
        );
      
      case 'verifications':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Submit Verification</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Activity ID"
                value={activityId}
                onChangeText={setActivityId}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="IPFS Hash"
                value={ipfsHash}
                onChangeText={setIpfsHash}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitVerification}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>Submit Verification</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>Your Verifications</Text>
            <FlatList
              data={verifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderVerificationItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No verifications found</Text>
              }
              refreshing={loading}
              onRefresh={refreshData}
            />
          </View>
        );
      
      case 'leaderboard':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <View style={styles.creditsContainer}>
              <Text style={styles.creditsText}>Your Credits: {carbonCredits}</Text>
            </View>
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.address}
              renderItem={renderLeaderboardItem}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No leaderboard data</Text>
              }
              refreshing={loading}
              onRefresh={refreshData}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading && !isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.welcomeText}>Welcome to GreenMint Mobile</Text>
          <Text style={styles.welcomeSubtext}>
            Connect your wallet to start earning NFT rewards for your green activities
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={connectWallet}>
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.userInfo}>
            <Text style={styles.addressText}>
              Connected: {userAddress.substring(0, 6)}...{userAddress.substring(-4)}
            </Text>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'nfts' && styles.activeTab]}
              onPress={() => setActiveTab('nfts')}
            >
              <Text style={[styles.tabText, activeTab === 'nfts' && styles.activeTabText]}>
                NFTs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'verifications' && styles.activeTab]}
              onPress={() => setActiveTab('verifications')}
            >
              <Text style={[styles.tabText, activeTab === 'verifications' && styles.activeTabText]}>
                Verify
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
                Leaderboard
              </Text>
            </TouchableOpacity>
          </View>
          
          {renderTabContent()}
        </ScrollView>
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
    fontSize: 24,
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
  content: {
    flex: 1,
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
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
    borderRadius: 30,
    marginRight: 15,
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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  verificationActivity: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  verificationHash: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  verificationStatus: {
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
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
  rejectionReason: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 5,
    fontStyle: 'italic',
  },
  creditsContainer: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  creditsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaderboardItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  leaderboardAddress: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  leaderboardCredits: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default GreenMintApp;

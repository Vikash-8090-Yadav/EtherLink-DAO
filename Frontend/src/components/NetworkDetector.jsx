import React, { useState, useEffect } from 'react';
import { getCurrentNetworkConfig } from '../config/network';

const NetworkDetector = () => {
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const networkConfig = getCurrentNetworkConfig();

  useEffect(() => {
    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed to:', chainId);
        checkNetwork();
      });

      window.ethereum.on('accountsChanged', () => {
        checkNetwork();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
        window.ethereum.removeListener('accountsChanged', checkNetwork);
      }
    };
  }, []);

  const checkNetwork = async () => {
    if (!window.ethereum) {
      setIsWrongNetwork(true);
      setCurrentNetwork('No Wallet');
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsWrongNetwork(true);
      setCurrentNetwork('HTTPS Required');
      return;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const expectedChainId = `0x${networkConfig.chainId.toString(16)}`;
      
      console.log('Current chainId:', chainId);
      console.log('Expected chainId:', expectedChainId);
      
      if (chainId !== expectedChainId) {
        setIsWrongNetwork(true);
        setCurrentNetwork(chainId);
      } else {
        setIsWrongNetwork(false);
        setCurrentNetwork(chainId);
      }
    } catch (error) {
      console.error('Error checking network:', error);
      setIsWrongNetwork(true);
      setCurrentNetwork('Error');
    }
  };

  const switchToEtherlink = async () => {
    setIsLoading(true);
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${networkConfig.chainId.toString(16)}`,
          chainName: networkConfig.chainName,
          nativeCurrency: networkConfig.nativeCurrency,
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: [networkConfig.blockExplorerUrl]
        }]
      });
      
      // Check network again after switching
      setTimeout(() => {
        checkNetwork();
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error switching network:', error);
      setIsLoading(false);
      
      if (error.code === 4902) {
        alert('Please add Etherlink testnet to your wallet manually.');
      } else {
        alert('Failed to switch network. Please try again.');
      }
    }
  };

  if (!isWrongNetwork) {
    return null;
  }

  return (
    <div className="network-detector-overlay">
      <div className="network-detector-modal">
        <div className="network-detector-content">
          <div className="network-detector-header">
            <i className="fas fa-exclamation-triangle text-warning mr-2"></i>
            <h5 className="mb-0">Wrong Network Detected</h5>
          </div>
          
                      <div className="network-detector-body">
              {currentNetwork === 'HTTPS Required' ? (
                <div className="alert alert-warning">
                  <h6><i className="fas fa-lock mr-2"></i>HTTPS Required</h6>
                  <p className="mb-0">
                    MetaMask requires a secure connection (HTTPS) to connect to your wallet. 
                    Please ensure you're accessing this site via HTTPS.
                  </p>
                </div>
              ) : (
                <p className="text-muted mb-3">
                  You are currently connected to a different network. 
                  EtherLink DAO requires the Etherlink testnet to function properly.
                </p>
              )}
            
            <div className="network-info mb-3">
              <div className="row">
                <div className="col-md-6">
                  <strong>Current Network:</strong>
                  <span className="text-danger ml-2">{currentNetwork}</span>
                </div>
                <div className="col-md-6">
                  <strong>Required Network:</strong>
                  <span className="text-success ml-2">Etherlink Testnet</span>
                </div>
              </div>
            </div>
            
            <div className="network-details mb-4">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="fas fa-info-circle text-info mr-2"></i>
                    Network Details
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <small className="text-muted">Network Name:</small>
                      <div className="font-weight-bold">{networkConfig.chainName}</div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">Chain ID:</small>
                      <div className="font-weight-bold">{networkConfig.chainId}</div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">Currency:</small>
                      <div className="font-weight-bold">{networkConfig.nativeCurrency.symbol}</div>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted">RPC URL:</small>
                      <div className="font-weight-bold text-truncate">{networkConfig.rpcUrl}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="network-actions">
              <button 
                className="btn btn-primary btn-lg btn-block"
                onClick={switchToEtherlink}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Switching Network...
                  </>
                ) : (
                  <>
                    <i className="fas fa-exchange-alt mr-2"></i>
                    Switch to Etherlink Testnet
                  </>
                )}
              </button>
              
              <button 
                className="btn btn-outline-secondary btn-sm btn-block mt-2"
                onClick={checkNetwork}
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Check Again
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .network-detector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .network-detector-modal {
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .network-detector-header {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          border-radius: 10px 10px 0 0;
        }
        
        .network-detector-body {
          padding: 20px;
        }
        
        .network-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
        }
        
        .network-details .card {
          border: 1px solid #dee2e6;
        }
        
        .network-actions {
          text-align: center;
        }
        
        .btn-lg {
          padding: 12px 24px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default NetworkDetector; 
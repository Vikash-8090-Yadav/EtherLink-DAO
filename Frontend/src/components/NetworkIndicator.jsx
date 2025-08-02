import React, { useState, useEffect } from 'react';
import { getCurrentNetworkConfig } from '../config/network';

const NetworkIndicator = () => {
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const networkConfig = getCurrentNetworkConfig();

  useEffect(() => {
    checkNetwork();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
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
      setCurrentNetwork('No Wallet');
      setIsCorrectNetwork(false);
      setIsLoading(false);
      return;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const expectedChainId = `0x${networkConfig.chainId.toString(16)}`;
      
      if (chainId === expectedChainId) {
        setCurrentNetwork('Etherlink Testnet');
        setIsCorrectNetwork(true);
      } else {
        setCurrentNetwork('Wrong Network');
        setIsCorrectNetwork(false);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking network:', error);
      setCurrentNetwork('Error');
      setIsCorrectNetwork(false);
      setIsLoading(false);
    }
  };

  const getNetworkIcon = () => {
    if (isLoading) {
      return <i className="fas fa-spinner fa-spin"></i>;
    }
    
    if (isCorrectNetwork) {
      return <i className="fas fa-check-circle text-success"></i>;
    } else {
      return <i className="fas fa-exclamation-triangle text-warning"></i>;
    }
  };

  const getNetworkClass = () => {
    if (isLoading) return 'text-muted';
    if (isCorrectNetwork) return 'text-success';
    return 'text-warning';
  };

  if (!window.ethereum) {
    return null;
  }

  return (
    <div className={`network-indicator ${getNetworkClass()}`}>
      <span className="network-icon mr-1">
        {getNetworkIcon()}
      </span>
      <span className="network-text">
        {isLoading ? 'Checking...' : currentNetwork}
      </span>
      
      <style jsx>{`
        .network-indicator {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          margin-left: 10px;
        }
        
        .network-icon {
          font-size: 0.75rem;
        }
        
        .network-text {
          font-weight: 500;
        }
        
        .text-success {
          color: #28a745 !important;
        }
        
        .text-warning {
          color: #ffc107 !important;
        }
        
        .text-muted {
          color: #6c757d !important;
        }
      `}</style>
    </div>
  );
};

export default NetworkIndicator; 
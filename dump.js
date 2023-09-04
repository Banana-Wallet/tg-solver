const polygonRpcProvider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
const gnosisRpcProvider = new ethers.providers.JsonRpcProvider(GNOSIS_RPC);
const optimismRpcProvider = new ethers.providers.JsonRpcProvider(OPTIMISM_RPC);

const polygonSigner = new ethers.Wallet(
    (env === 'test') ? privateKey : wallet.privateKey,
    polygonRpcProvider
  );
  const gnosisSigner = new ethers.Wallet(
    (env === 'test') ? privateKey: wallet.privateKey,
    gnosisRpcProvider
  );
  const optimismSigner = new ethers.Wallet(
    (env === 'test') ? privateKey: wallet,
    optimismRpcProvider
  );

  const bananaPolygonInstance = new Banana(
    Chains.polygonMainnet,
    polygonSigner,
    paymasterOptions
  );
  const bananaGnosisInstance = new Banana(
    Chains.gnosis,
    gnosisSigner,
    paymasterOptions
  );
  const bananaOptimismInstance = new Banana(
    Chains.optimism,
    optimismSigner,
    paymasterOptions
  );

  userScaAddress = wallet.scaAddress;

  const bananaPolygonWallet = await bananaPolygonInstance.connectWallet();
  const bananaGnoisisWallet = await bananaGnosisInstance.connectWallet();
  const bananaOptimismWallet = await bananaOptimismInstance.connectWallet()

  {
    routeId: '1a56debc-f20a-4eab-b7f9-17a5225bf23e',
    isOnlySwapRoute: false,
    fromAmount: '1000000',
    toAmount: '748166',
    usedBridgeNames: [ 'hop' ],
    minimumGasBalances: { '100': '4200000000000000', '137': '60000000000000000' },
    chainGasBalances: {
      '100': { minGasBalance: '4200000000000000', hasGasBalance: false },
      '137': { minGasBalance: '60000000000000000', hasGasBalance: false }
    },
    totalUserTx: 1,
    sender: '0x288d1d682311018736B820294D22Ed0DBE372188',
    recipient: '0x288d1d682311018736B820294D22Ed0DBE372188',
    totalGasFeesInUsd: 0.017667514793316998,
    receivedValueInUsd: 0.730312485206683,
    inputValueInUsd: 0.99958,
    outputValueInUsd: 0.74798,
    userTxs: [
      {
        userTxType: 'fund-movr',
        txType: 'eth_sendTransaction',
        chainId: 137,
        toAmount: '748166',
        toAsset: [Object],
        stepCount: 1,
        routePath: '0-22',
        sender: '0x288d1d682311018736B820294D22Ed0DBE372188',
        approvalData: [Object],
        steps: [Array],
        gasFees: [Object],
        serviceTime: 600,
        recipient: '0x288d1d682311018736B820294D22Ed0DBE372188',
        maxServiceTime: 4500,
        bridgeSlippage: 0.5,
        userTxIndex: 0
      }
    ],
    serviceTime: 600,
    maxServiceTime: 4500,
    integratorFee: {
      amount: '0',
      asset: {
        chainId: 137,
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        symbol: 'USDC',
        name: 'USDCoin',
        decimals: 6,
        icon: 'https://maticnetwork.github.io/polygon-token-assets/assets/usdc.svg',
        logoURI: 'https://maticnetwork.github.io/polygon-token-assets/assets/usdc.svg',
        chainAgnosticId: 'USDC'
      }
    },
    extraData: {}
  }

  {
    routeId: 'd45962f2-7fff-43b7-8591-767e3c2be2d3',
    isOnlySwapRoute: false,
    fromAmount: '300000',
    toAmount: '48840',
    usedBridgeNames: [ 'hop' ],
    minimumGasBalances: { '100': '4200000000000000', '137': '60000000000000000' },
    chainGasBalances: {
      '100': { minGasBalance: '4200000000000000', hasGasBalance: false },
      '137': { minGasBalance: '60000000000000000', hasGasBalance: false }
    },
    totalUserTx: 1,
    sender: '0xb52b410F9ADFf930c12A8099b48cB86789FF2a91',
    recipient: '0xb52b410F9ADFf930c12A8099b48cB86789FF2a91',
    totalGasFeesInUsd: 0.017667514793316998,
    receivedValueInUsd: 0.031152485206683005,
    inputValueInUsd: 0.29987,
    outputValueInUsd: 0.04882,
    userTxs: [
      {
        userTxType: 'fund-movr',
        txType: 'eth_sendTransaction',
        chainId: 137,
        toAmount: '48840',
        toAsset: [Object],
        stepCount: 1,
        routePath: '0-22',
        sender: '0xb52b410F9ADFf930c12A8099b48cB86789FF2a91',
        approvalData: [Object],
        steps: [Array],
        gasFees: [Object],
        serviceTime: 600,
        recipient: '0xb52b410F9ADFf930c12A8099b48cB86789FF2a91',
        maxServiceTime: 4500,
        bridgeSlippage: 0.5,
        userTxIndex: 0
      }
    ],
    serviceTime: 600,
    maxServiceTime: 4500,
    integratorFee: {
      amount: '0',
      asset: {
        chainId: 137,
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        symbol: 'USDC',
        name: 'USDCoin',
        decimals: 6,
        icon: 'https://maticnetwork.github.io/polygon-token-assets/assets/usdc.svg',
        logoURI: 'https://maticnetwork.github.io/polygon-token-assets/assets/usdc.svg',
        chainAgnosticId: 'USDC'
      }
    },
    extraData: {}
  }
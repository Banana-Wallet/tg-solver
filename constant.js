export const welcomeMessage = (scaAddress, balance) => `
*Welcome to BananaBOT !!* 
You are now registered. 🎉

Your smart contract wallet address is: 
\`${scaAddress}\`

You smart contract wallet has been funded with below funds

Polygon wallet Balance:

${balance.Polygon.USDC} USDC
${balance.Polygon.USDT} USDT
${balance.Polygon.DAI} DAI

Gnosis wallet Balance:

${balance.Gnosis.USDC} USDC
${balance.Gnosis.USDT} USDT
${balance.Gnosis.DAI} DAI

Optimism wallet Balance:

${balance.Optimism.USDC} USDC
${balance.Optimism.USDT} USDT
${balance.Optimism.DAI} DAI

We have funded your *Polygon* wallet. if you want to test it on Gnosis and Optimism please fund it accordingly.

Please use below command to use this bot

/start: To initialize wallet
/balance: To query your wallet balance

*Get started with below prompts:*
`;

export const walletBalanceMessage = (walletAddress, balance) => `
SCA: ${walletAddress}

Polygon Balance:

${balance.Polygon.USDC} USDC
${balance.Polygon.USDT} USDT
${balance.Polygon.DAI} DAI

Gnosis Balance:

${balance.Gnosis.USDC} USDC
${balance.Gnosis.USDT} USDT
${balance.Gnosis.DAI} DAI

Optimism Balanace:

${balance.Optimism.USDC} USDC
${balance.Optimism.USDT} USDT
${balance.Optimism.DAI} DAI
`

export const POLYGON_RPC =
  "https://polygon-mainnet.g.alchemy.com/v2/M6obmh9NhecgkyNlK0G00anwrpBnjzwA";
export const GNOSIS_RPC = 'https://gnosis-mainnet.public.blastapi.io';
export const OPTIMISM_RPC =
  "https://opt-mainnet.g.alchemy.com/v2/Giavzm2VH00Eyxel4yEIsY-D-hGJl8W_";
export const ETH_RPC =
  "https://eth-mainnet.g.alchemy.com/v2/1GCs07IHxiIQeCR5Z2UFBOqpkQqCC8uC";

export const paymasterOptions = [
  {
    chainId: "137",
    paymasterUrl: `https://demo-paymaster.internal.candidelabs.com/polygon/71c6bedc7c3d1c7b4773c70fb972707a`,
    paymasterProvider: 'candide'
    // paymasterUrl: `https://api.pimlico.io/v1/polygon/rpc?apikey=1849c85d-46c8-4bee-8a6d-d6a0cba4d445`,
    // paymasterProvider: "pimlico",
  },
  {
    chainId: "10",
    paymasterUrl:
      "https://api.pimlico.io/v1/optimism/rpc?apikey=1849c85d-46c8-4bee-8a6d-d6a0cba4d445",
    paymasterProvider: "pimlico",
  },
  {
    chainId: "100",
    paymasterUrl:
      "https://api.pimlico.io/v1/gnosis/rpc?apikey=1849c85d-46c8-4bee-8a6d-d6a0cba4d445",
    paymasterProvider: "pimlico",
  },
];

export const polygonAddresses = {
  USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  MATIC: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  stMATIC: "0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4"
};

export const optimismAddresses = {
  USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
};

export const gnosisAddress = {
  USDC: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
  DAI: "0x44fA8E6f47987339850636F88629646662444217",
  USDT: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
  XDAI: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
};

export const MATIC_USD_FEED_ADDRESS =
  "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0";
export const XDAI_USD_FEED_ADDRESS =
  "0xa767f745331D267c7751297D982b050c93985627";
export const ETH_USD_FEED_ADDRESS =
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";

export const OneInchApiapproveUrl = (chain) =>
  `https://api.1inch.dev/swap/v5.2/${chain}/approve/transaction`;
export const OneInchApiswapUrl = (chain) =>
  `https://api.1inch.dev/swap/v5.2/${chain}/swap`;

export const SOCKET_BASEURL = 'https://api.socket.tech';

// const prompt1 = "Swap 0.1 USDC to DAI on Polygon";
// const prompt2 = "Get half of my USDC from polygon to Gnosis";
// const prompt3 = "Send 0.1 USDC on Polygon from Gnosis USDT balance";

export const preFormedPrompt_1_ATO = (tokenOwner) => [{
    'operation': 'SWAP',
    'sourceToken': 'USDC',
    'sourceTokenAmount': '0.1',
    'sourceChain': 'POLYGON',
    'destinationToken': 'USDT',
    'destinationTokenAmount': 'any',
    'tokenOwner': tokenOwner,
    'slippage': 'DEFAULT',
    'rate': 'DEFAULT'
}];

// export const preFormedPrompt_2_ATO = (tokenOwner) => [{
//     'operation': 'BRIDGE',
//     'sourceChain': 'POLYGON',
//     'destinationChain': 'GNOSIS', //! change it to gnosis
//     'token': 'USDC',
//     'tokenAmount': '0.4',
//     'sourceOwner': tokenOwner,
//     'destinationOwner': tokenOwner,
//     'delay': 'DEFAULT',
//     'reputation': 'DEFAULT',
//     'rate': 'DEFAULT',
//     'fees': 'DEFAULT',
//     'slippage': 'DEFAULT',
// }];

export const preFormedPrompt_2_ATO = (tokenOwner) => [{
  'operation': 'BRIDGE',
  'sourceChain': 'POLYGON',
  'destinationChain': 'OPTIMISM', //! change it to gnosis
  'token': 'USDC',
  'tokenAmount': '0.4',
  'sourceOwner': tokenOwner,
  'destinationOwner': tokenOwner,
  'delay': 'DEFAULT',
  'reputation': 'DEFAULT',
  'rate': 'DEFAULT',
  'fees': 'DEFAULT',
  'slippage': 'DEFAULT',
}];

export const preFormedPrompt_3_ATO  = (tokenOwner) => [{
    'operation': 'SWAP',
    'sourceToken': 'USDT',
    'sourceTokenAmount': '0.4',
    'sourceChain': 'POLYGON',
    'destinationToken': 'USDC',
    'destinationTokenAmount': 'any',
    'tokenOwner': tokenOwner,
    'slippage': 'DEFAULT',
    'rate': 'DEFAULT'
},
{
    'operation': 'BRIDGE',
    'sourceChain': 'POLYGON',
    'destinationChain': 'GNOSIS',
    'token': 'USDC',
    'tokenAmount': '0.4',
    'sourceOwner': tokenOwner,
    'destinationOwner': tokenOwner,
    'delay': 'DEFAULT',
    'reputation': 'DEFAULT',
    'rate': 'DEFAULT',
    'fees': 'DEFAULT',
    'slippage': 'DEFAULT',   
}];

// hardcoding it for now later on will remove this
export const WALLET_META = [{ chain: 'Polygon', balance: '0.5 USDC, 0.5 USDT, 0.5 DAI' }, { chain: 'Gnosis', balance: '0.5 USDC, 0.5 USDT, 0.5 DAI' }, { chain: 'Optimism', balance: '0.5 USDC, 0.5 USDT, 0.5 DAI' }];

export const CHAINS = [
    { name: 'Polygon', chainId: 137 },
    { name: 'Optimism', chainId: 10 },
    { name: 'Gnosis', chainId: 100 },
    { name: 'Matic', chainId: 137 }
];

export const SOCKET_ALLOWANCE_TARGET = '0x3a23F943181408EAC424116Af7b7790c94Cb97a5'

export const isJSON = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

export const USDC_USDT_DECIMAL = 10 ** 6;
export const DAI_DECIMAL = 10 ** 18;

export const intentSteps = (steps) => {
    let intention = '*Confirm your intention* \n';

    if(steps.length > 1) {
        steps.map((step, index) => {
            intention = intention + `${index + 1}: ${step.trim()}. \n`;
        });

        return intention;
    } 

    intention = `${steps[0].trim()}`;

    return intention;
}

export const WORMHOLE_CHAINS_ID = [
    {
        name: 'Polygon',
        chainId: 137,
        wormholeChainId: 5
    },
    {
        name: 'Gnosis',
        chainId: 100,
        wormholeChainId: 25
    }, 
    {
        name: 'Optimism',
        chainId: 10,
        wormholeChainId: 24
    }
];

export const POLYGON_WORMHOLE_BANANA = '0x5B7fc5809ad18E5b642e6b19191c23880b40324B'
export const ENSO_ROUTE_API = 'https://api.enso.finance/api/v1/shortcuts/route'
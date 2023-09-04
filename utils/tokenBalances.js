import { ethers, BigNumber } from "ethers";
import {
  gnosisAddress,
  polygonAddresses,
  optimismAddresses,
  POLYGON_RPC,
  OPTIMISM_RPC,
  GNOSIS_RPC,
} from "../constant.js";
import { USDC_USDT_DECIMAL, DAI_DECIMAL } from "../constant.js";

const tokenBalanceMethod = "alchemy_getTokenBalances";

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export const getTokenBalances = async (address) => {
  console.log("this is scw address", address);
  const polygonJsonRpcProvider = new ethers.providers.JsonRpcProvider(
    POLYGON_RPC
  );
  const optimismRpcProvider = new ethers.providers.JsonRpcProvider(
    OPTIMISM_RPC
  );
  const gnosisRpcProvider = new ethers.providers.JsonRpcProvider(GNOSIS_RPC);

  const polygonBalancesResp = await polygonJsonRpcProvider.send(
    tokenBalanceMethod,
    [address, "erc20"]
  );
  console.log(" this is repsonse ", polygonBalancesResp);
  const optimismBalancesResp = await optimismRpcProvider.send(
    tokenBalanceMethod,
    [address, "erc20"]
  );

  const gnosisUSDCContract = new ethers.Contract(
    gnosisAddress.USDC,
    erc20Abi,
    gnosisRpcProvider
  );
  const gnosisUSDTContract = new ethers.Contract(
    gnosisAddress.USDT,
    erc20Abi,
    gnosisRpcProvider
  );
  const gnosisDAIContract = new ethers.Contract(
    gnosisAddress.DAI,
    erc20Abi,
    gnosisRpcProvider
  );

  const gnosisUSDCBalancesResp = await gnosisUSDCContract.balanceOf(address);
  const gnosisUSDTBalancesResp = await gnosisUSDTContract.balanceOf(address);
  const gnosisDAIBalancesResp = await gnosisDAIContract.balanceOf(address);

  // console.log('polygon balance: ', polygonBalancesResp);
  // console.log('optimism balance: ', optimismBalancesResp);
  // console.log('balance for gnosis', gnosisDAIBalancesResp, gnosisUSDCBalancesResp, gnosisUSDTBalancesResp);

  let polygonUSDCBalance = polygonBalancesResp.tokenBalances.find(
    (balance) =>
      String(balance.contractAddress).toLowerCase() ===
      String(polygonAddresses.USDC).toLowerCase()
  );

  if (polygonUSDCBalance) {
    polygonUSDCBalance = parseInt(
      BigNumber.from(polygonUSDCBalance.tokenBalance)._hex
    );
  } else polygonUSDCBalance = 0;

  let optimismUSDCBalance = optimismBalancesResp.tokenBalances.find(
    (balance) =>
      String(balance.contractAddress).toLowerCase() ===
      String(optimismAddresses.USDC).toLowerCase()
  );

  if (optimismUSDCBalance) {
    optimismUSDCBalance = parseInt(
      BigNumber.from(optimismUSDCBalance.tokenBalance)._hex
    );
  } else optimismUSDCBalance = 0;

  let polygonUSDTBalance = polygonBalancesResp.tokenBalances.find(
    (balance) =>
      String(balance.contractAddress).toLowerCase() ===
      String(polygonAddresses.USDT).toLowerCase()
  );
  // console.log(balance.contractAddress);
//   console.log(String(polygonAddresses.USDT));

//   console.log("thgius is polygon usdt address ", polygonAddresses.USDT);
//   console.log(" this is rep ", polygonUSDTBalance);
//   console.log(
//     "Converted number",
//     parseInt(BigNumber.from(polygonUSDTBalance.tokenBalance)._hex)
//   );

  if (polygonUSDTBalance) {
    polygonUSDTBalance = parseInt(
      BigNumber.from(polygonUSDTBalance.tokenBalance)._hex
    );
  } else polygonUSDTBalance = 0;

  let optimismUSDTBalance = optimismBalancesResp.tokenBalances.find(
    (balance) =>
      String(balance.contractAddress).toLowerCase() ===
      String(optimismAddresses.USDT).toLowerCase()
  );

  if (optimismUSDTBalance) {
    optimismUSDTBalance = parseInt(
      BigNumber.from(optimismUSDTBalance.tokenBalance)._hex
    );
  } else optimismUSDTBalance = 0;

  let polygonDAIBalance = polygonBalancesResp.tokenBalances.find(
    (balance) =>
      String(balance.contractAddress).toLowerCase() ===
      String(polygonAddresses.DAI).toLowerCase()
  );
  console.log("polygon dai address", polygonAddresses.DAI);

  if (polygonDAIBalance) {
    polygonDAIBalance = parseInt(
      BigNumber.from(polygonDAIBalance.tokenBalance)._hex
    );
  } else polygonDAIBalance = 0;

  let optimismDAIBalance = optimismBalancesResp.tokenBalances.find(
    (balance) =>
      String(balance.contractAddress).toLowerCase() ===
      String(optimismAddresses.DAI).toLowerCase()
  );

  if (optimismDAIBalance) {
    optimismDAIBalance = parseInt(
      BigNumber.from(optimismDAIBalance.tokenBalance)._hex
    );
  } else optimismDAIBalance = 0;

  console.log(polygonUSDCBalance, polygonUSDTBalance, polygonDAIBalance);
  console.log(optimismDAIBalance, optimismUSDCBalance, optimismUSDTBalance);

  const tokenInfo = {
    'Polygon': {
      'USDC': (polygonUSDCBalance / USDC_USDT_DECIMAL).toFixed(3),
      'USDT': (polygonUSDTBalance / USDC_USDT_DECIMAL).toFixed(3),
      'DAI': (polygonDAIBalance / DAI_DECIMAL).toFixed(3),
    },
    'Optimism': {
      'USDC': (optimismUSDCBalance / USDC_USDT_DECIMAL).toFixed(3),
      'USDT': (optimismUSDTBalance / USDC_USDT_DECIMAL).toFixed(3),
      'DAI': (optimismDAIBalance / DAI_DECIMAL).toFixed(3),
    },
    'Gnosis': {
      'USDC': (parseInt(gnosisUSDCBalancesResp._hex) / USDC_USDT_DECIMAL).toFixed(3),
      'USDT': (parseInt(gnosisUSDTBalancesResp._hex) / USDC_USDT_DECIMAL).toFixed(3),
      'DAI': (parseInt(gnosisDAIBalancesResp._hex) / DAI_DECIMAL).toFixed(3),
    },
  };

  console.log("this is token info", tokenInfo);

  return tokenInfo;
};

// getTokenBalances('0x2C913310D30156450dFD5409f0fa9d7fCac99f7F');

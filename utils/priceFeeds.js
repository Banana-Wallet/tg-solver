import { ethers } from "ethers";
import {
  POLYGON_RPC,
  GNOSIS_RPC,
  ETH_RPC,
  MATIC_USD_FEED_ADDRESS,
  ETH_USD_FEED_ADDRESS,
  XDAI_USD_FEED_ADDRESS,
} from "../constant.js";

const aggregatorV3InterfaceABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const getMATICUSDPrice = async () => {
  const MaticUSDPrice = MATIC_USD_FEED_ADDRESS;

  const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);

  const priceFeedUSDT = new ethers.Contract(
    MaticUSDPrice,
    aggregatorV3InterfaceABI,
    provider
  );
  const USDTPrice = await priceFeedUSDT.latestRoundData();
  console.log("matic price ", USDTPrice);
  return {
    token: "MATIC",
    price: parseInt(USDTPrice.answer._hex) / 10 ** 8,
  };
};

export const getXDAIUSDPrice = async () => {
  const XdaiUSDPrice = XDAI_USD_FEED_ADDRESS;

  const provider = new ethers.providers.JsonRpcProvider(GNOSIS_RPC);

  const priceFeedUSDT = new ethers.Contract(
    XdaiUSDPrice,
    aggregatorV3InterfaceABI,
    provider
  );
  const USDTPrice = await priceFeedUSDT.latestRoundData();
  console.log("xdai price ", USDTPrice);
  return {
    token: "XDAI",
    price: parseInt(USDTPrice.answer._hex) / 10 ** 8,
  };
};

export const getETHUSDPrice = async () => {
  const EthUSDPrice = ETH_USD_FEED_ADDRESS;

  const provider = new ethers.providers.JsonRpcProvider(ETH_RPC);

  const priceFeedUSDT = new ethers.Contract(
    EthUSDPrice,
    aggregatorV3InterfaceABI,
    provider
  );
  const USDTPrice = await priceFeedUSDT.latestRoundData();
  console.log("eth price ", USDTPrice);
  return {
    token: "ETH",
    price: parseInt(USDTPrice.answer._hex) / 10 ** 8,
  };
};
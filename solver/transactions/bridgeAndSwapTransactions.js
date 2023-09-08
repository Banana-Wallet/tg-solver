import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { SOCKET_BASEURL } from "../../constant.js";

/**
 * Limitations:
 * 1) Min 0.3 USDC to be swapped and bridged (polygon -> gnosis )
 */

dotenv.config();

const apiHeaders = {
  "API-KEY": "72a5b4b0-e727-48be-8aa1-5da9d62fe635",
  Accept: "application/json",
  "Content-Type": "application/json",
};

const getQuote = async (
  fromChainId,
  fromTokenAddress,
  toChainId,
  toTokenAddress,
  fromAmount,
  userAddress,
  uniqueRoutesPerBridge,
  sort,
  singleTxOnly
) => {
  const response = await axios.get(
    `${SOCKET_BASEURL}/v2/quote?fromChainId=${fromChainId}&fromTokenAddress=${fromTokenAddress}&toChainId=${toChainId}&toTokenAddress=${toTokenAddress}&fromAmount=${fromAmount}&userAddress=${userAddress}&uniqueRoutesPerBridge=${uniqueRoutesPerBridge}&sort=${sort}&singleTxOnly=${singleTxOnly}`,
    {
      method: "GET",
      headers: apiHeaders,
    }
  );

  //   console.log("theser are api headdsr ", apiHeaders);

  //   console.log("this is response ", response.data.result.routes);
  //   console.log('user txns', response.data.result.routes[0].userTxs)
  //   console.log('user txns', response.data.result.routes[0].userTxs[0].steps)
  //   console.log('user txns', response.data.result.routes[0].userTxs[0].approvalData)

  if (response.data.success) {
    return response.data.result.routes[0]; // returning the very first route found
  }

  return "";
};

const parseTokenAmount = (tokenAmount, token) => {
  console.log("this is token to be parsed", token);
  if (token === "USDC" || token === "USDT") {
    return ethers.utils.parseUnits(tokenAmount, 6);
  }
  return ethers.utils.parseUnits(tokenAmount, 18);
};

const getRouteTransactionData = async (route) => {
  const response = await axios.post(
    `${SOCKET_BASEURL}/v2/build-tx`,
    { route: route },
    {
      headers: apiHeaders,
    }
  );

  return response.data;
};

async function getApprovalTransactionData(
  chainId,
  owner,
  allowanceTarget,
  tokenAddress,
  amount
) {
  const response = await axios.get(
    `${SOCKET_BASEURL}/v2/approval/build-tx?chainID=${chainId}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}&amount=${amount}`,
    {
      headers: apiHeaders,
    }
  );

  return response.data;
}

const checkAllowance = async (
  chainId,
  owner,
  allowanceTarget,
  tokenAddress
) => {
  const response = await axios.get(
    `${SOCKET_BASEURL}/v2/approval/check-allowance?chainID=${chainId}&owner=${owner}&allowanceTarget=${allowanceTarget}&tokenAddress=${tokenAddress}`,
    {
      headers: apiHeaders,
    }
  );

  return response.data;
};

const mockSwapAndBridgeData = {
  sourceChainId: 137,
  destinationChainId: 100,
  sourceTokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  destinationTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  sourceToken: "USDC",
  userAddress: "0xb52b410F9ADFf930c12A8099b48cB86789FF2a91",
  tokenAmount: "0.1",
};

export const constructSwapAndBridgeTransaction = async (swapAndBridgeData) => {
  const {
    sourceChainId,
    destinationChainId,
    sourceTokenAddress,
    destinationTokenAddress,
    tokenAmount,
    userAddress,
    sourceToken,
  } = swapAndBridgeData

  let txns = [];

  const fromChainId = sourceChainId;
  const toChainId = destinationChainId;
  const fromAssetAddress = sourceTokenAddress;
  const toAssetAddress = destinationTokenAddress;
  const amount = parseTokenAmount(String((Number(tokenAmount) - 0.01).toFixed(6)), sourceToken)
  const uniqueRoutesPerBridge = false; // Returns the best route for a given DEX / bridge combination
  const sort = "output"; // "output" | "gas" | "time"
  const singleTxOnly = true;

  console.log("api headers", apiHeaders);

  const route = await getQuote(
    fromChainId,
    fromAssetAddress,
    toChainId,
    toAssetAddress,
    amount,
    userAddress,
    uniqueRoutesPerBridge,
    sort,
    singleTxOnly
  );

  console.log("this is selected route ", route);

  if (!route) {
    // received empty route
    // no route avalaible for this intent
    return {
      success: false,
      context: "No route found for your intent",
      transactions: [],
    };
  }

  var context = [];

  //   const routeTxnData =
  const txnData = await getRouteTransactionData(route);
  console.log("this is txn data", txnData);
  const approvalData = txnData.result.approvalData;
  const { allowanceTarget, minimumApprovalAmount } = approvalData;

  console.log(
    "this is allowance target",
    allowanceTarget,
    minimumApprovalAmount
  );

  if (approvalData) {
    const allowanceCheckStatus = await checkAllowance(
      fromChainId,
      userAddress,
      allowanceTarget,
      fromAssetAddress
    );
    const allowanceValue = allowanceCheckStatus.result?.value;

    if (minimumApprovalAmount > allowanceValue) {
      // Approval tx data fetched
      const approvalTransactionData = await getApprovalTransactionData(
        fromChainId,
        userAddress,
        allowanceTarget,
        fromAssetAddress,
        amount
      );

      console.log("this is approval txn data ", approvalTransactionData);

      const approvalTxn = {
        to: approvalTransactionData.result.to,
        data: approvalTransactionData.result.data,
        value: "0",
        gasLimit: '0x55555'
      };

      let approvalContext = `Taking approval for ${String(Number(minimumApprovalAmount) / 10 ** 6)} ${sourceToken} to the Gateway contract`;
      context.push(approvalContext);
      txns.push(approvalTxn)
    }
  }

  let bridgeContext = `Bridging ${amount} ${sourceToken} using ${route.usedBridgeNames.map((bridgeName) => `${bridgeName} `)}`;
  context.push(bridgeContext);

  const bridgeTxn = {
    to: txnData.result.txTarget,
    data: txnData.result.txData,
    value: '0',
    gasLimit: '0x55555'
  };

  txns.push(bridgeTxn);

  console.log('final to be retuned', {
    success: true,
    context,
    transactions: txns
  })

  return {
    success: true,
    context,
    chainId: fromChainId,
    transactions: txns,
    delegateCall: false
  };
};

// constructSwapAndBridgeTransaction(mockSwapAndBridgeData);

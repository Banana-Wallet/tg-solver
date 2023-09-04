import { ethers } from "ethers";
import { OneInchApiswapUrl, OneInchApiapproveUrl } from "../../constant.js";
import Axios from "axios";
import dotenv from 'dotenv'

dotenv.config()

const isERC20 = (token) => token === 'USDC' || token === 'USDT' || token === 'DAI';

const headers = {
    'accept': '*/*',
    'Authorization': `Bearer ${process.env.ONEINCH_API}`
};

export const constructSwapTransaction = (swapData) => {
  console.log('this is swap data', swapData);
  const pair = swapData.pair;

  if(isERC20(pair[0])) return constructERC20SwapTransaction(swapData);
  else return constructNormalSwapTransaction(swapData);
}

const constructNormalSwapTransaction = async (swapData) => {
  let transactions = [];

  const chain = swapData.chain;

  let swapTransactionResp = await Axios.get(OneInchApiswapUrl(chain), {
    headers,
    params: {
      fromTokenAddress: swapData.tokenAddress1,
      toTokenAddress: swapData.tokenAddress2,
      amount: ethers.utils
      .parseUnits(swapData.amount, 18)
      .toString(),
      fromAddress: swapData.userAddress,
      slippage: 5, // hardcoding it for now
      disableEstimate: true,
      destReceiver: swapData.userAddress
    }
  });

  const swapTxn = {
    to: swapTransactionResp.data.tx.to,
    value: swapTransactionResp.data.tx.value,
    data: swapTransactionResp.data.tx.data
  }

  transactions.push(swapTxn);

  console.log('thesre are txns ', transactions)

  return {
    success: true,
    context: [`This transactions would swap your ${swapData.amount} of matic token against ${swapData.pair[1]} token.`],
    transactions
  };
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const constructERC20SwapTransaction = async (swapData) => {

  const chain = swapData.chain;

  let transactions = [];
  console.log('this is swap data ', swapData);

  // first give approval to 1inch router for the transaction
  let approvalTxnResp = await Axios.get(OneInchApiapproveUrl(chain), {
    headers,
    params: {
      tokenAddress: swapData.tokenAddress1,
      amount: ethers.utils
      .parseUnits(swapData.amount, 6)
      .toString()
    }
  });

  await sleep(1000); // due to 1inch api 1rps limit

  transactions.push(approvalTxnResp.data);
  // console.log(approvalTxnResp.data);
  console.log('these are params ', {
    fromTokenAddress: swapData.tokenAddress1,
    toTokenAddress: swapData.tokenAddress2,
    amount: ethers.utils
    .parseUnits(swapData.amount, 6)
    .toString(),
    fromAddress: swapData.userAddress,
    slippage: 40, // hardcoding it for now
    disableEstimate: true,
    // destReceiver: swapData.userAddress
  })
  
  // swap transction
  let swapTransactionResp = await Axios.get(OneInchApiswapUrl(chain), {
    headers,
    params: {
      fromTokenAddress: swapData.tokenAddress1,
      toTokenAddress: swapData.tokenAddress2,
      amount: ethers.utils
      .parseUnits(swapData.amount, 6)
      .toString(),
      fromAddress: swapData.userAddress,
      slippage: 40, // hardcoding it for now
      disableEstimate: true,
      // destReceiver: swapData.userAddress
    }
  })

  console.log(swapTransactionResp)

  const swapTxns = {
    to: swapTransactionResp.data.tx.to,
    value: swapTransactionResp.data.tx.value,
    data: swapTransactionResp.data.tx.data,
    gasPrice: swapTransactionResp.data.tx.gasPrice
  }

  transactions.push(swapTxns);

  return {
    success: true,
    context: [`The first transaction would take approval for ${swapData.amount} of ${swapData.pair[0]} token and then it would swap ${swapData.amount} of ${swapData.pair[0]} token for best rates`],
    transactions
  }
}
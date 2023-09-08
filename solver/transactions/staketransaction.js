import { ethers } from "ethers";
import axios from 'axios'
import { getMATICUSDPrice } from "../../utils/priceFeeds.js";
import { ENSO_ROUTE_API } from "../../constant.js";
import dotenv from 'dotenv'

dotenv.config()

// swapData = {
//     chain: sourceChainId,
//     pair: [sourceToken, destinationToken],
//     tokenAddress1,
//     tokenAddress2,
//     amount: !isAnyOrEmpty(String(ATO.sourceTokenAmount)) ? String(ATO.sourceTokenAmount) : String(ATO.destinationTokenAmount), // stringifying the field no matter what
//     userAddress: userAddress // for now     
// };
export const constructStakeTransaction = async (stakingData) => {
    const { amount, userAddress } = stakingData;
    const { ENSO_KEY } = process.env
    const maticInUsdPrice = await getMATICUSDPrice();
    const maticAmount = String((((parseFloat(1 / maticInUsdPrice.price)) * Number(amount)) - 0.05).toFixed(6))
    console.log('this is matic ajount ', maticAmount);
    const maticAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    const stMaticAddress = '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4'

    let lidoStakingResponse;
    console.log({
        chainId: 137,
        fromAddress: userAddress,
        amountIn: ethers.utils.parseEther(maticAmount),
        tokenInAmountToApprove: ethers.utils.parseEther(maticAmount),
        tokenInAmountToTransfer: ethers.utils.parseEther(maticAmount),
        amountIn:  ethers.utils.parseEther(maticAmount),
        minAmountOut: ethers.utils.parseEther(maticAmount),
        tokenIn: maticAddress,
        tokenOut: stMaticAddress
    })

    console.log('this is enso keys ', ENSO_KEY)

    // { 
    //     headers: {
    //         Authorization: `Bearer ${ENSO_KEY}`,
    //     }
    // }
    
    try {
        lidoStakingResponse = await axios.get(ENSO_ROUTE_API ,{
            params: {
                chainId: 137,
                fromAddress: userAddress,
                amountIn: ethers.utils.parseEther(maticAmount),
                tokenInAmountToApprove: ethers.utils.parseEther(maticAmount),
                tokenInAmountToTransfer: ethers.utils.parseEther(maticAmount),
                amountIn:  ethers.utils.parseEther(maticAmount),
                slippage: 2000,
                tokenIn: maticAddress,
                tokenOut: stMaticAddress
            }
        })
    } catch (err) {
        console.log('this ios error ', err)
        return {
            success: false,
            delegateCall: false,
            transactions: []
        }
    }

    console.log('lodi respo ', lidoStakingResponse)
    console.log('lodi respo ', lidoStakingResponse.data.tx)
    let stakingTxn = lidoStakingResponse.data.tx
    // stakingTxn.to = '0x7fEA6786D291A87fC4C98aFCCc5A5d3cFC36bc7b'
    
    stakingTxn = {
        ...stakingTxn,
        gasLimit: '0x55555'
    };
    console.log('this is taking txn ', stakingTxn)

    return {
        success: true,
        chainId: 137,
        transactions: [ stakingTxn ],
        context: [`Staking ${maticAmount} MATIC token to staking platform with enso protocol`],
        delegateCall: true
    }
}

const stakingData = {
    amount: '0.34',
    userAddress: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4'
}

// constructStakeTransaction(stakingData);
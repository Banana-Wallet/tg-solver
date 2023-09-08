import { ethers } from "ethers";
import BananaAccount from '../../abi/BananaAccount.json' assert { type: "json" };
import { WORMHOLE_CHAINS_ID, POLYGON_WORMHOLE_BANANA, POLYGON_RPC } from "../../constant.js";

const wormholeEvmPayloadFee = async (targetChainWormholeId) => {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    const BananaContract = new ethers.Contract(POLYGON_WORMHOLE_BANANA, BananaAccount.abi, provider);

    console.log('wormhokle chain id ', targetChainWormholeId)
    const cost = await BananaContract.quoteCrossChainDeposit(targetChainWormholeId);
    //  BananaAccount.quoteCrossChainDeposit(targetChainWormholeId);

    console.log('this is cost', cost)
    // return cost;    
}

// use this when only bridge is needed
export const constructBridgeTransaction = async (swapAndBridgeData) => {
    const {
        sourceChainId,
        destinationChainId,
        sourceTokenAddress,
        tokenAmount,
        sourceToken,
        userAddress
      } = swapAndBridgeData
    const wormholeChain = WORMHOLE_CHAINS_ID.find(chain => chain.chainId === destinationChainId);
    const wormholeChainId = wormholeChain.chainId
    const wormholeChainName = wormholeChain.name;
    await wormholeEvmPayloadFee(wormholeChainId);

    const wormholeSendTokenData = new ethers.utils.Interface(BananaAccount.abi).encodeFunctionData(
        'sendCrossChainDeposit',[
            wormholeChainId,
            userAddress, // need to check this thing
            '0x5B7fc5809ad18E5b642e6b19191c23880b40324B',
            ethers.utils.parseUnits(tokenAmount, 6),
            sourceTokenAddress
        ]
    );
    
    return {
        success: true,
        context: [`This transaction will bridge ${tokenAmount} ${sourceToken} to your wallet at ${wormholeChainName} chain.`],
        chainId: sourceChainId,
        delegateCall: false,
        transactions: [
            {
                to: userAddress,
                value: '0',
                data: wormholeSendTokenData,
                gasLimit: '0x55555'
            }
        ]
    };
};

// constructBridgeTransaction();

// wormholeEvmPayloadFee(24)
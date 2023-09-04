import { checkChainSimilarity, checkTokenSimilarity } from "../../utils/utils.js";
import { polygonAddresses, gnosisAddress, optimismAddresses } from "../../constant.js";
import { isAnyOrEmpty } from "../validation/ATOValidation.js";

export const bridgeAndSwapTxnExtractor = (ATO, userAddress) => {
    let swapAndBridgeData = {};
    let bridgeATO;
    let swapATO;

    if(ATO.length > 1) {
        swapATO = ATO[0];
        bridgeATO = ATO[1];
    } else {
        bridgeATO = ATO[0];
    }

    let sourceToken;
    if(ATO.length > 1) {
        sourceToken = checkTokenSimilarity(swapATO.sourceToken)[0].name;
    } else {
        sourceToken = checkTokenSimilarity(bridgeATO.token)[0].name;
    }

    const destinationToken = checkTokenSimilarity(bridgeATO.token)[0].name;
    const sourceChainId = checkChainSimilarity(bridgeATO.sourceChain)[0].chainid;
    const destinationChainId = checkChainSimilarity(bridgeATO.destinationChain)[0].chainid;
    let tokenAmount = !isAnyOrEmpty(String(bridgeATO.tokenAmount)) ? String(bridgeATO.tokenAmount): 'any';

    if(ATO.length > 1) {
        if(tokenAmount === 'any') {
            tokenAmount = String(swapATO.sourceTokenAmount);
        }
    };

    let sourceTokenAddress, destinationTokenAddress;

    switch (sourceChainId) {
        case 137: {
            sourceTokenAddress = polygonAddresses[sourceToken]
            break;
        }
        case 10: {
            sourceTokenAddress = optimismAddresses[sourceToken]
            break
        }
        case 100: {
            sourceTokenAddress = gnosisAddress[sourceToken]
            break
        }
    };

    switch(destinationChainId) {
        case 137: {
            destinationTokenAddress = polygonAddresses[destinationToken]
            break
        }
        case 10: {
            destinationTokenAddress = optimismAddresses[destinationToken]
            break
        }
        case 100: {
            destinationTokenAddress = gnosisAddress[destinationToken]
        }
    }

    swapAndBridgeData = {
        ...swapAndBridgeData,
        sourceToken,
        destinationToken,
        sourceTokenAddress,
        destinationTokenAddress,
        tokenAmount,
        sourceChainId,
        destinationChainId,
        userAddress
    };

    return swapAndBridgeData;
}
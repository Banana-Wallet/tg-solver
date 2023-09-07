import { polygonAddresses, gnosisAddress, optimismAddresses } from "../../constant.js";
import { checkTokenSimilarity, checkChainSimilarity } from "../../utils/utils.js";
import { isAnyOrEmpty } from "../validation/ATOValidation.js";

//! here we have to find out in case if user didn't mentioned source token
export const swapTxnDataExtractor = (ATO, userAddress, userBalances) => {
    let swapData = {};
    let sourceChain = ATO.sourceChain;
    const sourceChainId = checkChainSimilarity(sourceChain)[0].chainid;
    let sourceToken = checkTokenSimilarity(ATO.sourceToken)[0].name;
    let destinationToken = checkTokenSimilarity(ATO.destinationToken)[0].name;

    let tokenAddress1 = '', tokenAddress2 = ''; 
    console.log('this is souce chain id', sourceChainId)

    switch (sourceChainId) {
        case 137: {
            tokenAddress1 = polygonAddresses[sourceToken]
            tokenAddress2 = polygonAddresses[destinationToken]
            break
        }
        case 10: {
            tokenAddress1 = optimismAddresses[sourceToken]
            tokenAddress2 = optimismAddresses[destinationToken]
            break
        }
        case 100: {
            tokenAddress1 = gnosisAddress[sourceToken]
            tokenAddress2 = gnosisAddress[destinationToken]
            break
        }
    };

    //! here ATO will be having all the filled always

    swapData = {
        chain: sourceChainId,
        pair: [sourceToken, destinationToken],
        tokenAddress1,
        tokenAddress2,
        amount: !isAnyOrEmpty(String(ATO.sourceTokenAmount)) ? String(ATO.sourceTokenAmount) : String(ATO.destinationTokenAmount), // stringifying the field no matter what
        userAddress: userAddress // for now     
    };

    console.log('this is swap data' , swapData);

    return swapData;
};
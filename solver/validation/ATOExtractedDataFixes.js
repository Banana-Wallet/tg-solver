const chains = [{
    name: 'Polygon',
    chainId: 137
}, {
    name: 'Gnosis',
    chainId: 100
}, {
    name: 'Optimism',
    chainId: 10
}];

export const ATOIntegrityValidation = (txnData, isBridge, userBalance) => {
    console.log(' this is tn data ', txnData)
    if(!isBridge) { // normal swap
        const chainName = chains.find(chain => chain.chainId === txnData.chain);
        console.log('integtti y ', Number(userBalance[chainName.name][txnData.pair[0]]) < Number(txnData.amount))
        if(Number(userBalance[chainName.name][txnData.pair[0]]) < Number(txnData.amount)) {
            return {
                isError: true,
                errorReason: `Insufficient ${txnData.pair[0]} balance for the swap.`
            }
        };

        return {
            isError: false,
            errorReason: ''
        }
    } else { // normal bridge
        const chainName = chains.find(chain => chain.chainId === txnData.sourceChainId);
        console.log('integtti check y ', userBalance[chainName.name][txnData.sourceToken] < Number(txnData.tokenAmount));
        if(Number(userBalance[chainName.name][txnData.sourceToken]) < Number(txnData.tokenAmount)) {
            return {
                isError: true,
                errorReason: `Insufficient ${txnData.sourceToken} balance for the swap/bridge.`
            }
        };

        return {
            isError: false,
            errorReason: ''
        };
    }
}
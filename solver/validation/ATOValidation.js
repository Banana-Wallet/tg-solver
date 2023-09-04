import { checkTokenSimilarity, checkChainSimilarity } from "../../utils/utils.js";

//! need to make sure in case if user choose both same source and destination chain and then he should not choose sourceToken and destination token
//! need to make sure in case if user choose both same sourceToken and destinationToken then he shouldn't be able to choose same sourceChain and destinationChain
//! Balance checks are remaining

const mockBalances = {
    polygon: {
        USDT: '0.5',
        USDC: '0.5',
        DAI: '0.5'
    },
    gnosis: {
        USDT: '0.5',
        USDC: '0.5',
        DAI: '0.5'
    },
    optimism: {
        USDT: '0.5',
        USDC: '0.5',
        DAI: '0.5'
    }
};

/**
 * returns { questions: [{ text: 'question-text', ans: 'question-ans' }] 
 */
const isNumeric = (str) => {
    return !isNaN(parseFloat(str)) && isFinite(str);
  }
export const isAnyOrEmpty = (info) => (info === '' || info === 'any');

const getRemainingTokens = (token) => {
    return checkTokenSimilarity(token);
}

const getBalanceOptions = (userBalance) => {
    const interval = 0.1;
    let avalaibleBalance = [];
    for (let i = interval; i < Number(userBalance); i += interval) {
        values.push(Math.round(i * 10) / 10);  // Rounding to one decimal place
    }
    return avalaibleBalance;
}

const mandatorySwapATOProps = ['operation', 'sourceToken', 'sourceTokenAmount', 'sourceChain', 'destinationToken', 'destinationTokenAmount', 'tokenOwner'];
const mandatoryBridgeATOProps = ['operation', 'sourceChain', 'destinationChain', 'token', 'tokenAmount', 'sourceOwner', 'destinationOwner'];

const swapKeysToChecks = ['sourceToken', 'destinationToken', 'sourceChain'];
const bridgeKeysToCheck = ['sourceChain', 'destinationChain', 'token'];

export const isValueValid = (value) => {
    return value === '' || value === 'any' || checkChainSimilarity(value)[0].score > 0.2 || checkTokenSimilarity(value)[0].score > 0.2
}

export const attachMandatoryFieldsForSwap = (ATO) => {
    const absentSwapATOProps = mandatorySwapATOProps.filter(prop => !ATO[0].hasOwnProperty(prop));
    ATO.forEach((obj, index) => {
        if (index === 0) {
            absentSwapATOProps.forEach((prop) => {
                obj[prop] = 'any';
            });
        }
    });

    ATO.forEach((obj, index) => {
        swapKeysToChecks.map(prop => {
            if(!isValueValid(obj[prop])) {
                obj[prop] = 'any';
            }
        })
    });
  
    return ATO;
}

export const attachMandatoryFieldsForSwapAndBridge = (ATO) => {

    // ATO.forEach((obj, index) => {
    //     Object.keys(obj).map(prop => {
    //         if(!isValueValid(obj[prop])) {
    //             obj[prop] = 'any';
    //         }
    //     })
    // });

    // only bridge txn
    if(ATO.length === 1) {
        const absentBridgeATOProps = mandatoryBridgeATOProps.filter(prop => !ATO[0].hasOwnProperty(prop));

        console.log('abset bridge props ', absentBridgeATOProps)

        ATO.forEach((obj, index) => {
            bridgeKeysToCheck.map(prop => {
                if(!isValueValid(obj[prop])) {
                    console.log('this props is valid', isValueValid(obj[prop]));
                    obj[prop] = 'any';
                }
            })
        });
        
        ATO.forEach((obj, index) => {
            if (index === 0) {
                absentBridgeATOProps.forEach((prop) => {
                    obj[prop] = 'any';
                });
            }
        });
    } else {
        const absentSwapATOProps = mandatorySwapATOProps.filter(prop => !ATO[0].hasOwnProperty(prop));
        const absentBridgeATOProps = mandatoryBridgeATOProps.filter(prop => !ATO[1].hasOwnProperty(prop));

        ATO.forEach((obj, index) => {
            if (index === 0) {
                absentSwapATOProps.forEach((prop) => {
                    obj[prop] = 'any';
                });
            }

            if(index === 1) {
                absentBridgeATOProps.forEach((prop) => {
                    obj[prop] = 'any';
                });
            }
        });

        ATO.forEach((obj, index) => {

            if(index === 0) {
                swapKeysToChecks.map(prop => {
                    if(!isValueValid(obj[prop])) {
                        obj[prop] = 'any';
                    }
                })
            }

            if(index === 1) {
                bridgeKeysToCheck.map(prop => {
                    if(!isValueValid(obj[prop])) {
                        obj[prop] = 'any';
                    }
                })
            }
        });
    }

    return ATO;
}

export const ATOValidationForSwap = (ATO, userBalances) => {

    let questions = [];
    // const mandatorySwapATOProps = ['operation', 'sourceToken', 'sourceTokenAmount', 'sourceChain', 'destinationToken', 'destinationTokenAmount', 'tokenOwner'];

    // const absentSwapATOProps = mandatorySwapATOProps.filter(prop => !ATO.hasOwnProperty(prop));

    if(ATO.length > 2) return 'Invalid ATO provided'; 
    const swapATO = ATO;
    console.log('this is ATO', ATO);

    if(isAnyOrEmpty(swapATO.destinationToken) && isAnyOrEmpty(swapATO.sourceToken)) {
        questions.push({
            text: `Which token would you like to swap ?`,
            ans: '',
            options: ['USDT', 'USDC', 'DAI'],
            index: 0,
            field: 'sourceToken'
        });

        questions.push({
            text: `Which token would you like to get on swapping ?`,
            ans: '',
            options: ['USDT', 'USDC', 'DAI'],
            index: 0,
            field: 'destinationToken'
        });
    };

    if(isAnyOrEmpty(swapATO.destinationToken) && !isAnyOrEmpty(swapATO.sourceToken)) {
        let remainingTokens = getRemainingTokens(swapATO.sourceToken);
        remainingTokens.shift()
        let tokens = remainingTokens.map(token => token.name)
        console.log('these are again remain tokens when no source token', remainingTokens);
        questions.push({
            text: `Which token would you like to get on swapping ${swapATO.sourceToken} token ?`,
            ans: '',
            options: tokens,
            index: 0,
            field: 'sourceToken'
        });
    }

    if(isAnyOrEmpty(swapATO.sourceToken) && !isAnyOrEmpty(swapATO.destinationToken)) {
        let remainingTokens = getRemainingTokens(swapATO.destinationToken)
        remainingTokens.shift()
        let tokens = remainingTokens.map(token => token.name)
        console.log('these are remaining tokens ', remainingTokens);

        questions.push({
            text: `What token would you like to swap to get ${swapATO.destinationToken} token ?`,
            ans: '',
            options: tokens,
            index: 0,
            field: 'destinationToken'
        })
    };

    if(isAnyOrEmpty(swapATO.sourceTokenAmount) && isAnyOrEmpty(swapATO.destinationTokenAmount)) {
        questions.push({
            text: `How many token you want to swap ?`,
            ans: '',
            options: ['0.1', '0.2', '0.3'], // need to get it confirmed from the user balance get the lowest balance here and then make the options basedn on it
            index: 0,
            field: 'destinationTokenAmount'
        });
    };

    if(isAnyOrEmpty(swapATO.sourceChain)) {
        questions.push({
            text: 'At which chain you want swap to happen Polygon, Gnosis or Optimism ?',
            ans: '',
            options: ['Polygon', 'Gnosis', 'Optimism'],
            index: 0,
            field: 'sourceChain'
        })
    };

    if(!isAnyOrEmpty(swapATO.sourceTokenAmount) && !isAnyOrEmpty(swapATO.sourceChain) && !isAnyOrEmpty(swapATO.sourceToken)) {
        const chain = checkChainSimilarity(swapATO.sourceChain)[0].name;
        const token = checkTokenSimilarity(swapATO.sourceToken)[0].name;
        const userSourceTokenBalance = userBalances[chain][token];

        if(Number(userSourceTokenBalance) < Number(swapATO.sourceTokenAmount)) {
            questions.push({
                text: `Amount of ${swapATO.sourceToken} token you are trying to swap exceeds your balance Please select any amount from below to swap`,
                ans: '',
                options: getBalanceOptions(Number(userSourceTokenBalance)),
                index: 0,
                field: 'sourceTokenAmount'
            });
        };
    }

    if(!isAnyOrEmpty(swapATO.destinationTokenAmount) && !isAnyOrEmpty(swapATO.sourceChain) && !isAnyOrEmpty(swapATO.sourceToken)) {
        const chain = checkChainSimilarity(swapATO.sourceChain)[0].name;
        const token = checkTokenSimilarity(swapATO.sourceToken)[0].name;
        const userSourceTokenBalance = userBalances[chain][token];

        if(Number(userSourceTokenBalance) < Number(swapATO.destinationTokenAmount)) {
            questions.push({
                text: `You don't have enough ${swapATO.sourceToken} to get ${swapATO.destinationTokenAmount} ? Please select any amount from below to proceed`,
                ans: '',
                options: getBalanceOptions(Number(userSourceTokenBalance)),
                index: 0,
                field: 'destinationTokenAmount'
            });
        };
    }

    return questions;
}

export const ATOValidationForSwapAndBridge = (ATO, userBalances) => {
    if(ATO.length > 2) return 'Invalid ATO provided';

    let questions = [];

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
        if(!isAnyOrEmpty(swapATO.sourceToken)) {
            sourceToken = checkTokenSimilarity(swapATO.sourceToken)[0].name;
        } else sourceToken = 'any'
    } else {
        if(!isAnyOrEmpty(bridgeATO.token)) {
            sourceToken = checkTokenSimilarity(bridgeATO.token)[0].name
        } else sourceToken = 'any';
    }

    const destinationToken = !isAnyOrEmpty(bridgeATO.token) ? checkTokenSimilarity(bridgeATO.token)[0].name : 'any';
    const sourceChain = !isAnyOrEmpty(bridgeATO.sourceChain) ? checkChainSimilarity(bridgeATO.sourceChain)[0].name : 'any';
    const destinationChain = !isAnyOrEmpty(bridgeATO.destinationChain) ? checkChainSimilarity(bridgeATO.destinationChain)[0].name : 'any';
    // if we have source token amount in swap then we can also use it here
    let tokenAmount = !isAnyOrEmpty(bridgeATO.tokenAmount) ? bridgeATO.tokenAmount: 'any';

    if(ATO.length > 1) {
        if(tokenAmount === 'any') {
            tokenAmount = !isAnyOrEmpty(swapATO.tokenAmount) ? swapATO.tokenAmount: 'any';
        }
    } 

    swapAndBridgeData = {
        ...swapAndBridgeData,
        sourceToken,
        destinationToken,
        sourceChain,
        destinationChain,
        tokenAmount
    };

    if(isAnyOrEmpty(swapAndBridgeData.tokenAmount)) {
        questions.push({
            text: 'How much amount of token you want to bridge ?',
            ans: '',
            options: ['0.1', '0.2', '0.3', '0.4', '0.5'],
            index: ATO.length > 1 ? 1 : 0,
            field: 'tokenAmount' 
        });
    }

    if(isAnyOrEmpty(swapAndBridgeData.sourceChain)) {
        const chains = checkChainSimilarity(swapAndBridgeData.destinationChain);
        chains.shift();
        let chainNames = chains.map(chain => chain.name);
        questions.push({
            text: 'What should be the source chain for bridging tokens ?',
            ans: '',
            options: chainNames,
            index: ATO.length > 1 ? 1 : 0,
            field: 'sourceChain'
        });
    }

    if(isAnyOrEmpty(swapAndBridgeData.destinationChain)) {
        const chains = checkChainSimilarity(swapAndBridgeData.sourceChain);
        chains.shift()
        let chainNames = chains.map(chain => chain.name)
        questions.push({
            text: 'Where should we bridge your tokens ?',
            ans: '',
            options: chainNames,
            index: ATO.length > 1 ? 1 : 0,
            field: 'destinationChain'
        });
    }
    

    if(isAnyOrEmpty(swapAndBridgeData.sourceToken)) {
        const tokens = checkTokenSimilarity(swapAndBridgeData.destinationToken);
        tokens.shift()
        let tokenNames = tokens.map(token => token.name)
        questions.push({
            text: 'Which source token to be used for bridging ?',
            ans: '',
            options: tokenNames,
            index: 0,
            field: 'sourceToken'
        })
    }

    if(isAnyOrEmpty(swapAndBridgeData.destinationToken)) {
        const tokens = checkTokenSimilarity(swapAndBridgeData.sourceToken);
        tokens.shift()
        let tokenNames = tokens.map(token => token.name);
        questions.push({
            text: 'Which token you want in your desination chain ?',
            ans: '',
            options: tokenNames,
            index: ATO.length > 1 ? 1 : 0,
            field: 'destinationToken'
        });
    };

    // token balance checks

    if(ATO.length > 1) {
        if(!isAnyOrEmpty(swapATO.sourceTokenAmount) && !isAnyOrEmpty(swapATO.sourceChain) && !isAnyOrEmpty(swapATO.sourceToken)) {
            const chain = checkChainSimilarity(swapATO.sourceChain)[0].name;
            const token = checkTokenSimilarity(swapATO.sourceToken)[0].name;
            const userSourceTokenBalance = userBalances[chain][token];
    
            if(Number(userSourceTokenBalance) < Number(swapATO.sourceTokenAmount)) {
                questions.push({
                    text: `Amount of ${swapATO.sourceToken} token you are trying to swap exceeds your balance Please select any amount from below to swap`,
                    ans: '',
                    options: getBalanceOptions(Number(userSourceTokenBalance)),
                    index: 0,
                    field: 'sourceTokenAmount'
                });
            };
        }
    
        if(!isAnyOrEmpty(swapATO.destinationTokenAmount) && !isAnyOrEmpty(swapATO.sourceChain) && !isAnyOrEmpty(swapATO.sourceToken)) {
            const chain = checkChainSimilarity(swapATO.sourceChain)[0].name;
            const token = checkTokenSimilarity(swapATO.sourceToken)[0].name;
            const userSourceTokenBalance = userBalances[chain][token];
    
            if(Number(userSourceTokenBalance) < Number(swapATO.destinationTokenAmount)) {
                questions.push({
                    text: `You don't have enough ${swapATO.sourceToken} to get ${swapATO.destinationTokenAmount} ? Please select any amount from below to proceed`,
                    ans: '',
                    options: getBalanceOptions(Number(userSourceTokenBalance)),
                    index: 0,
                    field: 'destinationTokenAmount'
                });
            };
        }
    } else {
        if(!isAnyOrEmpty(bridgeATO.sourceChain) && !isAnyOrEmpty(bridgeATO.tokenAmount) && !isAnyOrEmpty(bridgeATO.sourceToken)) {
            console.log('this is bridge ATO', bridgeATO);
            const chain = checkChainSimilarity(bridgeATO.sourceChain)[0].name;
            const token = checkTokenSimilarity(bridgeATO.token)[0].name;

            const userSourceTokenBalance = userBalances[chain][token];

            if(Number(userSourceTokenBalance) < Number(bridgeATO.tokenAmount)) {
                questions.push({
                    text: `You don't have enough ${bridgeATO.token} token to bridge ? Please select any amount from below to bridge `,
                    ans: '',
                    options: getBalanceOptions(Number(userSourceTokenBalance)),
                    index: 0,
                    field: 'tokenAmount'
                })
            }
        }
    }

    return questions;
}
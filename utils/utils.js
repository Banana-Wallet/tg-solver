import { CHAINS } from "../constant.js";
import { checkSimilarity } from "./bigramSimilarity.js";

export const checkChainSimilarity = (AToChain) => {
    let chains = CHAINS.map(chain =>  { 
        return { 
            name: chain.name, 
            chainid: chain.chainId, 
            score: checkSimilarity(chain.name, AToChain)
        }
    });
    chains.sort((chainA, chainB) => chainB.score - chainA.score);
    console.log('these are chains ', chains)

    if(chains[0].name === 'Matic') {
        chains[0].name = 'Polygon';
    }

    return chains;
}

export const checkTokenSimilarity = (ATOToken) => {
    let tokens = ['USDC', 'USDT', 'DAI'];
    tokens = tokens.map(token => { return { name: token, score: checkSimilarity(token, ATOToken)}});

    tokens.sort((tokenA, tokenB) => tokenB.score - tokenA.score);
    console.log('this are tokens ', tokens)
    return tokens
}

export const getRandomValue = () => {
    return Math.floor(Math.random() * 50) + 1;
}

export const addSpaceBetweenNumberAndText = (str) => {
    str = str.replace(/(\d)([^\d\s.])/g, '$1 $2');
    str = str.replace(/([^\d\s.])(\d)/g, '$1 $2');

    return str;
}

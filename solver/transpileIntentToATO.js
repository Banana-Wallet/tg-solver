import Axios from 'axios'
import dotenv from 'dotenv'
// import { WALLET_META } from '../constant.js';
import { checkSimilarity } from '../utils/bigramSimilarity.js';
import { attachMandatoryFieldsForSwap, attachMandatoryFieldsForSwapAndBridge } from './validation/ATOValidation.js';
import { correctIllFormedJson } from './validation/ATOFix.js';

dotenv.config();

const chainsInIntent = (intent, WALLET_META) => {
    const tokens = intent.split(" ");
    console.log('these are tokerns ', tokens)
    console.log('totqal tokens ', tokens.length)

    let chains = [];

    for(let i=0; i < tokens.length; i++) {
        for(let j = 0; j < WALLET_META.length; j++) {
            // console.log('similarity scorem for', tokens[i], WALLET_META[j].chain, checkSimilarity(tokens[i], WALLET_META[j].chain))
            if(checkSimilarity(tokens[i], WALLET_META[j].chain) > 0.5) {
               chains.push(WALLET_META[j].chain); 
            }
        }
    }

    chains = chains.filter((value, index, self) => self.indexOf(value) === index);

    return chains;
}

// will enable it in production
const getWalletBalance = async () => {
    // const { data, error } = await fetchQuery(ERC20TokensQuery, {  })
}

const getWalletMeta = (userBalance) => {
    const walletMeta = [
        { chain: 'Polygon', balance: `${userBalance['Polygon']['USDC']} USDC, ${userBalance['Polygon']['USDT']} USDT, ${userBalance['Polygon']['DAI']} DAI` },
        { chain: 'Gnosis', balance: `${userBalance['Gnosis']['USDC']} USDC, ${userBalance['Gnosis']['USDT']} USDT, ${userBalance['Gnosis']['DAI']} DAI` },
        { chain: 'Optimism', balance: `${userBalance['Optimism']['USDC']} USDC, ${userBalance['Optimism']['USDT']} USDT, ${userBalance['Optimism']['DAI']} DAI` },
        { chain: 'Matic', balance: `${userBalance['Polygon']['USDC']} USDC, ${userBalance['Polygon']['USDT']} USDT, ${userBalance['Polygon']['DAI']} DAI` },
    ];
    return walletMeta;
}

const intentFormaliser = (intent, address, userBalance) => {
    console.log('intent', intent)

    let chains = [];
    let WALLET_META = getWalletMeta(userBalance);
    chains = chainsInIntent(intent, WALLET_META);

    console.log('these are chains ', chains);

    let context = ''
    if(chains.length > 0) {
        context = `. #### ${chains.map(chain => `My ${chain} address is ${address}. `)}`
    } 
    
    // else {
    //     // chains = ['Polygon', 'Gnosis', 'Optimism'];
    //     // context = `. #### ${chains.map(chain => `My ${chain} address is ${address}. `)}`
    // };

    let selectedChains = [];

    if(chains.length > 0) {
        selectedChains = WALLET_META.filter(wallet => chains.includes(wallet.chain));
        context += `${selectedChains.map(wallet => ` I have ${wallet.balance} in my ${wallet.chain} account. `)}`
        intent = intent + context;
    }

    console.log('seklecteed chains ', selectedChains)

    //! have to figure out what to do in this case when no chain is mentioned 
    return intent;
}
const fixAndParse = (jsonString) => {
    try {
      // Try parsing the original string first
      return JSON.parse(jsonString);
    } catch (e) {
      // If it fails, attempt to correct it
      try {
        // Replace single quotes with double quotes
        const doubleQuotedString = jsonString.replace(/'/g, '"');
  
        // Try parsing the modified string
        return JSON.parse(doubleQuotedString);
      } catch (e2) {

        //! try fixing it with open ai itself 
        // console.error('Failed to auto-correct JSON string:', e2);
        console.log('trying to correct Ill formed json');
        return correctIllFormedJson(jsonString);
        return null;
      }
    }
  }
  
export const transpile = async (intent, userAddress, direct, userBalance) => {

    const parsePostUrl = process.env.BANANA_AI_PARSER;

    if(direct) return intent;

    const finalIntent = intentFormaliser(intent, userAddress, userBalance);

    console.log('this is user final intent', finalIntent);

    try {
        const response = await Axios.get(parsePostUrl + "/ask", {
            params: {
                query: finalIntent
            }
        });

        console.log('this is object', response.data.ans);
        let regexedATO = response.data.ans.replace(/(\w+):\s/g, '"$1": ')
        console.log('this is regexed ato ', regexedATO);

        let ATO = fixAndParse(regexedATO);

        console.log("this is type of ATO", typeof ATO);
        console.log('ATO', ATO)

        if(!ATO) return [1,2,3,4];

        let finalATO;
        if(Array.isArray(ATO)) {
            finalATO = ATO;
        } else if(typeof ATO === "string") {
            finalATO = correctIllFormedJson(ATO);
        } else if(typeof ATO === "object") {
            finalATO = [ATO];
        }

        console.log('this is final ato before attachement ', finalATO)

        if(finalATO.length === 1 && finalATO[0].operation === 'SWAP') {
            finalATO = attachMandatoryFieldsForSwap(finalATO);
        } else if(finalATO.length === 2 && finalATO[0].operation === 'SWAP' && finalATO[1].operation === 'BRIDGE') {
            finalATO = attachMandatoryFieldsForSwapAndBridge(finalATO);
        }

        return finalATO;
    } catch (err) {
        console.log(err);
        return [1,2,3]; // will eventually throw an error
    }
}
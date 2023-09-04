import Axios from 'axios'
import dotenv from 'dotenv'
import { WALLET_META } from '../constant.js';
import { checkSimilarity } from '../utils/bigramSimilarity.js';
import { attachMandatoryFieldsForSwap, attachMandatoryFieldsForSwapAndBridge } from './validation/ATOValidation.js';

dotenv.config();

const chainsInIntent = (intent) => {
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

const intentFormaliser = (intent, address) => {
    console.log('intent', intent)

    let chains = [];
    chains = chainsInIntent(intent);

    console.log('these are chains ', chains);

    let context = ''
    if(chains.length > 0) {
        context = `. ### ${chains.map(chain => `My ${chain} address is ${address}. `)}`
    } else {
        chains = ['Polygon', 'Gnosis', 'Optimism'];
        context = `. ### ${chains.map(chain => `My ${chain} address is ${address}. `)}`
    };

    let selectedChains = [];

    selectedChains = WALLET_META.filter(wallet => chains.includes(wallet.chain));

    console.log('seklecteed chains ', selectedChains)

    //! have to figure out what to do in this case when no chain is mentioned 
    context += `${selectedChains.map(wallet => ` I have ${wallet.balance} in my ${wallet.chain} account. `)}`
    intent = intent + context;
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
        console.error('Failed to auto-correct JSON string:', e2);
        return null;
      }
    }
  }
  
export const transpile = async (intent, userAddress, direct) => {
    const parsePostUrl = process.env.BANANA_AI_PARSER;

    if(direct) return intent;

    const finalIntent = intentFormaliser(intent, userAddress);

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
        console.log('ATO', ATO)

        if(!ATO) return [1,2,3,4];

        let finalATO;
        if(Array.isArray(ATO)) {
            finalATO = ATO;
        } else finalATO = [ATO];
        console.log('this is final ato before attachement ', finalATO)
        if(finalATO.length === 1 && finalATO[0].operation === 'SWAP') {
            finalATO = attachMandatoryFieldsForSwap(finalATO);
        } else finalATO = attachMandatoryFieldsForSwapAndBridge(finalATO);

        return finalATO;
    } catch (err) {
        console.log(err);
        return [1,2,3]; // will eventually throw an error
    }
}
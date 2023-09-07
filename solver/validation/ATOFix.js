export const correctIllFormedJson = (inputStr) => {
  let output = [];
  let currentObject = {};
  let key = '';
  let value = '';
  let inKey = true;
  let hasQuoteStarted = false;

  for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];

      if (char === '[' || char === ']') continue;

      if (char === '{') {
          currentObject = {};
          continue;
      }

      if (char === '}') {
          if (key) {
              // Avoid adding empty keys to the object
              if (key.trim()) {
                  currentObject[key.trim()] = value.trim() || 'any';
              }
          }
          output.push(currentObject);
          key = '';
          value = '';
          inKey = true;
          continue;
      }

      if (char === "'") {
          hasQuoteStarted = !hasQuoteStarted;
          continue;
      }

      if (char === ':' && !hasQuoteStarted) {
          inKey = false;
          continue;
      }

      if (char === ',' && !hasQuoteStarted) {
          // Avoid adding empty keys to the object
          if (key.trim()) {
              currentObject[key.trim()] = value.trim() || 'any';
          }
          key = '';
          value = '';
          inKey = true;
          continue;
      }

      if (inKey && hasQuoteStarted) {
          key += char;
      } else if (!inKey && hasQuoteStarted) {
          value += char;
      }
  }

  return output;
}
// const test = "[{'operation': 'SWAP', 'sourceToken': 'USDT', 'sourceTokenAmount': '0.1', 'sourceChain': 'Polygon', 'destinationToken': 'USDC', 'destinationTokenAmount': '', 'tokenOwner': '0xe407F56Df5825a7454e266cb2a83D9e3A7c31FF7', 'slippage': 'DEFAULT', 'rate': 'DEFAULT'}, {'operation': 'BRIDGE', 'sourceChain': 'Polygon', 'destinationChain': 'Gnosis', 'token': 'USDC', 'tokenAmount': 'any', 'sourceOwner': '0xe407F56Df5825a7454e266cb2a83D9e3A7c31FF7', 'destinationOwner': '0xe407F56Df5825a7454e266cb2a83D9e3A7c31FF7', 'delay': 'DEFAULT', 'reputation': 'HIGH', 'rate': 'DEFAULT', 'fees': 'LOW', 'slippage': 'DEFAULT'}]";
// console.log(correctIllFormedJson(test));

import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { polygonAddresses, welcomeMessage } from "./constant.js";
import { transpile } from "./solver/transpileIntentToATO.js";
import { swapTxnDataExtractor } from "./solver/account-abstraction/swapTxnDataExtractor.js";
import { checkSimilarity } from "./utils/bigramSimilarity.js";
import { bridgeAndSwapTxnExtractor } from "./solver/account-abstraction/bridgeAndSwapTxnDataExtractor.js";
import { constructSwapTransaction } from "./solver/transactions/swapTransactions.js";
import { getTokenBalances } from "./utils/tokenBalances.js";
import wallets from "./config/wallets.json" assert { type: "json" };
import { getRandomValue } from "./utils/utils.js";
import {
  ATOValidationForSwap,
  ATOValidationForSwapAndBridge,
} from "./solver/validation/ATOValidation.js";
import { isJSON } from "./constant.js";
import { intentSteps } from "./constant.js";
import { constructSwapAndBridgeTransaction } from "./solver/transactions/bridgeAndSwapTransactions.js";
import {
  preFormedPrompt_1_ATO,
  preFormedPrompt_2_ATO,
  preFormedPrompt_3_ATO,
} from "./constant.js";
import { addSpaceBetweenNumberAndText } from "./utils/utils.js";
import { walletBalanceMessage } from "./constant.js";
import { sendTransaction } from "./solver/account-abstraction/sendTransaction.js";
import { ATOIntegrityValidation } from "./solver/validation/ATOExtractedDataFixes.js";
import { constructBridgeTransaction } from "./solver/transactions/bridgeTransaction.js"; // bridging via wormhole
import { constructStakeTransaction } from "./solver/transactions/staketransaction.js";
import { isAllTransactionsInterelated } from "./utils/utils.js";

dotenv.config();

const publicAddress = "0x6729b2d2e890a41be40d0f47f2643c58172e418b";
const privateKey =
  "0x158a16e50adaa425de7afccdfd9116be2d67819febabc39cd9d656dad8a7e2e9";
const publicKey =
  "0xd4bb09ede64278091a204684bc8fba362286b934a4aaa2359a969c9b2924b9216135ab2969712cce2ec494ed786787d10c6ceced3cb7b039673b5566f0797ffb";

const BOT_TOKEN = process.env.BOT_API;
const env = process.env.ENV;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const prompt1 = "Swap 0.1 USDC to USDT on Polygon";
const prompt2 = "Get most of my USDC from polygon to gnosis";
const prompt3 = "Send 0.4 USDC on Gnosis from Polygon USDT balance";
const prompt4 = "Stake 0.4 USDC on lido";

const SOCKET_SCAN_BASEURL = "https://socketscan.io/tx/";

const users = [];
let userQuestionStates = {};
let userIntentConfirmation = {
  executeIntent: 0, // 0: null action, 1: confirmed, 2: rejected
  isIntentProcessing: false,
};
let userCurrentBalance = {};

const executeStakeTransaction = async (bot, chatId, userMeta) => {
  const swapUSDCToMatiCData = {
    chain: 137,
    pair: ["USDC", "MATIC"],
    tokenAddress1: polygonAddresses["USDC"],
    tokenAddress2: polygonAddresses["MATIC"],
    amount: "0.2", // for now
    userAddress: userMeta.scaAddress, // for now
  };
  bot.sendMessage(chatId, "Finding the best execution path..🛠️");
  let txnConstructionResponse = await constructSwapTransaction(
    swapUSDCToMatiCData
  );

  if (!txnConstructionResponse.success) {
    bot.sendMessage(
      chatId,
      "Unfortunately swapping transaction construction failed"
    );
    return;
  }

  let txnLink;

  let context = [];
  
  context = [...txnConstructionResponse.context];
  // transactions = [...txnConstructionResponse.transactions];

  let stakeTxnConstructionResponse = await constructStakeTransaction(
    swapUSDCToMatiCData
  );

  context = [...context, ...stakeTxnConstructionResponse.context];

  if (!stakeTxnConstructionResponse.success) {
    bot.sendMessage(
      chatId,
      "Unfortunately staking transaction construction failed"
    );
    return;
  }

  const intention = intentSteps(context);
  //! confirmation from user
  // console.log("this is swap txn ", txnConstruction);

  const optsForConfirmation = getOptsForConfirmation();
  bot.sendMessage(chatId, intention, optsForConfirmation);

  const confirmation = await waitForConfirmation(chatId);

  if (!confirmation) {
    bot.sendMessage(chatId, "Transaction cancelled");
    return;
  }

  bot.sendMessage(chatId, "Transaction confirmed");
  // txnConstructionResponse.transactions = transactions;

  try {
    txnLink = await sendTransaction(txnConstructionResponse, userMeta);
    console.log("this is txn link ", txnLink);
  } catch (err) {
    console.log("err in txn", err);
    bot.sendMessage(chatId, "Unfortunately txn didn't executed successfully!");
    return;
  }

  bot.sendMessage(chatId, `Swapped ${swapUSDCToMatiCData.amount} USDC to MATIC done`);

  try {
    txnLink = await sendTransaction(stakeTxnConstructionResponse, userMeta);
    console.log("this is txn link ", txnLink);
  } catch (err) {
    console.log("err in txn", err);
    bot.sendMessage(chatId, "Unfortunately txn didn't executed successfully!");
    return;
  }

  bot.sendMessage(chatId, "Intent executed..🏁");
  await delay(1000);
  bot.sendMessage(chatId, `Txn link: ${txnLink.txnLink}`);
};

const intentExecution = async (
  bot,
  chatId,
  intent,
  userAddress,
  direct = false
) => {
  if (Object.keys(userIntentConfirmation).includes(String(chatId))) {
    if (userIntentConfirmation[chatId].isIntentProcessing) {
      bot.sendMessage(chatId, "Previous intent already in process !!");
      return;
    }
  }

  const userMeta = users.find((userData) => userData.chatId === chatId);

  userIntentConfirmation[chatId] = {
    executeIntent: 0,
    isIntentProcessing: true,
  };

  bot.sendMessage(chatId, "Finding the best execution path..🛠️");

  const userBalances = await getTokenBalances(userAddress);
  let intentATOs = await transpile(intent, userAddress, direct, userBalances);

  console.log("these are intent ATos;", intentATOs);
  bot.sendMessage(chatId, "Finding best protocols for executions..✔️");
  await delay(500);

  console.log("this is intent ato ", intentATOs);

  let swapData = "",
    bridgeData = "";

  try {
    if (intentATOs.length === 1) {
      // for bridge or swap
      if (
        checkSimilarity(intentATOs[0].operation, "SWAP") >
        checkSimilarity(intentATOs[0].operation, "BRIDGE")
      ) {
        let fixableIntent = intentATOs[0];

        console.log("this is user balance ", userBalances);

        console.log("this is zereo ato", intentATOs[0]);
        const questions = ATOValidationForSwap(fixableIntent, userBalances);
        console.log("question to be asked for ATO filling", questions);

        userQuestionStates[chatId] = [...questions];

        for (let i = 0; i < userQuestionStates[chatId].length; i++) {
          const ATOField = userQuestionStates[chatId][i].field;

          if (userQuestionStates[chatId][i].options.length === 0) {
            bot.sendMessage(
              chatId,
              "Oops!. Your wallet do not have sufficient funds to execute this transaction. Please check wallet balance with /balance command."
            );
            return;
          }

          const opts = buildOptsForQuestion(
            i,
            userQuestionStates[chatId][i].options
          );
          bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
          await waitForAnswer(chatId, i);
          // now we have the ans
          fixableIntent[ATOField] = userQuestionStates[chatId][i].ans;
        }

        bot.sendMessage(chatId, "Validating execution path..✅");
        await delay(500);

        //! need to make sure we are passsing valie ATO
        swapData = swapTxnDataExtractor(
          fixableIntent,
          userAddress,
          userBalances
        );
        console.log("thos is swap data", swapData);

        const { isError, errorReason } = ATOIntegrityValidation(
          swapData,
          false,
          userBalances
        );

        if (isError) {
          bot.sendMessage(chatId, errorReason);
          return;
        }

        //! handle the case when the construction has failed
        let txnConstructionResponse = await constructSwapTransaction(swapData);

        if (!txnConstructionResponse.success) {
          bot.sendMessage(
            chatId,
            "Unfortunately avalaible Solvers weren't able to find efficient route for your txn. try increasing the amount for swap/bridge.. ❌"
          );
          return;
        }

        bot.sendMessage(chatId, "Txns constructed..👷");

        const intention = intentSteps(txnConstructionResponse.context);
        //! confirmation from user
        // console.log("this is swap txn ", txnConstruction);

        const optsForConfirmation = getOptsForConfirmation();
        bot.sendMessage(chatId, intention, optsForConfirmation);
        const confirmation = await waitForConfirmation(chatId);

        if (!confirmation) {
          bot.sendMessage(chatId, "Transaction cancelled");
          return;
        }

        bot.sendMessage(chatId, "Transaction confirmed");

        let txnLink;
        //! execute her
        try {
          txnLink = await sendTransaction(txnConstructionResponse, userMeta);

          console.log("this is txn link ", txnLink);
        } catch (err) {
          console.log("err in txn", err);
          bot.sendMessage(
            chatId,
            "Unfortunately txn didn't executed successfully!"
          );
          return;
        }
        bot.sendMessage(chatId, "Intent executed..🏁");
        await delay(1000);
        bot.sendMessage(chatId, `Txn link: ${txnLink.txnLink}`);
      } else {
        // const userBalances = await getTokenBalances(userAddress);
        console.log("this is user balance ", userBalances);

        const questions = ATOValidationForSwapAndBridge(
          intentATOs,
          userBalances
        );
        console.log("questions to be asked for ATO filling", questions);
        userQuestionStates[chatId] = [...questions];
        let fixableIntent = intentATOs;

        for (let i = 0; i < userQuestionStates[chatId].length; i++) {
          const ATOField = userQuestionStates[chatId][i].field;

          if (userQuestionStates[chatId][i].options.length === 0) {
            bot.sendMessage(
              chatId,
              "Oops!. Your wallet do not have sufficient funds to execute this transaction. Please check wallet balance with /balance command."
            );
            return;
          }

          const opts = buildOptsForQuestion(
            i,
            userQuestionStates[chatId][i].options
          );
          bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
          await waitForAnswer(chatId, i);
          fixableIntent[0][ATOField] = userQuestionStates[chatId][i].ans;
        }

        bot.sendMessage(chatId, "Validating execution path..✅");
        await delay(500);

        //! need to make sure we are passing valid ATO
        bridgeData = bridgeAndSwapTxnExtractor(
          fixableIntent,
          userAddress,
          userBalances
        );

        console.log("this is final bridge data ", bridgeData);

        const { isError, errorReason } = ATOIntegrityValidation(
          bridgeData,
          true,
          userBalances
        );

        if (isError) {
          bot.sendMessage(chatId, errorReason);
          return;
        }

        //! constructing txn here
        // const txnConstructionResponse = await constructSwapAndBridgeTransaction(
        //   bridgeData
        // );

        const txnConstructionResponse = await constructBridgeTransaction(
            bridgeData
        );

        console.log(
          "this is txn construction response ",
          txnConstructionResponse
        );

        if (!txnConstructionResponse.success) {
          bot.sendMessage(
            chatId,
            "Unfortunately avalaible Solvers weren't able to find efficient route for your txn. try increasing the amount for swap/bridge"
          );
          return;
        }

        bot.sendMessage(chatId, "Txns constructed..👷");

        const intention = intentSteps(txnConstructionResponse.context);
        const optsForConfirmation = getOptsForConfirmation();
        bot.sendMessage(chatId, intention, optsForConfirmation);
        const confirmation = await waitForConfirmation(chatId);

        if (!confirmation) {
          bot.sendMessage(chatId, "Transaction cancelled");
          return;
        }

        bot.sendMessage(chatId, "Transaction confirmed");

        let txnLink;
        //! execute her
        try {
          txnLink = await sendTransaction(txnConstructionResponse, userMeta);
          console.log("this is txn link ", txnLink);
        } catch (err) {
          console.log("err in txn", err);
          bot.sendMessage(
            chatId,
            "Unfortunately txn didn't executed successfully!"
          );
          return;
        }

        bot.sendMessage(chatId, "Intent executed..🏁");
        await delay(1000);
        bot.sendMessage(chatId, `Txn link: ${txnLink.txnLink}`);
        bot.sendMessage(
          chatId,
          `Bridge Scanner: ${SOCKET_SCAN_BASEURL}${txnLink.txnHash}`
        );
      }

      console.log("this is data", swapData, bridgeData);
    } else if (
      intentATOs.length === 2 &&
      intentATOs[0].operation === "SWAP" &&
      intentATOs[1].operation === "BRIDGE"
    ) {
      // for bridge and swap
      //   const userBalances = await getTokenBalances(userAddress);
      console.log("this is user balance ", userBalances);

      const questions = ATOValidationForSwapAndBridge(intentATOs, userBalances);
      console.log("questions to be asked for ATO filling", questions);

      userQuestionStates[chatId] = [...questions];
      let fixableIntent = intentATOs;

      for (let i = 0; i < userQuestionStates[chatId].length; i++) {
        const ATOField = userQuestionStates[chatId][i].field;
        const ATOIndex = userQuestionStates[chatId][i].index;

        if (userQuestionStates[chatId][i].options.length === 0) {
          bot.sendMessage(
            chatId,
            "Oops!. Your wallet do not have sufficient funds to execute this transaction. Please check wallet balance with /balance command"
          );
          return;
        }

        const opts = buildOptsForQuestion(
          i,
          userQuestionStates[chatId][i].options
        );
        bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
        await waitForAnswer(chatId, i);
        // now we have the ans
        fixableIntent[ATOIndex][ATOField] = userQuestionStates[chatId][i].ans;
      }

      bot.sendMessage(chatId, "Validating execution path..✅");
      await delay(500);

      bridgeData = bridgeAndSwapTxnExtractor(
        fixableIntent,
        userAddress,
        userBalances
      );
      console.log("this is final bridge data what ever it is", bridgeData);

      const { isError, errorReason } = ATOIntegrityValidation(
        bridgeData,
        true,
        userBalances
      );

      if (isError) {
        bot.sendMessage(chatId, errorReason);
        return;
      }

      const txnConstructionResponse = await constructSwapAndBridgeTransaction(
        bridgeData
      );

      if (!txnConstructionResponse.success) {
        bot.sendMessage(
          chatId,
          "Unfortunately avalaible Solvers weren't able to find efficient route for your txn. try increasing the amount for swap/bridge"
        );
        return;
      }

      const intention = intentSteps(txnConstructionResponse.context);

      const optsForConfirmation = getOptsForConfirmation();
      bot.sendMessage(chatId, intention, optsForConfirmation);

      const confirmation = await waitForConfirmation(chatId);
      if (!confirmation) {
        bot.sendMessage(chatId, "Transaction cancelled");
        return;
      }

      bot.sendMessage(chatId, "Transaction confirmed");

      let txnLink;
      //! execute her
      try {
        txnLink = await sendTransaction(txnConstructionResponse, userMeta);
        console.log("this is txn link ", txnLink);
      } catch (err) {
        console.log("err in txn", err);
        bot.sendMessage(
          chatId,
          "Unfortunately txn didn't executed successfully!"
        );
        return;
      }

      bot.sendMessage(chatId, "Intent executed..🏁");
      await delay(1000);
      bot.sendMessage(chatId, `Txn link: ${txnLink.txnLink}`);
      bot.sendMessage(
        chatId,
        `Bridge Scanner: ${SOCKET_SCAN_BASEURL}${txnLink.txnHash}`
      );
      // intentATOs
      // we will cater either all swaps (non related) + all bridge (non related)
    } else if (
      intentATOs.length >= 2 &&
      isAllTransactionsInterelated(intentATOs)
    ) {
      // let transactions = [], context = [];
      for (let i = 0; i < intentATOs.length; i++) {
        if (intentATOs[i].operation === "SWAP") {
          let fixableIntent = intentATOs[i];

          console.log("this is user balance ", userBalances);
          bot.sendMessage(chatId, `Starting ${i + 1}th swap transaction`);

          // console.log("this is zereo ato", intentATOs[0]);
          const questions = ATOValidationForSwap(fixableIntent, userBalances);
          console.log("question to be asked for ATO filling", questions);

          userQuestionStates[chatId] = [...questions];

          for (let i = 0; i < userQuestionStates[chatId].length; i++) {
            const ATOField = userQuestionStates[chatId][i].field;

            if (userQuestionStates[chatId][i].options.length === 0) {
              bot.sendMessage(
                chatId,
                "Oops!. Your wallet do not have sufficient funds to execute this transaction. Please check wallet balance with /balance command."
              );
              return;
            }

            const opts = buildOptsForQuestion(
              i,
              userQuestionStates[chatId][i].options
            );
            bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
            await waitForAnswer(chatId, i);
            // now we have the ans
            fixableIntent[ATOField] = userQuestionStates[chatId][i].ans;
          }

          bot.sendMessage(
            chatId,
            `SWAP ${fixableIntent[0].sourceToken} <> ${fixableIntent[0].destinationToken} on ${fixableIntent[0].sourceChain}`
          );

          bot.sendMessage(chatId, "Validating execution path..✅");
          await delay(500);

          let swapData = swapTxnDataExtractor(
            fixableIntent,
            userAddress,
            userBalances
          );

          const { isError, errorReason } = ATOIntegrityValidation(
            swapData,
            false,
            userBalances
          );

          if (isError) {
            bot.sendMessage(chatId, errorReason);
            // return;
            continue;
          }

          let txnConstructionResponse = await constructSwapTransaction(
            swapData
          );

          if (!txnConstructionResponse.success) {
            bot.sendMessage(
              chatId,
              "Unfortunately avalaible Solvers weren't able to find efficient route for your txn. try increasing the amount for swap/bridge"
            );
            // return;
            continue;
          }

          const intention = intentSteps(txnConstructionResponse.context);

          const optsForConfirmation = getOptsForConfirmation();
          bot.sendMessage(chatId, intention, optsForConfirmation);

          const confirmation = await waitForConfirmation(chatId);
          if (!confirmation) {
            bot.sendMessage(chatId, "Transaction cancelled");
            // return;
            continue;
          }

          bot.sendMessage(chatId, "Transaction confirmed");

          let txnLink;
          //! execute her
          try {
            txnLink = await sendTransaction(txnConstructionResponse, userMeta);
            console.log("this is txn link ", txnLink);
          } catch (err) {
            console.log("err in txn", err);
            bot.sendMessage(
              chatId,
              "Unfortunately txn didn't executed successfully!"
            );
            // return;
            continue;
          }

          bot.sendMessage(chatId, "Intent executed..🏁");
          await delay(1000);
          bot.sendMessage(chatId, `Txn link: ${txnLink.txnLink}`);

          userQuestionStates[chatId] = [];
        } else if (intentATOs[i].operation === "BRIDGE") {
          bot.sendMessage(chatId, `Starting ${i + 1}th bridge transaction`);
          let fixableIntent = [intentATOs[i]];

          const questions = ATOValidationForSwapAndBridge(
            fixableIntent,
            userBalances
          );
          console.log("questions to be asked for ATO filling", questions);

          userQuestionStates[chatId] = [...questions];

          for (let i = 0; i < userQuestionStates[chatId].length; i++) {
            const ATOField = userQuestionStates[chatId][i].field;

            if (userQuestionStates[chatId][i].options.length === 0) {
              bot.sendMessage(
                chatId,
                "Oops!. Your wallet do not have sufficient funds to execute this transaction. Please check wallet balance with /balance command."
              );
              // return;
              continue;
            }

            const opts = buildOptsForQuestion(
              i,
              userQuestionStates[chatId][i].options
            );
            bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
            await waitForAnswer(chatId, i);
            fixableIntent[0][ATOField] = userQuestionStates[chatId][i].ans;
          }

          bot.sendMessage(
            chatId,
            `BRIDGE ${fixableIntent[0].token} from ${fixableIntent[0].sourceChain} to ${fixableIntent[0].destinationChain}`
          );

          bot.sendMessage(chatId, "Validating execution path..✅");
          await delay(500);

          let bridgeData = bridgeAndSwapTxnExtractor(
            fixableIntent,
            userAddress,
            userBalances
          );

          const { isError, errorReason } = ATOIntegrityValidation(
            bridgeData,
            true,
            userBalances
          );

          if (isError) {
            bot.sendMessage(chatId, errorReason);
            // return;
            continue;
          }

          let txnConstructionResponse = await constructSwapAndBridgeTransaction(
            bridgeData
          );

          if (!txnConstructionResponse.success) {
            bot.sendMessage(
              chatId,
              "Unfortunately avalaible Solvers weren't able to find efficient route for your txn. try increasing the amount for swap/bridge"
            );
            continue;
          }

          const intention = intentSteps(txnConstructionResponse.context);

          const optsForConfirmation = getOptsForConfirmation();
          bot.sendMessage(chatId, intention, optsForConfirmation);

          const confirmation = await waitForConfirmation(chatId);
          if (!confirmation) {
            bot.sendMessage(chatId, "Transaction cancelled");
            // return;
            continue;
          }

          bot.sendMessage(chatId, "Transaction confirmed");

          let txnLink;
          //! execute her
          try {
            txnLink = await sendTransaction(txnConstructionResponse, userMeta);
            console.log("this is txn link ", txnLink);
          } catch (err) {
            console.log("err in txn", err);
            bot.sendMessage(
              chatId,
              "Unfortunately txn didn't executed successfully!"
            );
            // return;
            continue;
          }

          bot.sendMessage(chatId, "Intent executed..🏁");
          await delay(1000);
          bot.sendMessage(chatId, `Txn link: ${txnLink.txnLink}`);
          bot.sendMessage(
            chatId,
            `Bridge Scanner: ${SOCKET_SCAN_BASEURL}${txnLink.txnHash}`
          );

          userQuestionStates[chatId] = [];
        } else {
          bot.sendMessage(
            chatId,
            "🛑 Platform don't supported this types of actions for now !! 🛑"
          );
          break;
        }
        bot.sendMessage(
          chatId,
          `${i + 1}th transaction executed ${
            intentATOs.length - (i + 1)
          } Remaining`
        );
      }
    } else {
      bot.sendMessage(
        chatId,
        "🛑 Platform don't supported this types of actions for now !! 🛑"
      );
    }
  } catch (err) {
    console.log("this is the errior received ", err);
    bot.sendMessage(chatId, "🛑 Bot doesn't support this action for now!. 🛑");
  }
  //clean up
  userQuestionStates[chatId] = [];
  userIntentConfirmation[chatId].isIntentProcessing = false;
};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  let userScaAddress = "not defined";

  console.log(msg.from.username);

  const userMeta = users.find((userData) => userData.chatId === chatId);

  try {
    if (userMeta) {
      console.log("this is user meta", userMeta);
      userScaAddress = userMeta.scaAddress;
    } else {
      const randomValue = getRandomValue();
      //   const wallet = wallets[randomValue % 20];
      const wallet = wallets[1]; // wallet with index 1 temporary
      userScaAddress = wallet.scaAddress;

      users.push({
        chatId,
        username: msg.from.username,
        address: env === "test" ? publicAddress : wallet.address,
        scaAddress: userScaAddress,
        accountPublicKey: env === "test" ? publicKey : wallet.publicKey,
        accountPrivateKey: env === "test" ? privateKey : wallet.privateKey,
      });
    }
  } catch (err) {
    console.log(err);
  }

  const preformedOpts = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: `${prompt1}`, callback_data: "preFormedPrompt_1" }],
        [{ text: `${prompt2}`, callback_data: "preFormedPrompt_2" }],
        [{ text: `${prompt3}`, callback_data: "preFormedPrompt_3" }],
        [{ text: `${prompt4}`, callback_data: "preFormedPrompt_4" }],
      ],
    },
  };

  let tokenBalances = await getTokenBalances(userScaAddress);

  const greetMessage = welcomeMessage(userScaAddress, tokenBalances);

  bot.sendMessage(chatId, greetMessage, preformedOpts);
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userMeta = users.find((userData) => userData.chatId === chatId);

  if (!userMeta) {
    bot.sendMessage(chatId, "Wallet not initialized use /start to initialize");
    return;
  }

  bot.sendMessage(chatId, "Loading balances..");
  const tokenBalances = await getTokenBalances(userMeta.scaAddress);
  bot.sendMessage(
    chatId,
    walletBalanceMessage(userMeta.scaAddress, tokenBalances)
  );
});

const buildOptsForQuestion = (questionNo, options) => {
  const markDownOptions = options.map((option, index) => [
    {
      text: option,
      callback_data: JSON.stringify({
        value: option,
        text: `question_${index + 1}`,
        qno: questionNo,
      }),
    },
  ]);
  const opts = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [...markDownOptions],
    },
  };
  return opts;
};

const getOptsForConfirmation = () => {
  const opts = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: `Confirm ✅`, callback_data: "confirm" }],
        [{ text: `Reject ❌`, callback_data: "cancell" }],
      ],
    },
  };
  return opts;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForAnswer = async (chatId, qno) => {
  // userQuestionStates
  while (!userQuestionStates[chatId][qno].ans) {
    await delay(1000);
  }
};

const waitForConfirmation = async (chatId) => {
  while (userIntentConfirmation[chatId].executeIntent === 0) {
    await delay(1000);
  }

  return userIntentConfirmation[chatId].executeIntent === 1;
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text === "/start" || msg.text === "/balance") return;

  const userMeta = users.find((userData) => userData.chatId === chatId);

  console.log("thjis is userr meta", userMeta);

  if (!userMeta) {
    bot.sendMessage(chatId, "Wallet not initialized use /start to initialize");
    return;
  }

  // getting user balance here

  console.log(
    "keys for intent confirmtion ",
    Object.keys(userIntentConfirmation)
  );

  console.log(
    "is chatid thjere ",
    Object.keys(userIntentConfirmation).includes(chatId)
  );

  const intent = addSpaceBetweenNumberAndText(msg.text);
  console.log("Processed intent: ", intent);

  await intentExecution(bot, chatId, intent, userMeta.scaAddress);

  //clean up
  userQuestionStates[chatId] = [];
  userIntentConfirmation[chatId].isIntentProcessing = false;
});

bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  console.log("this are users ", users);
  console.log("current chat id", chatId);

  if (isJSON(data)) {
    const { value, text, qno } = JSON.parse(data);
    userQuestionStates[chatId][qno].ans = value;
  } else {
    switch (data) {
      case "preFormedPrompt_1": {
        const userMeta = users.find((userData) => userData.chatId === chatId);

        if (!userMeta) {
          bot.sendMessage(
            chatId,
            "Wallet not initialized use /start to initialize"
          );
          return;
        }

        await intentExecution(
          bot,
          chatId,
          preFormedPrompt_1_ATO(userMeta.scaAddress),
          userMeta.scaAddress,
          true
        );

        //clean up
        userQuestionStates[chatId] = [];
        userIntentConfirmation[chatId].isIntentProcessing = false;
        return;
      }
      case "preFormedPrompt_2": {
        const userMeta = users.find((userData) => userData.chatId === chatId);

        if (!userMeta) {
          bot.sendMessage(
            chatId,
            "Wallet not initialized use /start to initialize"
          );
          return;
        }

        await intentExecution(
          bot,
          chatId,
          preFormedPrompt_2_ATO(userMeta.scaAddress),
          userMeta.scaAddress,
          true
        );

        //clean up
        userQuestionStates[chatId] = [];
        userIntentConfirmation[chatId].isIntentProcessing = false;

        return;
      }
      case "preFormedPrompt_3": {
        const userMeta = users.find((userData) => userData.chatId === chatId);

        if (!userMeta) {
          bot.sendMessage(
            chatId,
            "Wallet not initialized use /start to initialize"
          );
          return;
        }

        await intentExecution(
          bot,
          chatId,
          preFormedPrompt_3_ATO(userMeta.scaAddress),
          userMeta.scaAddress,
          true
        );

        //clean up
        userQuestionStates[chatId] = [];
        userIntentConfirmation[chatId].isIntentProcessing = false;
        return;
      }
      case "preFormedPrompt_4": {
        const userMeta = users.find((userData) => userData.chatId === chatId);

        if (!userMeta) {
          bot.sendMessage(
            chatId,
            "Wallet not initialized use /start to initialize"
          );
          return;
        }

        userIntentConfirmation[chatId] = {
          isIntentProcessing: true,
          executeIntent: 0,
        };
        // .isIntentProcessing = true;
        // userIntentConfirmation[chatId].executeIntent = 0;
        await executeStakeTransaction(bot, chatId, userMeta);

        userQuestionStates[chatId] = [];
        userIntentConfirmation[chatId].isIntentProcessing = false;
        return;
      }
      case "confirm": {
        if (userIntentConfirmation[chatId]) {
          userIntentConfirmation[chatId].executeIntent = 1;
        } else
          bot.sendMessage(
            chatId,
            "Wallet not initialized use /start to initialize"
          );
        return;
      }
      case "cancell": {
        if (userIntentConfirmation[chatId]) {
          userIntentConfirmation[chatId].executeIntent = 2;
        } else
          bot.sendMessage(
            chatId,
            "Wallet not initialized use /start to initialize"
          );
        return;
      }
    }
  }
});

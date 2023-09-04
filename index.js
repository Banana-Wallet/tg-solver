import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { welcomeMessage } from "./constant.js";
// import Wallet from "ethereumjs-wallet";
// import { ethers } from "ethers";
// import { Banana, Chains } from "@bananahq/banana-sdk-test";
// import { POLYGON_RPC, GNOSIS_RPC, OPTIMISM_RPC } from "./constant.js";
// import { paymasterOptions } from "./constant.js";
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
import { constructSwapTransaction } from "./solver/transactions/swapTransactions.js";
import { intentSteps } from "./constant.js";
import { constructSwapAndBridgeTransaction } from "./solver/transactions/bridgeAndSwapTransactions.js";
// import { ATOToSwapTranspiler } from "./utils/ATOtoSwapData.js";

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
const prompt2 = "Get half of my USDC from polygon to Gnosis";
const prompt3 = "Send 0.1 USDC on Polygon from Gnosis USDT balance";

const users = [];
let userQuestionStates = {};
let userIntentConfirmation = {
  executeIntent: false,
  isIntentProcessing: false,
};
let userCurrentBalance = {};

// const intentExecution = (bot, chatId, intent, userAddress) => {

// }

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
      const wallet = wallets[randomValue % 20];
      userScaAddress = "0xe407F56Df5825a7454e266cb2a83D9e3A7c31FF7";

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
      ],
    },
  };

  const greetMessage = welcomeMessage(userScaAddress);

  bot.sendMessage(chatId, greetMessage, preformedOpts);
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
        [{ text: `confirm`, callback_data: "confirm" }],
        [{ text: `cancell`, callback_data: "cancell" }],
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
  while (!userIntentConfirmation[chatId].executeIntent) {
    await delay(1000);
  }
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text === "/start") return;

  const userMeta = users.find((userData) => userData.chatId === chatId);

  console.log("thjis is userr meta", userMeta);

  //   return; //! just for now

  if (!userMeta) {
    bot.sendMessage(chatId, "Wallet not initialized");
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

  if (Object.keys(userIntentConfirmation).includes(String(chatId))) {
    console.log("it shouldn be here ", chatId, userIntentConfirmation[chatId]);
    if (userIntentConfirmation[chatId].isIntentProcessing) {
      bot.sendMessage(chatId, "Previous intent already in processing !!");
      return;
    }
  }

  console.log("random shit by user", msg);
  userIntentConfirmation[chatId] = {
    executeIntent: false,
    isIntentProcessing: true,
  };

  bot.sendMessage(chatId, "Intent decoding started..");







  let intentATOs = await transpile(msg.text, publicAddress);
  console.log("these are intent ATos;", intentATOs);
  bot.sendMessage(chatId, "intent decoded into transaction..");

  console.log("this is intent ato ", intentATOs);

  let swapData,
    bridgeData = "";

  try {
    if (intentATOs.length === 1) {
      // for bridge or swap
      if (
        checkSimilarity(intentATOs[0].operation, "SWAP") >
        checkSimilarity(intentATOs[0].operation, "BRIDGE")
      ) {
        let fixableIntent = intentATOs[0];

        const userBalances = await getTokenBalances(userMeta.scaAddress);
        bot.sendMessage(chatId, "Fetched latest wallet balance");
        console.log("this is user balance ", userBalances);

        console.log("this is zereo ato", intentATOs[0]);
        const questions = ATOValidationForSwap(fixableIntent, userBalances);
        console.log("question to be asked for ATO filling", questions);

        userQuestionStates[chatId] = [...questions];
        for (let i = 0; i < userQuestionStates[chatId].length; i++) {
          const ATOField = userQuestionStates[chatId][i].field;
          const opts = buildOptsForQuestion(
            i,
            userQuestionStates[chatId][i].options
          );
          bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
          await waitForAnswer(chatId, i);
          // now we have the ans
          fixableIntent[ATOField] = userQuestionStates[chatId][i].ans;
        }

        bot.sendMessage(chatId, "Intent validated");

        //! need to make sure we are passsing valie ATO
        swapData = swapTxnDataExtractor(
          fixableIntent,
          userMeta.scaAddress,
          userBalances
        );
        console.log("thos is swap data", swapData);

        //! here we will have to do some stuff for state mangement thing
        //! handle if the api request failed here
        //! amount wala issue
        const txnConstructionResponse = await constructSwapTransaction(
          swapData
        );
        bot.sendMessage(chatId, "Txn constructed");
        const intention = intentSteps(txnConstructionResponse.context);
        //! confirmation from user
        // console.log("this is swap txn ", txnConstruction);

        const optsForConfirmation = getOptsForConfirmation();
        bot.sendMessage(chatId, intention, optsForConfirmation);
        await waitForConfirmation(chatId);

        bot.sendMessage(chatId, "intent done");
      } else {
        const userBalances = await getTokenBalances(userMeta.scaAddress);
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
          const opts = buildOptsForQuestion(
            i,
            userQuestionStates[chatId][i].options
          );
          bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
          await waitForAnswer(chatId, i);
          fixableIntent[0][ATOField] = userQuestionStates[chatId][i].ans;
        }

        //! need to make sure we are passing valid ATO
        bridgeData = bridgeAndSwapTxnExtractor(
          fixableIntent,
          userMeta.scaAddress,
          userBalances
        );

        console.log("this is final bridge data ", bridgeData);
        //! constructing txn here

        const txnConstructionRespons = await constructSwapAndBridgeTransaction(
          bridgeData
        );

        const intention = intentSteps(txnConstructionRespons.context);
        const optsForConfirmation = getOptsForConfirmation();
        bot.sendMessage(chatId, intention, optsForConfirmation);
        await waitForConfirmation(chatId);

        bot.sendMessage(chatId, "intent done");
      }

      console.log("this is data", swapData, bridgeData);
    } else if (intentATOs.length === 2) {
      // for bridge and swap
      const userBalances = await getTokenBalances(userMeta.scaAddress);
      console.log("this is user balance ", userBalances);

      const questions = ATOValidationForSwapAndBridge(intentATOs, userBalances);
      console.log("questions to be asked for ATO filling", questions);

      userQuestionStates[chatId] = [...questions];
      let fixableIntent = intentATOs;

      for (let i = 0; i < userQuestionStates[chatId].length; i++) {
        const ATOField = userQuestionStates[chatId][i].field;
        const ATOIndex = userQuestionStates[chatId][i].index;
        const opts = buildOptsForQuestion(
          i,
          userQuestionStates[chatId][i].options
        );
        bot.sendMessage(chatId, userQuestionStates[chatId][i].text, opts);
        await waitForAnswer(chatId, i);
        // now we have the ans
        fixableIntent[ATOIndex][ATOField] = userQuestionStates[chatId][i].ans;
      }

      bridgeData = bridgeAndSwapTxnExtractor(
        fixableIntent,
        userMeta.scaAddress,
        userBalances
      );
      console.log("this is final bridge data what ever it is", bridgeData);
      console.log("this shit is called ");

      const txnConstructionResponse = await constructSwapAndBridgeTransaction(
        bridgeData
      );
      const intention = intentSteps(txnConstructionResponse.context);

      const optsForConfirmation = getOptsForConfirmation();
      bot.sendMessage(chatId, intention, optsForConfirmation);

      await waitForConfirmation(chatId);
      bot.sendMessage(chatId, "intent done");
    } else {
      bot.sendMessage(
        chatId,
        "Platform don't supported this transaction for now !!"
      );
    }
  } catch (err) {
    console.log("this is the errior received ", err);
    bot.sendMessage(
      chatId,
      "Platform don't support this type of intents for now"
    );
  }
  //clean up
  userQuestionStates[chatId] = [];
  userIntentConfirmation[chatId].isIntentProcessing = false;


});

bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (isJSON(data)) {
    const { value, text, qno } = JSON.parse(data);
    userQuestionStates[chatId][qno].ans = value;
  } else {
    switch (data) {
      case "preFormedPrompt_1": {

      }
      case "preFormedPrompt_2": {

      }
      case "preFormedPrompt_3": {

      }
      case "confirm": {
        userIntentConfirmation[chatId].executeIntent = true;
      }
      case "cancell": {
        userIntentConfirmation[chatId].executeIntent = false;
      }
    }
  }
});

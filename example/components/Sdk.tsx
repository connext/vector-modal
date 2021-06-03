import * as React from "react";

import { ConnextSdk, TransferQuote } from "@connext/vector-sdk";

const Sdk: React.FC = () => {
  const connextSdk = new ConnextSdk();

  const init = async () => {
    try {
      await connextSdk.init({
        routerPublicIdentifier: "vector7tbbTxQp8ppEQUgPsbGiTrVdapLdU5dH7zTbVuXRf1M4CEBU9Q", // Router Public Identifier
        loginProvider: undefined, // Web3/JsonRPCProvider
        senderChainProvider: "https://goerli.infura.io/v3/af2f28bdb95d40edb06226a46106f5f9", // Rpc Provider Link
        senderAssetId: "0xbd69fC70FA1c3AED524Bb4E82Adc5fcCFFcD79Fa", // Asset/Token Address on Sender Chain
        recipientChainProvider: "https://rpc-mumbai.matic.today", // Rpc Provider Link
        recipientAssetId: "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1", // Asset/Token Address on Recipient Chain
      });
    } catch (e) {
      const message = "Error initalizing";
      console.log(e, message);
      throw e;
    }
  };

  const getEstimatedFee = async (input: string) => {
    try {
      const res = await connextSdk.estimateFees({
        transferAmount: input,
      });
      console.log(res);
    } catch (e) {
      const message = "Error Estimating Fees";
      console.log(message, e);
    }
  };

//   const deposit = async (transferAmount: string) => {
//     // const address = await webProvider.getSigner().getAddress();
//     // console.log(address);
//     try {
//       await connextSdk.deposit({
//         transferAmount,
//         webProvider,
//         onDeposited: function(params) {
//           console.log("On deposit ==>", params);
//         }, // onFinished callback function
//       });
//     } catch (e) {
//       console.log("Error during deposit", e);
//     }
//   };

  const crossChainSwap = async withdrawalAddress => {
    try {
      await connextSdk.crossChainSwap({
        recipientAddress: withdrawalAddress, // Recipient Address
        transferQuote: {} as TransferQuote,
        onFinished: function(params) {
          console.log("On finish ==>", params);
        }, // onFinished callback function
      });
    } catch (e) {
      console.log("Error at crossChain Swap", e);
      throw e;
    }
  };

  return <></>;
};

export default Sdk;

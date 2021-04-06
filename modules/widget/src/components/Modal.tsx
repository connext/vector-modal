import React, { FC, useEffect, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import Modal, { ModalProvider, BaseModalBackground } from "styled-react-modal";
import {
  CHAIN_DETAIL,
  getTotalDepositsBob,
  getChain,
  getUserBalance,
  ConnextSdk,
  BrowserNode,
} from "@connext/vector-sdk";
import { BigNumber, utils, providers } from "ethers";
import { ERROR_STATES, SCREEN_STATES, ScreenStates, ErrorStates } from "../constants";
import { theme, Fonts, ModalOverlay, ModalContentContainer, BackButton, CloseButton } from "./common";
import { Loading, Swap, SwapListener, Status, ErrorScreen, Success, Recover, ExistingBalance } from "./pages";
import { Options } from "./static";

export type ConnextModalProps = {
  showModal: boolean;
  routerPublicIdentifier: string;
  depositChainId?: number;
  depositChainProvider: string;
  depositAssetId: string;
  withdrawChainProvider: string;
  withdrawChainId?: number;
  withdrawAssetId: string;
  withdrawalAddress: string;
  transferAmount?: string;
  injectedProvider?: any;
  loginProvider: any;
  iframeSrcOverride?: string;
  withdrawCallTo?: string;
  withdrawCallData?: string;
  onClose: () => void;
  onReady?: (params: { depositChannelAddress: string; withdrawChannelAddress: string }) => any;
  onSwap?: (inputSenderAmountWei: string, node: BrowserNode) => Promise<void>;
  onDepositTxCreated?: (txHash: string) => void;
  onFinished?: (txHash: string, amountWei: string) => void;
  generateCallData?: (toWithdraw: string, toAssetId: string, node: BrowserNode) => Promise<{ callData?: string }>;
};

const ConnextModal: FC<ConnextModalProps> = ({
  showModal,
  routerPublicIdentifier,
  depositChainProvider,
  depositAssetId: _depositAssetId,
  depositChainId: _depositChainId,
  withdrawChainProvider,
  withdrawAssetId: _withdrawAssetId,
  withdrawChainId: _withdrawChainId,
  withdrawalAddress,
  transferAmount: _transferAmount,
  injectedProvider: _injectedProvider,
  loginProvider: _loginProvider,
  iframeSrcOverride,
  withdrawCallTo,
  withdrawCallData,
  generateCallData,
  onClose,
  onReady,
  onSwap,
  onDepositTxCreated,
  onFinished,
}) => {
  const depositAssetId = utils.getAddress(_depositAssetId);
  const withdrawAssetId = utils.getAddress(_withdrawAssetId);

  // const [opacity, setOpacity] = useState(0);
  const [webProvider, setWebProvider] = useState<undefined | providers.Web3Provider>();

  const loginProvider: undefined | providers.Web3Provider = !!_loginProvider
    ? new providers.Web3Provider(_loginProvider)
    : undefined;

  const [transferAmountUi, setTransferAmountUi] = useState<string | undefined>();
  const [receivedAmountUi, setReceivedAmountUi] = useState<string | undefined>();
  const [transferFeeUi, setTransferFeeUi] = useState<string>("--");

  const [existingChannelBalanceUi, setExistingChannelBalanceUi] = useState<string | undefined>();

  const [successWithdrawalAmount, setSuccessWithdrawalAmount] = useState<string>();

  const [senderChain, setSenderChain] = useState<CHAIN_DETAIL>();
  const [receiverChain, setReceiverChain] = useState<CHAIN_DETAIL>();

  const [userBalance, setUserBalance] = useState<string>();

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [error, setError] = useState<Error>();
  const [amountError, setAmountError] = useState<string>();

  const [connextSdk, setConnextSdk] = useState<ConnextSdk>();

  const [listener, setListener] = useState<NodeJS.Timeout>();

  const [screenState, setScreenState] = useState<ScreenStates>(SCREEN_STATES.LOADING);

  const [lastScreenState, setLastScreenState] = useState<ScreenStates | undefined>();

  const [title, setTitle] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [showTimer, setShowTimer] = useState<boolean>(false);

  // temp
  const [inputReadOnly, setInputReadOnly] = useState<boolean>(false);

  const onSuccess = (txHash: string, amountUi?: string, amountBn?: BigNumber) => {
    console.log(txHash, amountUi, amountBn);
    setWithdrawTx(txHash);
    setSuccessWithdrawalAmount(amountUi!);

    if (onFinished) {
      onFinished(txHash, amountBn!.toString());
    }
  };

  const depositListenerAndTransfer = async () => {
    handleScreen({ state: SCREEN_STATES.LISTENER });
    setShowTimer(true);
    let initialDeposits: BigNumber;
    try {
      initialDeposits = await getTotalDepositsBob(
        connextSdk?.senderChainChannelAddress!,
        senderChain!.assetId!,
        senderChain!.rpcProvider!,
      );
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: "Error getting total deposits",
      });
      return;
    }
    console.log(
      `Starting balance on ${senderChain?.chainId!} for ${
        connextSdk!.senderChainChannelAddress
      } of asset ${depositAssetId}: ${initialDeposits.toString()}`,
    );

    let depositListener = setInterval(async () => {
      let updatedDeposits: BigNumber;
      try {
        updatedDeposits = await getTotalDepositsBob(
          connextSdk!.senderChainChannelAddress,
          depositAssetId,
          senderChain!.rpcProvider!,
        );
      } catch (e) {
        console.warn(`Error fetching balance: ${e.message}`);
        return;
      }
      console.log(
        `Updated balance on ${senderChain?.chainId!} for ${
          connextSdk!.senderChainChannelAddress
        } of asset ${depositAssetId}: ${updatedDeposits.toString()}`,
      );

      if (updatedDeposits.lt(initialDeposits)) {
        initialDeposits = updatedDeposits;
      }

      if (updatedDeposits.gt(initialDeposits)) {
        clearInterval(depositListener!);
        setShowTimer(false);
        await handleSwap();
      }
    }, 5_000);
    setListener(depositListener);
  };

  const handleSwapCheck = async (_input: string | undefined, receiveExactAmount: boolean) => {
    const input = _input ? _input.trim() : undefined;
    receiveExactAmount ? setReceivedAmountUi(input) : setTransferAmountUi(input);

    try {
      const res = await connextSdk!.estimateFees({
        transferAmount: input,
        isRecipientAssetInput: receiveExactAmount,
        userBalanceWei: userBalance,
      });
      console.log(res);
      setAmountError(res.error);

      receiveExactAmount ? setTransferAmountUi(res.senderAmount) : setReceivedAmountUi(res.recipientAmount);

      if (res.totalFee) setTransferFeeUi(res.totalFee);
    } catch (e) {
      const message = "Error Estimating Fees";
      console.log(message, e);
      setAmountError(e.message);
    }
  };

  const handleSwapRequest = async () => {
    setIsLoad(true);

    try {
      await connextSdk!.preTransferCheck(receivedAmountUi!);
    } catch (e) {
      console.log("Error at preCheck", e);
      setIsLoad(false);
      setAmountError(e.message);
      return;
    }

    const transferAmountBn: BigNumber = BigNumber.from(
      utils.parseUnits(transferAmountUi!, senderChain?.assetDecimals!),
    );

    if (onSwap) {
      try {
        console.log("Calling onSwap function");
        await onSwap(transferAmountBn.toString(), connextSdk?.browserNode!);
      } catch (e) {
        console.log("onswap error", e);
        setIsLoad(false);

        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: e,
          message: "Error calling onSwap",
        });
        return;
      }

      setIsLoad(false);

      console.log(`Starting block listener`);
      await depositListenerAndTransfer();
    } else if (webProvider) {
      // deposit
      try {
        await connextSdk!.deposit({
          transferAmount: transferAmountUi!,
          webProvider: webProvider!,
          preTransferCheck: false,
          onDeposited: onDepositTxCreated,
        });
      } catch (e) {
        setIsLoad(false);
        if (e.message.includes("User denied transaction signature")) {
          return;
        }
        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: e,
          message: "Error in injected provider deposit: ",
        });
        return;
      }
      setIsLoad(false);

      await handleSwap();
    } else {
      console.log(`Starting block listener`);
      // display QR
      setIsLoad(false);
      await depositListenerAndTransfer();
    }
  };

  const handleSwap = async () => {
    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: "transferring",
      message: `Transferring ${senderChain?.assetName!}. This step can take some time if the chain is congested`,
    });

    try {
      await connextSdk!.transfer({});
    } catch (e) {
      const message = "Error at Transfer";
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: message,
      });
      return;
    }

    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: "withdrawing",
      message: `withdrawing ${senderChain?.assetName} to ${receiverChain?.name}. This step can take some time if the chain is congested`,
    });

    try {
      await connextSdk!.withdraw({
        recipientAddress: withdrawalAddress,
        onFinished: onSuccess,
        withdrawalCallTo: withdrawCallTo,
        withdrawalCallData: withdrawCallData,
        generateCallData: generateCallData,
      });
    } catch (e) {
      const message = "Error at withdraw";
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: message,
      });
      return;
    }

    handleScreen({ state: SCREEN_STATES.SUCCESS });
  };

  const stateReset = () => {
    handleScreen({ state: SCREEN_STATES.LOADING });
    setWebProvider(undefined);
    setInputReadOnly(false);
    setIsLoad(false);
    setTransferFeeUi("--");
    setExistingChannelBalanceUi("");
    setReceivedAmountUi("");
    setUserBalance(undefined);
    setError(undefined);
  };

  const setup = async () => {
    // set web provider
    setMessage("getting chains info...");
    const injectedProvider: undefined | providers.Web3Provider = !!_injectedProvider
      ? new providers.Web3Provider(_injectedProvider)
      : undefined;

    setWebProvider(injectedProvider);

    // get chain info
    let senderChainInfo: CHAIN_DETAIL;
    try {
      senderChainInfo = await getChain(_depositChainId, depositChainProvider, depositAssetId);
      setSenderChain(senderChainInfo);
    } catch (e) {
      const message = "Failed to fetch sender chain info";
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    let receiverChainInfo: CHAIN_DETAIL;
    try {
      receiverChainInfo = await getChain(_withdrawChainId, withdrawChainProvider, withdrawAssetId);
      setReceiverChain(receiverChainInfo);
    } catch (e) {
      const message = "Failed to fetch receiver chain info";
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    // handle if _transferAmount provided
    if (_transferAmount) {
      try {
        setInputReadOnly(true);
        setTransferAmountUi(_transferAmount);
      } catch (e) {
        const message = "Error with transferAmount param";
        console.log(e, message);
        handleScreen({
          state: ERROR_STATES.ERROR_SETUP,
          error: e,
          message: message,
        });
        return;
      }
    }

    // handle if injectedProvider provided
    if (injectedProvider) {
      try {
        const network = await injectedProvider.getNetwork();
        console.log(network);
        if (senderChainInfo.chainId !== network.chainId) {
          const message = `Please connect your wallet to the ${senderChainInfo.name} : ${senderChainInfo.chainId} network`;
          const defaultMetmaskNetworks = [1, 3, 4, 5, 42];

          const _state: ErrorStates =
            // @ts-ignore
            ethereum &&
            // @ts-ignore
            ethereum.isMetaMask &&
            !defaultMetmaskNetworks.includes(senderChainInfo.chainId)
              ? ERROR_STATES.ERROR_NETWORK
              : ERROR_STATES.ERROR_SETUP;
          handleScreen({
            state: _state,
            error: new Error(message),
            title: "Switch Network",
            message: message,
          });
          return;
        }

        const _userBalance = await getUserBalance(
          injectedProvider,
          senderChainInfo.assetId,
          senderChainInfo.assetDecimals,
        );
        setUserBalance(_userBalance);
      } catch (e) {
        const message = e.message;
        console.log(e, message);
        handleScreen({
          state: ERROR_STATES.ERROR_SETUP,
          error: e,
          message: message,
        });
        return;
      }
    }

    setMessage("Setting up channels...");

    let connextSdk = new ConnextSdk();
    try {
      await connextSdk.setup({
        routerPublicIdentifier,
        loginProvider: loginProvider,
        senderChainProvider: depositChainProvider,
        senderAssetId: depositAssetId,
        recipientChainProvider: withdrawChainProvider,
        recipientAssetId: withdrawAssetId,
        senderChainId: _depositChainId,
        recipientChainId: _withdrawChainId,
        iframeSrcOverride: iframeSrcOverride,
      });
      setConnextSdk(connextSdk);
    } catch (e) {
      if (
        e.message.includes("localStorage not available in this window") ||
        e.message.includes("Failed to read the 'localStorage'") ||
        e.message.includes("The user denied permission to access the database")
      ) {
        alert(
          "Please disable shields or ad blockers or allow third party cookies in your browser and try again. Connext requires cross-site cookies to store your channel states.",
        );
      }
      const message = "Error initalizing";
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: e.message,
      });
      return;
    }

    if (onReady) {
      onReady({
        depositChannelAddress: connextSdk!.senderChainChannelAddress,
        withdrawChannelAddress: connextSdk!.recipientChainChannelAddress,
      });
    }

    setMessage("Looking for pending Transfers...");
    let response;
    try {
      response = await connextSdk!.checkPendingTransfer();
    } catch (e) {
      const message = "Failed at Pending Tranfer Check";
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: message,
      });
      return;
    }

    console.log(response);

    const offChainDepositAssetBalance = response.offChainSenderChainAssetBalanceBn;
    const offChainWithdrawAssetBalance = response.offChainRecipientChainAssetBalanceBn;
    if (offChainDepositAssetBalance.gt(0) && offChainWithdrawAssetBalance.gt(0)) {
      console.warn("Balance exists in both channels, transferring first, then withdrawing");
    }
    // if offChainDepositAssetBalance > 0
    if (offChainDepositAssetBalance.gt(0)) {
      const existingBalance = utils.formatUnits(offChainDepositAssetBalance, senderChainInfo?.assetDecimals!);

      setExistingChannelBalanceUi(existingBalance);
      handleScreen({
        state: SCREEN_STATES.EXISTING_BALANCE,
      });
    }

    // if offchainWithdrawBalance > 0
    else if (offChainWithdrawAssetBalance.gt(0)) {
      // then go to withdraw screen with transfer amount == balance
      handleScreen({
        state: SCREEN_STATES.STATUS,
        title: "withdrawing",
        message: `withdrawing ${senderChain?.assetName} to ${receiverChain?.name}. This step can take some time if the chain is congested`,
      });

      try {
        await connextSdk!.withdraw({
          recipientAddress: withdrawalAddress,
          onFinished: onSuccess,
          withdrawalCallTo: withdrawCallTo,
          withdrawalCallData: withdrawCallData,
          generateCallData: generateCallData,
        });
      } catch (e) {
        const message = "Error at withdraw";
        console.log(e, message);
        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: e,
          message: message,
        });
        return;
      }

      handleScreen({ state: SCREEN_STATES.SUCCESS });
    }

    // if both are zero, register listener and display
    // QR code
    else {
      handleScreen({ state: SCREEN_STATES.SWAP });
    }
  };

  const init = async () => {
    if (!showModal) {
      return;
    }

    stateReset();
    setup();
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleOptions = () => {
    return <Options state={screenState} onClose={handleClose} handleRecoveryButton={handleRecoveryButton} />;
  };

  const handleBack = () => {
    return (
      <BackButton
        isDisabled={
          !lastScreenState ||
          [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS, ...Object.values(ERROR_STATES)].includes(lastScreenState as any)
            ? true
            : false
        }
        onClick={() => {
          clearInterval(listener!);
          handleScreen({ state: lastScreenState! });
        }}
      />
    );
  };

  const handleClose = () => {
    clearInterval(listener!);
    setShowTimer(false);
    onClose();
  };
  const handleCloseButton = () => {
    return (
      <CloseButton
        isDisabled={[SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(screenState as any) ? true : false}
        onClick={onClose}
      />
    );
  };

  const handleRecoveryButton = () => {
    console.log("click on recovery button", screenState);
    switch (screenState) {
      case SCREEN_STATES.RECOVERY:
        handleScreen({ state: SCREEN_STATES.SWAP });
        return;

      default:
        handleScreen({ state: SCREEN_STATES.RECOVERY });
        return;
    }
  };

  const switchNetwork = async () => {
    console.log(senderChain?.chainParams!);
    // @ts-ignore
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [senderChain?.chainParams!],
    });

    init();
  };

  const continueButton = async () => {
    setExistingChannelBalanceUi("");
    handleSwap();
  };

  const addMoreFunds = async () => {
    // existing funds helper text will be added
    handleScreen({ state: SCREEN_STATES.SWAP });
  };

  const handleScreen = (params: {
    state: ScreenStates;
    error?: Error | undefined;
    title?: string;
    message?: string;
  }) => {
    const { state, error: pError, title: pTitle, message: pMessage } = params;
    switch (state) {
      case SCREEN_STATES.LOADING:
        break;

      case SCREEN_STATES.EXISTING_BALANCE:
        break;

      case SCREEN_STATES.SWAP:
        break;

      case SCREEN_STATES.SUCCESS:
        break;

      case SCREEN_STATES.RECOVERY:
        break;

      case SCREEN_STATES.LISTENER:
        break;

      case SCREEN_STATES.STATUS:
        setTitle(pTitle);
        setMessage(pMessage);
        break;

      default:
        console.log(pMessage);
        const _title = pTitle ? pTitle : state === ERROR_STATES.ERROR_TRANSFER ? "Transfer Error" : "Setup Error";

        setTitle(_title);
        setError(pError);
        break;
    }
    setScreenState((prevState: ScreenStates) => {
      setLastScreenState(prevState);
      return state;
    });
    return;
  };

  const activeScreen = (state: ScreenStates) => {
    switch (state) {
      case SCREEN_STATES.LOADING:
        return <Loading message={message!} />;

      case SCREEN_STATES.STATUS:
        return (
          <Status
            title={title!}
            message={message!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            options={handleOptions}
          />
        );

      case SCREEN_STATES.EXISTING_BALANCE:
        return (
          <ExistingBalance
            addMoreFunds={addMoreFunds}
            continueButton={continueButton}
            existingChannelBalance={existingChannelBalanceUi!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            options={handleOptions}
          />
        );
      case SCREEN_STATES.SWAP:
        return (
          <Swap
            onUserInput={handleSwapCheck}
            swapRequest={handleSwapRequest}
            isLoad={isLoad}
            inputReadOnly={inputReadOnly}
            userBalance={userBalance}
            amountError={amountError}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            senderAmount={transferAmountUi}
            recipientAmount={receivedAmountUi}
            existingChannelBalance={existingChannelBalanceUi!}
            feeQuote={transferFeeUi}
            options={handleOptions}
          />
        );

      case SCREEN_STATES.RECOVERY:
        console.log("return recovery");
        return (
          <Recover
            senderChainInfo={senderChain!}
            node={connextSdk?.browserNode!}
            depositAddress={connextSdk!.senderChainChannelAddress}
            handleOptions={handleOptions}
            handleBack={handleBack}
            handleCloseButton={handleCloseButton}
          />
        );

      case SCREEN_STATES.LISTENER:
        return (
          <SwapListener
            showTimer={showTimer}
            senderChannelAddress={connextSdk!.senderChainChannelAddress}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            options={handleOptions}
            handleBack={handleBack}
          />
        );

      case SCREEN_STATES.SUCCESS:
        return (
          <Success
            amount={successWithdrawalAmount!}
            transactionId={withdrawTx!}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            onClose={handleCloseButton}
            options={handleOptions}
          />
        );

      default:
        return (
          <ErrorScreen
            error={error ?? new Error("unknown")}
            title={title!}
            retry={init}
            senderChannelAddress={connextSdk ? connextSdk.senderChainChannelAddress : ""}
            recipientChannelAddress={connextSdk ? connextSdk.recipientChainChannelAddress : ""}
            switchNetwork={switchNetwork}
            state={state}
            senderChainInfo={senderChain!}
            receiverChainInfo={receiverChain!}
            receiverAddress={withdrawalAddress}
            handleRecoveryButton={handleRecoveryButton}
            options={handleOptions}
            handleBack={handleBack}
          />
        );
    }
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <Fonts />
        <ModalProvider backgroundComponent={FadingBackground}>
          <StyledModal
            isOpen={showModal}
            allowScroll={true}
            // afterOpen={afterOpen}
            beforeClose={handleClose}
            // opacity={opacity}
            // backgroundProps={{ opacity }}
            // size="md"
            // scrollBehavior="inside"
            // isCentered
          >
            <ModalOverlay />
            <ModalContentContainer>{activeScreen(screenState)}</ModalContentContainer>
          </StyledModal>
        </ModalProvider>
      </ThemeProvider>
    </>
  );
};

export default ConnextModal;

const StyledModal = Modal.styled`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  transition : all 0.3s ease-in-out;`;

const FadingBackground = styled(BaseModalBackground)`
  transition: all 0.3s ease-in-out;
`;

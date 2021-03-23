import { BrowserNode } from '@connext/vector-browser-node';
import React, { FC, useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { Modal } from '@chakra-ui/react';
import { ERC20Abi } from '@connext/vector-types';
import { BigNumber, constants, utils, providers, Contract } from 'ethers';
import {
  ERROR_STATES,
  SCREEN_STATES,
  CHAIN_DETAIL,
  ScreenStates,
  ErrorStates,
  getTotalDepositsBob,
  getChain,
  getUserBalance,
  ConnextSdk,
} from '@connext/vector-sdk';
import {
  theme,
  Fonts,
  ModalOverlay,
  ModalContentContainer,
  BackButton,
  CloseButton,
} from './common';
import {
  Loading,
  Swap,
  SwapListener,
  Status,
  ErrorScreen,
  Success,
  Recover,
  ExistingBalance,
} from './pages';
import { Options } from './static';

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
  onReady?: (params: {
    depositChannelAddress: string;
    withdrawChannelAddress: string;
  }) => any;
  onSwap?: (inputSenderAmountWei: string, node: BrowserNode) => Promise<void>;
  onDepositTxCreated?: (txHash: string) => void;
  onFinished?: (txHash: string, amountWei: string) => void;
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
  onClose,
  onReady,
  onSwap,
  onDepositTxCreated,
  onFinished,
}) => {
  const depositAssetId = utils.getAddress(_depositAssetId);
  const withdrawAssetId = utils.getAddress(_withdrawAssetId);

  const [webProvider, setWebProvider] = useState<
    undefined | providers.Web3Provider
  >();

  const loginProvider: undefined | providers.Web3Provider = !!_loginProvider
    ? new providers.Web3Provider(_loginProvider)
    : undefined;

  const [transferAmountUi, setTransferAmountUi] = useState<
    string | undefined
  >();
  const [receivedAmountUi, setReceivedAmountUi] = useState<
    string | undefined
  >();
  const [transferFeeUi, setTransferFeeUi] = useState<string>('--');

  const [
    successWithdrawalAmount,
    setSuccessWithdrawalAmount,
  ] = useState<string>();

  const [senderChain, setSenderChain] = useState<CHAIN_DETAIL>();
  const [receiverChain, setReceiverChain] = useState<CHAIN_DETAIL>();

  const [userBalance, setUserBalance] = useState<string>();

  const [withdrawTx, setWithdrawTx] = useState<string>();

  const [error, setError] = useState<Error>();
  const [amountError, setAmountError] = useState<string>();

  const [connextSdk, setConnextSdk] = useState<ConnextSdk>();

  const [listener, setListener] = useState<NodeJS.Timeout>();

  const [screenState, setScreenState] = useState<ScreenStates>(
    SCREEN_STATES.LOADING
  );

  const [lastScreenState, setLastScreenState] = useState<
    ScreenStates | undefined
  >();

  const [title, setTitle] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [isLoad, setIsLoad] = useState<boolean>(false);
  const [showTimer, setShowTimer] = useState<boolean>(false);

  // temp
  const [inputReadOnly, setInputReadOnly] = useState<boolean>(false);

  const [
    existingChannelBalanceBn,
    setExistingChannelBalanceBn,
  ] = useState<BigNumber>();

  // const cancelTransfer = async (
  //   depositChannelAddress: string,
  //   withdrawChannelAddress: string,
  //   transferId: string,
  //   crossChainTransferId: string,
  //   _evts: EvtContainer,
  //   _node: BrowserNode
  // ) => {
  //   // show a better screen here, loading UI
  //   handleScreen({
  //     state: ERROR_STATES.ERROR_TRANSFER,
  //     error: new Error('Cancelling transfer...'),
  //   });

  //   const senderResolution = _evts.CONDITIONAL_TRANSFER_RESOLVED.pipe(
  //     (data) =>
  //       data.transfer.meta.crossChainTransferId === crossChainTransferId &&
  //       data.channelAddress === depositChannelAddress
  //   ).waitFor(45_000);

  //   const receiverResolution = _evts.CONDITIONAL_TRANSFER_RESOLVED.pipe(
  //     (data) =>
  //       data.transfer.meta.crossChainTransferId === crossChainTransferId &&
  //       data.channelAddress === withdrawChannelAddress
  //   ).waitFor(45_000);
  //   try {
  //     await cancelToAssetTransfer(_node, withdrawChannelAddress, transferId);
  //   } catch (e) {
  //     handleScreen({
  //       state: ERROR_STATES.ERROR_TRANSFER,
  //       error: e,
  //       message: 'Error in cancelToAssetTransfer',
  //     });
  //   }

  //   try {
  //     await Promise.all([senderResolution, receiverResolution]);
  //     handleScreen({
  //       state: ERROR_STATES.ERROR_TRANSFER,
  //       error: new Error('Transfer was cancelled'),
  //     });
  //   } catch (e) {
  //     handleScreen({
  //       state: ERROR_STATES.ERROR_TRANSFER,
  //       error: e,
  //       message: 'Error waiting for sender and receiver cancellations',
  //     });
  //   }
  // };

  const onSuccess = (
    txHash: string,
    amountUi?: string,
    amountBn?: BigNumber
  ) => {
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
        connextSdk!.senderChannelChainAddress,
        senderChain?.chainId,
        senderChain?.rpcProvider
      );
    } catch (e) {
      handleScreen({
        state: ERROR_STATES.ERROR_TRANSFER,
        error: e,
        message: 'Error getting total deposits',
      });
      return;
    }
    console.log(
      `Starting balance on ${senderChain?.chainId!} for ${
        connextSdk!.senderChannelChainAddress
      } of asset ${depositAssetId}: ${initialDeposits.toString()}`
    );

    let depositListener = setInterval(async () => {
      let updatedDeposits: BigNumber;
      try {
        updatedDeposits = await getTotalDepositsBob(
          connextSdk!.senderChannelChainAddress,
          depositAssetId,
          senderChain?.rpcProvider
        );
      } catch (e) {
        console.warn(`Error fetching balance: ${e.message}`);
        return;
      }
      console.log(
        `Updated balance on ${senderChain?.chainId!} for ${
          connextSdk!.senderChannelChainAddress
        } of asset ${depositAssetId}: ${updatedDeposits.toString()}`
      );

      if (updatedDeposits.lt(initialDeposits)) {
        initialDeposits = updatedDeposits;
      }

      if (updatedDeposits.gt(initialDeposits)) {
        clearInterval(depositListener!);
        setShowTimer(false);
        const transferAmount = updatedDeposits.sub(initialDeposits);
        initialDeposits = updatedDeposits;
        await handleSwap();
      }
    }, 5_000);
    setListener(depositListener);
  };

  const handleSwapCheck = async (
    _input: string | undefined,
    receiveExactAmount: boolean
  ) => {
    const input = _input ? _input.trim() : undefined;
    receiveExactAmount
      ? setReceivedAmountUi(input)
      : setTransferAmountUi(input);

    try {
      const res = await connextSdk!.estimateFees({
        input: input,
        isRecipientAssetInput: receiveExactAmount,
        userBalance: userBalance,
      });
      console.log(res);
      setAmountError(res.error);

      receiveExactAmount
        ? setTransferAmountUi(res.senderAmount)
        : setReceivedAmountUi(res.recipientAmount);

      if (res.totalFee) setTransferFeeUi(res.totalFee);
    } catch (e) {
      const message = 'Error Estimating Fees';
      console.log(message, e);
      setAmountError(e.message);
    }
  };

  const handleSwapRequest = async () => {
    setIsLoad(true);

    try {
      await connextSdk!.preTransferCheck(receivedAmountUi!);
    } catch (e) {
      console.log('Error at preCheck', e);
      setIsLoad(false);
      setAmountError(e.message);
      return;
    }

    const transferAmountBn: BigNumber = BigNumber.from(
      utils.parseUnits(transferAmountUi!, senderChain?.assetDecimals!)
    );

    if (onSwap) {
      try {
        console.log('Calling onSwap function');
        await onSwap(transferAmountBn.toString(), connextSdk?.connextClient!);
      } catch (e) {
        console.log('onswap error', e);
        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: e,
          message: 'Error calling onSwap',
        });
        return;
      }
    }

    if (!webProvider) {
      console.log(`Starting block listener`);
      // display QR
      setIsLoad(false);
      await depositListenerAndTransfer();
    } else {
      // deposit
      try {
        const signer = webProvider.getSigner();
        const depositAddress = connextSdk!.senderChainChannelAddress;
        console.log(depositAddress, transferAmountBn, depositAssetId);
        const depositTx =
          depositAssetId === constants.AddressZero
            ? await signer.sendTransaction({
                to: depositAddress!,
                value: transferAmountBn,
              })
            : await new Contract(depositAssetId, ERC20Abi, signer).transfer(
                depositAddress!,
                transferAmountBn
              );

        console.log('depositTx', depositTx.hash);
        if (onDepositTxCreated) {
          onDepositTxCreated(depositTx.hash);
        }
        const receipt = await depositTx.wait(1);
        console.log('deposit mined:', receipt.transactionHash);
      } catch (e) {
        setIsLoad(false);
        if (
          e.message.includes(
            'MetaMask Tx Signature: User denied transaction signature'
          )
        ) {
          return;
        }
        handleScreen({
          state: ERROR_STATES.ERROR_TRANSFER,
          error: e,
          message: 'Error in injected provider deposit: ',
        });
        return;
      }
      setIsLoad(false);

      await handleSwap();
    }
  };

  const handleSwap = async () => {
    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: 'transferring',
      message: `Transferring ${senderChain?.assetName!}. This step can take some time if the chain is congested`,
    });

    try {
      await connextSdk!.transfer();
    } catch (e) {
      console.log('Error at Transfer', e);
      throw Error(e);
    }

    handleScreen({
      state: SCREEN_STATES.STATUS,
      title: 'withdrawing',
      message: `withdrawing ${senderChain?.assetName} to ${receiverChain?.name}. This step can take some time if the chain is congested`,
    });

    try {
      await connextSdk!.withdraw({
        recipientAddress: withdrawalAddress,
        onFinished: onSuccess,
        withdrawCallTo: withdrawCallTo,
        withdrawCallData: withdrawCallData,
      });
    } catch (e) {
      console.log('Error at withdraw', e);
      throw Error(e);
    }

    handleScreen({ state: SCREEN_STATES.SUCCESS });
  };

  const stateReset = () => {
    handleScreen({ state: SCREEN_STATES.LOADING });
    setWebProvider(undefined);
    setInputReadOnly(false);
    setIsLoad(false);
    setTransferFeeUi('--');
    setExistingChannelBalanceBn(undefined);
    setReceivedAmountUi('');
    setUserBalance(undefined);
    setError(undefined);
  };

  const setup = async () => {
    // set web provider
    setMessage('getting chains info...');
    const injectedProvider:
      | undefined
      | providers.Web3Provider = !!_injectedProvider
      ? new providers.Web3Provider(_injectedProvider)
      : undefined;

    setWebProvider(injectedProvider);

    // get chain info
    let senderChainInfo: CHAIN_DETAIL;
    try {
      senderChainInfo = await getChain(
        _depositChainId,
        depositChainProvider,
        depositAssetId
      );
      setSenderChain(senderChainInfo);
    } catch (e) {
      const message = 'Failed to fetch sender chain info';
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
      receiverChainInfo = await getChain(
        _withdrawChainId,
        withdrawChainProvider,
        withdrawAssetId
      );
      setReceiverChain(receiverChainInfo);
    } catch (e) {
      const message = 'Failed to fetch receiver chain info';
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
        const message = 'Error with transferAmount param';
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
            title: 'Switch Network',
            message: message,
          });
          return;
        }

        const _userBalance = await getUserBalance(
          injectedProvider,
          senderChainInfo
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

    setMessage('Setting up channels...');

    try {
      let connextSdk = new ConnextSdk();
      await connextSdk.init({
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
      if (e.message.includes('localStorage not available in this window')) {
        alert(
          'Please disable shields or ad blockers and try again. Connext requires cross-site cookies to store your channel states.'
        );
      }
      if (e.message.includes("Failed to read the 'localStorage'")) {
        alert(
          'Please disable shields or ad blockers or allow third party cookies in your browser and try again. Connext requires cross-site cookies to store your channel states.'
        );
      }
      const message = 'Error initalizing';
      console.log(e, message);
      handleScreen({
        state: ERROR_STATES.ERROR_SETUP,
        error: e,
        message: e.message,
      });
      return;
    }
    // if both are zero, register listener and display
    // QR code

    handleScreen({ state: SCREEN_STATES.SWAP });
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
  }, [showModal]);

  const handleOptions = () => {
    return (
      <Options
        state={screenState}
        onClose={handleClose}
        handleRecoveryButton={handleRecoveryButton}
      />
    );
  };

  const handleBack = () => {
    return (
      <BackButton
        isDisabled={
          !lastScreenState ||
          [
            SCREEN_STATES.LOADING,
            SCREEN_STATES.STATUS,
            ...Object.values(ERROR_STATES),
          ].includes(lastScreenState as any)
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
        isDisabled={
          [SCREEN_STATES.LOADING, SCREEN_STATES.STATUS].includes(
            screenState as any
          )
            ? true
            : false
        }
        onClick={onClose}
      />
    );
  };

  const handleRecoveryButton = () => {
    console.log('click on recovery button', screenState);
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
      method: 'wallet_addEthereumChain',
      params: [senderChain?.chainParams!],
    });

    init();
  };

  const continueButton = async () => {
    setExistingChannelBalanceBn(undefined);
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
    existingChannelBalance?: BigNumber;
  }) => {
    const {
      state,
      error: pError,
      title: pTitle,
      message: pMessage,
      existingChannelBalance: _existingChannelBalance,
    } = params;
    switch (state) {
      case SCREEN_STATES.LOADING:
        break;

      case SCREEN_STATES.EXISTING_BALANCE:
        console.log();
        setExistingChannelBalanceBn(_existingChannelBalance);
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
        const _title = pTitle
          ? pTitle
          : state === ERROR_STATES.ERROR_TRANSFER
          ? 'Transfer Error'
          : 'Setup Error';

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
            existingChannelBalanceBn={existingChannelBalanceBn!}
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
            existingChannelBalanceBn={existingChannelBalanceBn!}
            feeQuote={transferFeeUi}
            options={handleOptions}
          />
        );

      case SCREEN_STATES.RECOVERY:
        console.log('return recovery');
        return (
          <Recover
            senderChainInfo={senderChain!}
            node={connextSdk?.connextClient!}
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
            error={error ?? new Error('unknown')}
            title={title!}
            retry={init}
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
        <Modal
          id="modal"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          isOpen={showModal}
          size="md"
          onClose={handleClose}
          scrollBehavior="inside"
          isCentered
        >
          <ModalOverlay />
          <ModalContentContainer>
            {activeScreen(screenState)}
          </ModalContentContainer>
        </Modal>
      </ThemeProvider>
    </>
  );
};

export default ConnextModal;

import React, { FC, useState } from 'react';
import { BigNumber, constants } from 'ethers';
import {
  CHAIN_DETAIL,
  BrowserNode,
  FullChannelState,
  getBalanceForAssetId,
} from '@connext/vector-sdk';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Button,
  InputGroup,
  Input,
} from '../common';
import { ERROR_STATES } from '../../constants';
import { Header, Footer } from '../static';
import Success from './Success';
import ErrorScreen from './ErrorScreen';
import Loading from './Loading';

export interface RecoveryProps {
  handleBack: () => void;
  handleCloseButton: () => void;
  handleOptions: () => void;
  senderChainInfo: CHAIN_DETAIL;
  node: BrowserNode;
  depositAddress?: string;
}

const Recover: FC<RecoveryProps> = (props) => {
  const {
    handleBack,
    handleCloseButton,
    handleOptions,
    depositAddress,
    senderChainInfo,
    node,
  } = props;

  const [recoverTokenAddress, setRecoverTokenAddress] = useState(
    constants.AddressZero
  );
  const [recoverTokenAddressError, setRecoverTokenAddressError] = useState(
    false
  );
  const [recoverWithdrawalAddress, setRecoverWithdrawalAddress] = useState('');
  const [
    recoverWithdrawalAddressError,
    setRecoverWithdrawalAddressError,
  ] = useState(false);
  const [withdrawalTxHash, setWithdrawalTxHash] = useState(constants.HashZero);
  const [amount, setAmount] = useState<string>();
  const [error, setError] = useState<Error>();
  const [status, setStatus] = useState<
    'Initial' | 'Loading' | 'Success' | 'Error'
  >('Initial');

  const recover = async (assetId: string, withdrawalAddress: string) => {
    const deposit = await node.reconcileDeposit({
      assetId,
      channelAddress: depositAddress!,
    });
    if (deposit.isError) {
      setStatus('Error');
      setError(deposit.getError());
      throw deposit.getError();
    }

    const updatedChannel = await node.getStateChannel({
      channelAddress: depositAddress!,
    });
    if (updatedChannel.isError || !updatedChannel.getValue()) {
      setStatus('Error');
      setError(updatedChannel.getError() ?? new Error('Channel not found'));
      throw updatedChannel.getError() ?? new Error('Channel not found');
    }
    const endingBalance = getBalanceForAssetId(
      updatedChannel.getValue() as FullChannelState,
      recoverTokenAddress,
      'bob'
    );
    setAmount(endingBalance);

    const endingBalanceBn = BigNumber.from(endingBalance);
    if (endingBalanceBn.isZero()) {
      setStatus('Error');
      setError(new Error('No balance found to recover'));
      return;
    }
    console.log(
      `Found ${endingBalanceBn.toString()} of ${assetId}, attempting withdrawal`
    );

    const withdrawRes = await node.withdraw({
      amount: endingBalance,
      assetId,
      channelAddress: depositAddress!,
      recipient: withdrawalAddress,
    });
    if (withdrawRes.isError) {
      setStatus('Error');
      throw withdrawRes.getError();
    }
    console.log('Withdraw successful: ', withdrawRes.getValue());
    setWithdrawalTxHash(withdrawRes.getValue().transactionHash!);
    setStatus('Success');
  };

  const isValidAddress = (input: string): boolean => {
    const valid = input.match(/0x[0-9a-fA-F]{40}/);
    return !!valid;
  };

  return (
    <>
      {status === 'Loading' && <Loading message="Recovery in Progress..." />}
      {status === 'Initial' && (
        <ModalContent id="modalContent">
          <Header
            title="Recover lost funds"
            handleBack={handleBack}
            options={handleOptions}
          />
          <ModalBody>
            <Stack column={true} spacing={5}>
              <Text fontSize="1rem" lineHeight="24px">
                Uh oh! Send the wrong asset to the deposit address? Fill out the
                details below to attempt recovery of your assets from the state
                channels.
              </Text>
              <Box>
                <Stack column={true} spacing={5}>
                  <Stack column={true} spacing={1}>
                    <Stack>
                      <Text
                        fontSize="0.875rem"
                        flex="auto"
                        color="#666666"
                        fontWeight="700"
                      >
                        Token Address
                      </Text>
                      <Text
                        fontSize="0.875rem"
                        color="crimson"
                        fontFamily="Roboto Mono"
                        fontWeight="700"
                      >
                        {recoverTokenAddressError &&
                          'Must be an Ethereum address'}
                      </Text>
                    </Stack>

                    <InputGroup colorScheme="white" borderRadius="15px">
                      <Input
                        id="tokenAddress"
                        name="Token Address"
                        type="search"
                        body="lg"
                        placeholder="0x..."
                        // styling
                        value={recoverTokenAddress}
                        onChange={(event) => {
                          setRecoverTokenAddress(event.target.value);
                          setRecoverTokenAddressError(
                            !isValidAddress(event.target.value)
                          );
                        }}
                      />
                    </InputGroup>
                  </Stack>

                  <Stack column={true} spacing={1}>
                    <Stack>
                      <Text
                        fontSize="0.875rem"
                        flex="auto"
                        color="#666666"
                        fontWeight="700"
                      >
                        Withdrawal Address
                      </Text>
                      <Text
                        fontSize="0.875rem"
                        color="crimson"
                        fontFamily="Roboto Mono"
                        fontWeight="700"
                      >
                        {recoverWithdrawalAddressError &&
                          'Must be an Ethereum address'}
                      </Text>
                    </Stack>

                    <InputGroup colorScheme="white" borderRadius="15px">
                      <Input
                        id="withdrawalAddress"
                        name="Withdrawal Address"
                        type="search"
                        body="lg"
                        // styling
                        placeholder="0x..."
                        onChange={(event) => {
                          setRecoverWithdrawalAddress(event.target.value);
                          setRecoverWithdrawalAddressError(
                            !isValidAddress(event.target.value)
                          );
                        }}
                        value={recoverWithdrawalAddress}
                      />
                    </InputGroup>
                  </Stack>

                  <Button
                    size="lg"
                    type="submit"
                    disabled={
                      recoverWithdrawalAddressError ||
                      recoverTokenAddressError ||
                      !recoverTokenAddress ||
                      !recoverWithdrawalAddress
                        ? true
                        : false
                    }
                    onClick={() =>
                      recover(recoverTokenAddress, recoverWithdrawalAddress)
                    }
                  >
                    Recover
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </ModalBody>

          <Footer />
        </ModalContent>
      )}
      {status === 'Success' && (
        <Success
          amount={amount!}
          transactionId={withdrawalTxHash!}
          receiverChainInfo={senderChainInfo}
          receiverAddress={recoverWithdrawalAddress}
          onClose={handleCloseButton}
          options={handleOptions}
        />
      )}
      {status === 'Error' && (
        <ErrorScreen
          error={error ?? new Error('unknown')}
          title="Recovery Error"
          state={ERROR_STATES.ERROR_TRANSFER}
          receiverChainInfo={senderChainInfo}
          receiverAddress={recoverWithdrawalAddress}
          options={handleOptions}
          handleBack={handleBack}
        />
      )}
    </>
  );
};

export default Recover;

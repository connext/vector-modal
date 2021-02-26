import React, { FC, useState } from 'react';
import {
  ModalContent,
  ModalBody,
  Button,
  Text,
  Stack,
  Box,
  InputGroup,
  Input,
} from '@chakra-ui/react';
import { BigNumber, constants } from 'ethers';
import { FullChannelState } from '@connext/vector-types';
import { getBalanceForAssetId } from '@connext/vector-utils';
import { BrowserNode } from '@connext/vector-browser-node';
import { Header, Footer } from './static';
import { Success, ErrorScreen } from './pages';
import { styleModalContent, CHAIN_DETAIL, ERROR_STATES } from '../constants';
import { graphic } from '../public';

export interface RecoveryProps {
  handleBack: () => void;
  handleCloseButton: () => void;
  handleOptions: () => void;
  senderChainInfo: CHAIN_DETAIL;
  node: BrowserNode;
  depositAddress?: string;
}

const Recover: FC<RecoveryProps> = props => {
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
      {['Initial', 'Loading'].includes(status as any) && (
        <ModalContent
          className="global-style"
          id="modalContent"
          style={{
            ...styleModalContent,
            backgroundImage: `url(${graphic})`,
          }}
        >
          <Header
            title="Recover lost funds"
            handleBack={handleBack}
            options={handleOptions}
          />
          <ModalBody>
            <Stack direction="column" spacing={5}>
              <Text fontSize="s" lineHeight="24px">
                Uh oh! Send the wrong asset to the deposit address? Fill out the
                details below to attempt recovery of your assets from the state
                channels.
              </Text>
              <Box>
                <Stack direction="column" spacing={5}>
                  <Box>
                    <Box display="flex">
                      <Text
                        fontSize="14px"
                        casing="capitalize"
                        flex="auto"
                        color="#666666"
                        fontWeight="700"
                      >
                        Token Address
                      </Text>
                      <Text
                        fontSize="sm"
                        casing="capitalize"
                        color="crimson"
                        fontFamily="Roboto Mono"
                        fontWeight="700"
                      >
                        {recoverTokenAddressError &&
                          'Must be an Ethereum address'}
                      </Text>
                    </Box>
                    <Box
                      bg="white"
                      w="100%"
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      borderRadius="15px"
                      fontFamily="Roboto Mono"
                    >
                      <InputGroup>
                        <Input
                          id="tokenAddress"
                          name="Token Address"
                          type="search"
                          size="lg"
                          placeholder="0x..."
                          // styling
                          boxShadow="none!important"
                          border="none"
                          value={recoverTokenAddress}
                          onChange={event => {
                            setRecoverTokenAddress(event.target.value);
                            setRecoverTokenAddressError(
                              !isValidAddress(event.target.value)
                            );
                          }}
                        />
                      </InputGroup>
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex">
                      <Text
                        fontSize="14px"
                        casing="capitalize"
                        flex="auto"
                        color="#666666"
                        fontWeight="700"
                      >
                        Withdrawal Address
                      </Text>
                      <Text
                        fontSize="sm"
                        casing="capitalize"
                        color="crimson"
                        fontFamily="Roboto Mono"
                        fontWeight="700"
                      >
                        {recoverWithdrawalAddressError &&
                          'Must be an Ethereum address'}
                      </Text>
                    </Box>
                    <Box
                      bg="white"
                      w="100%"
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      borderRadius="15px"
                      fontFamily="Roboto Mono"
                    >
                      <InputGroup>
                        <Input
                          id="withdrawalAddress"
                          name="Withdrawal Address"
                          type="search"
                          size="lg"
                          // styling
                          boxShadow="none!important"
                          border="none"
                          placeholder="0x..."
                          onChange={event => {
                            setRecoverWithdrawalAddress(event.target.value);
                            setRecoverWithdrawalAddressError(
                              !isValidAddress(event.target.value)
                            );
                          }}
                          value={recoverWithdrawalAddress}
                        />
                      </InputGroup>
                    </Box>
                  </Box>

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
                    isLoading={status === 'Loading' ? true : false}
                    loadingText="Recovering"
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
          state={ERROR_STATES.ERROR_TRANSFER}
          crossChainTransferId={constants.HashZero}
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

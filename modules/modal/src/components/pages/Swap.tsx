import React, { FC, useEffect } from 'react';
import { BigNumber, utils } from 'ethers';
import { CHAIN_DETAIL, truncate } from '@connext/vector-sdk';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Button,
  InputGroup,
  Input,
} from '../common';
import { Header, Footer, NetworkBar } from '../static';

export interface TransferProps {
  onUserInput: (
    _input: string | undefined,
    receiveExactAmount: boolean
  ) => void;
  swapRequest: () => void;
  options: () => void;
  isLoad: boolean;
  inputReadOnly: boolean;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  senderAmount: string | undefined;
  recipientAmount: string | undefined;
  feeQuote: string;
  existingChannelBalanceBn?: BigNumber;
  amountError?: string;
  userBalance?: string;
}

const Swap: FC<TransferProps> = (props) => {
  const {
    amountError,
    userBalance,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    senderAmount,
    recipientAmount,
    existingChannelBalanceBn,
    feeQuote,
    isLoad,
    inputReadOnly,
    onUserInput,
    swapRequest,
    options,
  } = props;

  function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

  const enforcer = (currentInput: string, receiveExactAmount: boolean) => {
    if (currentInput === '' || inputRegex.test(escapeRegExp(currentInput))) {
      onUserInput(currentInput, receiveExactAmount);
    }
  };

  const handleSubmit = () => {
    if (senderAmount) {
      swapRequest();
    }
  };

  useEffect(() => {
    const effect = async () => {
      if (senderAmount) {
        enforcer(senderAmount, false);
      }
    };
    effect();
  }, []);

  return (
    <>
      <ModalContent id="modalContent">
        <Header title="Send Amount" options={options} />
        <ModalBody>
          <Stack column={true} spacing={5}>
            <Stack column={true} spacing={4}>
              <Stack column={true} spacing={5}>
                {existingChannelBalanceBn && (
                  <Text
                    flex="auto"
                    fontSize="0.875rem"
                    fontStyle="italic"
                    textTransform="none"
                    color="#333333"
                  >
                    You are adding more funds for Swap, your existing channel
                    currently holds{' '}
                    {truncate(
                      utils.formatUnits(
                        existingChannelBalanceBn!,
                        senderChainInfo?.assetDecimals!
                      ),
                      4
                    )}{' '}
                    {senderChainInfo.assetName}
                  </Text>
                )}
                <Stack column={true} spacing={1}>
                  <Stack>
                    <Text flex="auto" fontSize="0.75rem">
                      You send
                    </Text>
                    {userBalance && (
                      <Text
                        fontSize="0.75rem"
                        fontFamily="Roboto Mono"
                        textTransform="uppercase"
                        textAlign="end"
                        color="#757575"
                      >
                        Balance: {truncate(userBalance, 4)}{' '}
                        {senderChainInfo.assetName}
                      </Text>
                    )}
                  </Stack>
                  <Stack
                    colorScheme="white"
                    alignItems="center"
                    borderRadius="5px"
                  >
                    <InputGroup flex="auto" colorScheme="white">
                      <Input
                        body="lg"
                        title="Token Amount"
                        aria-describedby="amount"
                        // styling
                        fontSize="1rem"
                        // universal input options
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        // text-specific options
                        type="text"
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        placeholder={'0.0'}
                        minLength={1}
                        maxLength={79}
                        spellCheck="false"
                        // value
                        value={senderAmount}
                        onChange={(event) => {
                          enforcer(
                            event.target.value.replace(/,/g, '.'),
                            false
                          );
                        }}
                        readOnly={inputReadOnly ? true : false}
                      />
                    </InputGroup>

                    {userBalance && (
                      <Button
                        size="xs"
                        colorScheme="#DEDEDE"
                        color="#737373"
                        borderRadius="5px"
                        border="none"
                        borderStyle="none"
                        casing="uppercase"
                        marginRight="10px!important"
                        height="1.5rem"
                        disabled={inputReadOnly ? true : false}
                        onClick={() => {
                          enforcer(userBalance, false);
                        }}
                      >
                        max
                      </Button>
                    )}

                    <Text
                      margin="0 10px 0 0"
                      fontFamily="Roboto Mono"
                      textTransform="uppercase"
                      fontSize="1rem"
                      color="#333333"
                    >
                      {senderChainInfo.assetName}
                    </Text>
                  </Stack>
                </Stack>

                <Stack>
                  <Text
                    fontSize="0.875rem"
                    fontWeight="700"
                    flex="auto"
                    color="#666666"
                  >
                    Estimated Fees:
                  </Text>
                  <Text
                    fontSize="0.875rem"
                    fontFamily="Roboto Mono"
                    color="#666666"
                    fontWeight="700"
                  >
                    {truncate(feeQuote, 4)} {senderChainInfo.assetName}
                  </Text>
                </Stack>

                <Stack column={true} spacing={1}>
                  <Text fontSize="0.75rem">Recipient gets</Text>
                  <Stack
                    colorScheme="white"
                    alignItems="center"
                    borderRadius="5px"
                  >
                    <InputGroup flex="auto" colorScheme="white">
                      <Input
                        body="lg"
                        title="Token Amount"
                        aria-describedby="amount"
                        // styling
                        fontSize="1rem"
                        // universal input options
                        inputMode="decimal"
                        autoComplete="off"
                        autoCorrect="off"
                        // text-specific options
                        type="text"
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        placeholder={'0.0'}
                        minLength={1}
                        maxLength={79}
                        spellCheck="false"
                        // value
                        value={recipientAmount}
                        onChange={(event) => {
                          enforcer(event.target.value.replace(/,/g, '.'), true);
                        }}
                        readOnly={inputReadOnly ? true : false}
                      />
                    </InputGroup>
                    <Text
                      margin="0 10px 0 0"
                      fontFamily="Roboto Mono"
                      textTransform="uppercase"
                      fontSize="1rem"
                      color="#333333"
                    >
                      {receiverChainInfo.assetName}
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
              {!!amountError && (
                <Text
                  flex="auto"
                  fontSize="0.75rem"
                  textAlign="center"
                  color="crimson"
                >
                  {amountError}
                </Text>
              )}

              <Button
                size="lg"
                type="submit"
                disabled={
                  !!amountError || !senderAmount || isLoad ? true : false
                }
                onClick={handleSubmit}
              >
                {isLoad
                  ? 'Waiting For Transaction'
                  : userBalance
                  ? 'Swap'
                  : 'Show me QR!'}
              </Button>
            </Stack>

            <NetworkBar
              senderChainInfo={senderChainInfo}
              receiverChainInfo={receiverChainInfo}
              receiverAddress={receiverAddress}
            />
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default Swap;

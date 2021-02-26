import React, { FC, useEffect, useState } from 'react';
import {
  ModalContent,
  ModalBody,
  Button,
  Text,
  Stack,
  Box,
  NumberInputField,
  NumberInput,
} from '@chakra-ui/react';
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, CHAIN_DETAIL } from '../../constants';
import { graphic } from '../../public';

export interface TransferProps {
  onUserInput: (
    _input: string | undefined
  ) => {
    isError: boolean;
    result: {
      quoteFee: string | undefined;
      quoteAmount: string | undefined;
      error: string | undefined;
    };
  };
  swapRequest: () => void;
  options: () => void;
  isLoad: Boolean;
  inputReadOnly: Boolean;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  transferAmount: string | undefined;
  amountError?: string;
  userBalance?: string;
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

const Swap: FC<TransferProps> = props => {
  const {
    amountError,
    userBalance,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    transferAmount,
    isLoad,
    inputReadOnly,
    onUserInput,
    swapRequest,
    options,
  } = props;

  const [feeQuote, setFeeQuote] = useState<string | undefined>('———');
  const [quoteAmount, setQuoteAmount] = useState<string | undefined>('———');

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      const res = onUserInput(nextUserInput);
      if (res.isError) {
        setFeeQuote('———');
        setQuoteAmount('———');
        return;
      }
      setFeeQuote(res.result.quoteFee);
      setQuoteAmount(res.result.quoteAmount);
    }
  };

  const handleSubmit = () => {
    if (transferAmount) {
      swapRequest();
    }
  };

  useEffect(() => {
    const effect = async () => {
      if (transferAmount) {
        enforcer(transferAmount);
      }
    };
    effect();
  });

  return (
    <>
      <ModalContent
        className="global-style"
        id="modalContent"
        style={{
          ...styleModalContent,
          backgroundImage: `url(${graphic})`,
        }}
      >
        <Header title="Send Amount" options={options} />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={5}>
              <Stack direction="column" spacing={1}>
                <Box display="flex">
                  <Text
                    flex="auto"
                    fontSize="xs"
                    casing="capitalize"
                    color={!!amountError ? 'crimson' : 'green.[500]'}
                  >
                    {!!amountError
                      ? amountError
                      : `From ${senderChainInfo.name}`}
                  </Text>
                  {userBalance && (
                    <Text
                      fontSize="xs"
                      casing="uppercase"
                      textAlign="end"
                      fontFamily="Roboto Mono"
                      color="#757575"
                    >
                      Bal: {userBalance} {senderChainInfo.assetName}
                    </Text>
                  )}
                </Box>
                <Box
                  bg="white"
                  w="100%"
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  borderRadius="15px"
                >
                  <NumberInput
                    size="lg"
                    flex="auto"
                    title="Token Amount"
                    aria-describedby="amount"
                    //styling
                    fontFamily="Roboto Mono"
                    fontStyle="normal"
                    lineHeight="20px"
                    fontSize="1rem"
                    fontWeight="500"
                    // universal input options
                    inputMode="decimal"
                    value={transferAmount}
                    isReadOnly={inputReadOnly ? true : false}
                  >
                    <NumberInputField
                      // styling
                      boxShadow="none!important"
                      border="none"
                      onChange={event => {
                        // replace commas with periods, because uniswap exclusively uses period as the decimal separator
                        enforcer(event.target.value.replace(/,/g, '.'));
                      }}
                    />
                  </NumberInput>

                  {userBalance && (
                    <Button
                      size="sm"
                      bg="#DEDEDE"
                      color="#737373"
                      borderRadius="5px"
                      border="none"
                      casing="uppercase"
                      marginRight="10px"
                      height="1.5rem"
                      isDisabled={inputReadOnly ? true : false}
                      onClick={() => {
                        enforcer(userBalance);
                      }}
                    >
                      max
                    </Button>
                  )}
                </Box>
              </Stack>

              <Stack direction="column" spacing={2}>
                <Box display="flex">
                  <Text
                    fontSize="xs"
                    casing="capitalize"
                    flex="auto"
                    color="#666666"
                  >
                    Estimated Fees:
                  </Text>
                  <Text
                    fontSize="xs"
                    casing="capitalize"
                    fontFamily="Roboto Mono"
                    color="#666666"
                  >
                    {feeQuote} {senderChainInfo.assetName}
                  </Text>
                </Box>

                <Box display="flex">
                  <Text
                    fontSize="14px"
                    casing="capitalize"
                    flex="auto"
                    color="#666666"
                    fontWeight="700"
                  >
                    You will receive:
                  </Text>
                  <Text
                    fontSize="14px"
                    casing="capitalize"
                    color="#666666"
                    fontFamily="Roboto Mono"
                    fontWeight="700"
                  >
                    {quoteAmount} {senderChainInfo.assetName}
                  </Text>
                </Box>
              </Stack>

              <Button
                size="lg"
                type="submit"
                isLoading={isLoad ? true : false}
                loadingText="Waiting For Transaction"
                isDisabled={!!amountError || !transferAmount ? true : false}
                onClick={handleSubmit}
              >
                {userBalance ? 'Swap' : 'Show me QR!'}
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

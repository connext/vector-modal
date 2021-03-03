import React, { FC, useEffect } from 'react';
import CSS from 'csstype';
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
import { CHAIN_DETAIL } from '../../constants';
import { graphic } from '../../public';

export interface TransferProps {
  onUserInput: (_input: string | undefined) => void;
  swapRequest: () => void;
  options: () => void;
  isLoad: Boolean;
  inputReadOnly: Boolean;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  transferAmount: string | undefined;
  feeQuote: string;
  quoteAmount: string | undefined;
  amountError?: string;
  userBalance?: string;
}
const styleModalContent: CSS.Properties = {
  backgroundImage: `url(${graphic})`,
};

const Swap: FC<TransferProps> = props => {
  const {
    amountError,
    userBalance,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    transferAmount,
    feeQuote,
    quoteAmount,
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

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput);
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
      <ModalContent id="modalContent" style={styleModalContent}>
        <Header title="Send Amount" options={options} />
        <ModalBody>
          <Stack column={true} spacing={5}>
            <Stack column={true} spacing={4}>
              <Stack column={true} spacing={1}>
                <Stack>
                  <Text
                    flex="auto"
                    fontSize="0.75rem"
                    color={!!amountError ? 'crimson' : 'black'}
                  >
                    {!!amountError
                      ? amountError
                      : `From ${senderChainInfo.name}`}
                  </Text>
                  {userBalance && (
                    <Text
                      fontSize="0.75rem"
                      fontFamily="Roboto Mono"
                      textTransform="uppercase"
                      textAlign="end"
                      color="#757575"
                    >
                      Bal: {userBalance} {senderChainInfo.assetName}
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
                      value={transferAmount}
                      onChange={event => {
                        enforcer(event.target.value.replace(/,/g, '.'));
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
                        enforcer(userBalance);
                      }}
                    >
                      max
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Stack column={true} spacing={2}>
                <Stack>
                  <Text fontSize="0.75rem" flex="auto" color="#666666">
                    Estimated Fees:
                  </Text>
                  <Text
                    fontSize="0.75rem"
                    fontFamily="Roboto Mono"
                    color="#666666"
                  >
                    {feeQuote} {senderChainInfo.assetName}
                  </Text>
                </Stack>

                <Stack>
                  <Text
                    fontSize="0.875rem"
                    flex="auto"
                    color="#666666"
                    fontWeight="700"
                  >
                    You will receive:
                  </Text>
                  <Text
                    fontSize="0.875rem"
                    color="#666666"
                    fontFamily="Roboto Mono"
                    fontWeight="700"
                  >
                    {quoteAmount} {senderChainInfo.assetName}
                  </Text>
                </Stack>
              </Stack>

              <Button
                size="lg"
                type="submit"
                disabled={
                  !!amountError || !transferAmount || isLoad ? true : false
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

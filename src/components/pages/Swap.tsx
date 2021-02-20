import React, { FC, useEffect } from 'react';
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
import { Header, Footer, NetworkBar } from '../static';
import { styleModalContent, graphic, CHAIN_DETAIL } from '../../constants';

export interface TransferProps {
  onUserInput: (input: string) => void;
  swapRequest: () => void;
  isLoad: Boolean;
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
    onUserInput,
    swapRequest,
  } = props;

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
    if (transferAmount) {
      enforcer(transferAmount);
    }
  });

  return (
    <>
      <ModalContent
        id="modalContent"
        style={{
          ...styleModalContent,
          backgroundImage: `url(${graphic})`,
        }}
      >
        <Header title="Send Amount" backButton={true} moreButton={true} />
        <ModalBody>
          <Stack direction="column" spacing={7}>
            <Stack direction="column" spacing={5}>
              <Box>
                {userBalance && (
                  <Text
                    fontSize="xs"
                    casing="uppercase"
                    textAlign="end"
                    fontFamily="Roboto Mono"
                    color="#757575"
                  >
                    Balance: {userBalance}
                  </Text>
                )}
                <Box
                  bg="white"
                  w="100%"
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  borderRadius="15px"
                >
                  <InputGroup size="lg" flex="auto">
                    <Input
                      label="amount"
                      name="amount"
                      aria-describedby="amount"
                      onChange={event => {
                        // replace commas with periods, because uniswap exclusively uses period as the decimal separator
                        enforcer(event.target.value.replace(/,/g, '.'));
                      }}
                      // styling
                      fontFamily="Roboto Mono"
                      boxShadow="none!important"
                      border="none"
                      // universal input options
                      inputMode="decimal"
                      title="Token Amount"
                      autoComplete="off"
                      autoCorrect="off"
                      // text-specific options
                      type="text"
                      pattern="^[0-9]*[.,]?[0-9]*$"
                      value={transferAmount}
                      minLength={1}
                      maxLength={79}
                      spellCheck="false"
                    />
                  </InputGroup>

                  {userBalance && (
                    <Button
                      size="sm"
                      bg="#DEDEDE"
                      color="#737373"
                      borderRadius="5px"
                      border="none"
                      marginRight="10px"
                      height="1.5rem"
                      onClick={() => {
                        enforcer(userBalance);
                      }}
                    >
                      max
                    </Button>
                  )}
                </Box>
                <Text
                  fontSize="xs"
                  casing="capitalize"
                  color={!!amountError ? 'crimson' : 'green.[500]'}
                >
                  {!!amountError ? amountError : `From ${senderChainInfo.name}`}
                </Text>
              </Box>

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
                    0.0 {senderChainInfo.assetName}
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
                    0.0 {senderChainInfo.assetName}
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

import React, { FC, useEffect, useState } from 'react';
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
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
  amountError?: string;
  userBalance?: string;
  transferAmount?: string;
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group

const Swap: FC<TransferProps> = props => {
  const [isload, setIsLoad] = useState<Boolean>(false);

  const {
    amountError,
    userBalance,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
    transferAmount,
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
      setIsLoad(true);
      swapRequest();
    }
  };

  useEffect(() => {
    setIsLoad(false);
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
                  <Text fontSize="xs" casing="uppercase" textAlign="end">
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
                      value={transferAmount ?? '0'}
                      minLength={1}
                      maxLength={79}
                      spellCheck="false"
                    />
                  </InputGroup>

                  {userBalance && (
                    <Button
                      size="sm"
                      bg="#DEDEDE"
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
                  casing="uppercase"
                  color={!!amountError ? 'crimson' : 'green.[500]'}
                >
                  {!!amountError ? amountError : `From ${senderChainInfo.name}`}
                </Text>
              </Box>

              <Stack direction="column" spacing={2}>
                <Box display="flex">
                  <Text fontSize="xs" casing="uppercase" flex="auto">
                    Estimated Fees:
                  </Text>
                  <Text fontSize="xs" casing="uppercase">
                    0.0
                  </Text>
                </Box>

                <Box display="flex">
                  <Text fontSize="xs" casing="uppercase" flex="auto">
                    You will receive:
                  </Text>
                  <Text fontSize="xs" casing="uppercase">
                    0.0
                  </Text>
                </Box>
              </Stack>

              <Button
                size="lg"
                type="submit"
                isLoading={isload ? true : false}
                loadingText="Waiting For Transaction"
                isDisabled={!!amountError ? true : false}
                onClick={handleSubmit}
              >
                Swap
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

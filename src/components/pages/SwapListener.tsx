import React, { FC, useState } from 'react';
import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  Box,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { Copy, Check } from 'react-feather';
import { Header, Footer, NetworkBar } from '../static';
import { CHAIN_DETAIL, styleModalContent, darkGraphic } from '../../constants';
// @ts-ignore
import QRCode from 'qrcode.react';

interface SwapListenerProps {
  senderChannelAddress: string;
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress: string;
}

const SwapListener: FC<SwapListenerProps> = props => {
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const {
    senderChannelAddress,
    senderChainInfo,
    receiverChainInfo,
    receiverAddress,
  } = props;

  return (
    <>
      <ModalContent
        id="modalContent"
        style={{
          ...styleModalContent,
          backgroundPosition: 'right top',
          backgroundImage: `url(${darkGraphic})`,
        }}
      >
        <Header
          title="Ready for transfer"
          backButton={true}
          moreButton={true}
        />
        <ModalBody>
          <Stack direction="column" spacing={5}>
            <Stack direction="column" spacing={3}>
              <Box>
                <Stack direction="row" spacing={8}>
                  <Stack direction="column" spacing={2}>
                    <Text fontSize="xs" casing="uppercase">
                      {`Send ${senderChainInfo.assetName} on ${senderChainInfo.name} to the QR or address below.`}
                    </Text>
                    <Text fontSize="xs" casing="uppercase">
                      Awaiting your transfer...
                    </Text>
                  </Stack>
                  <Box bg="white" borderRadius="15px">
                    <QRCode
                      value={senderChannelAddress}
                      size={150}
                      style={{ padding: '0.5rem' }}
                    />
                  </Box>
                </Stack>
              </Box>

              <InputGroup
                size="md"
                bg="#DEDEDE"
                alignItems="center"
                borderRadius="15px"
              >
                <Input
                  id="address"
                  name="address"
                  value={senderChannelAddress}
                  inputMode="search"
                  title="Deposit Address"
                  // styling
                  boxShadow="none!important"
                  border="none"
                  flex="auto"
                  // misc
                  isReadOnly={true}
                />
                <InputRightElement
                  children={
                    <IconButton
                      aria-label="Clipboard"
                      onClick={() => {
                        console.log(`Copying: ${senderChannelAddress}`);
                        navigator.clipboard.writeText(senderChannelAddress);
                        setCopiedAddress(true);
                        setTimeout(() => setCopiedAddress(false), 5000);
                      }}
                      icon={!copiedAddress ? <Copy /> : <Check />}
                      // style
                      size="sm"
                      border="none"
                      background="transparent"
                    />
                  }
                />
              </InputGroup>
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

export default SwapListener;

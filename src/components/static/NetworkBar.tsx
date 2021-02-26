import React, { FC } from 'react';
import {
  Stack,
  Text,
  Box,
  Divider,
  Input,
  Link,
  InputGroup,
} from '@chakra-ui/react';
import { CHAIN_DETAIL } from '../../constants';
import { arrow } from '../../public';
import { getExplorerLinkForAsset } from '../../utils';

interface NetworkBarProps {
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress?: string;
}
const NetworkBar: FC<NetworkBarProps> = props => {
  const { senderChainInfo, receiverChainInfo, receiverAddress } = props;
  return (
    <>
      <Divider
        orientation="horizontal"
        style={{ border: '0.25px solid #666666' }}
      />
      <Stack direction="column" spacing={5}>
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Text
              fontSize="xs"
              casing="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              style={{
                lineHeight: '18px',
                letterSpacing: '0.05em',
                color: '#26B1D6',
              }}
            >
              {senderChainInfo.name}
            </Text>
            <Text
              fontSize="xl"
              casing="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              style={{
                lineHeight: '30px',
                letterSpacing: '0.05em',
              }}
            >
              <Link
                href={getExplorerLinkForAsset(
                  senderChainInfo.chainId,
                  senderChainInfo.assetId
                )}
                isExternal
              >
                {senderChainInfo.assetName}
              </Link>
            </Text>
          </Box>
          <img src={arrow} />
          <Box>
            <Text
              fontSize="xs"
              casing="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              style={{
                lineHeight: '18px',
                letterSpacing: '0.05em',
                color: '#2964C5',
              }}
            >
              {receiverChainInfo.name}
            </Text>{' '}
            <Link
              href={getExplorerLinkForAsset(
                receiverChainInfo.chainId,
                receiverChainInfo.assetId
              )}
              isExternal
            >
              <Text
                fontSize="xl"
                casing="uppercase"
                fontFamily="Cooper Hewitt"
                fontWeight="700"
                style={{
                  lineHeight: '30px',
                  letterSpacing: '0.05em',
                }}
              >
                {receiverChainInfo.assetName}
              </Text>
            </Link>
          </Box>
        </Box>

        {receiverAddress && (
          <Stack direction="column" spacing={1}>
            <Text
              fontWeight="400"
              fontSize="12px"
              casing="capitalize"
              color="#666666"
            >
              Receiver Address
            </Text>
            <InputGroup
              size="md"
              bg="#DEDEDE"
              alignItems="center"
              borderRadius="5px"
              fontFamily="Roboto Mono"
              fontStyle="normal"
              lineHeight="20px"
              fontWeight="500"
            >
              <Input
                id="address"
                name="address"
                value={receiverAddress}
                inputMode="search"
                title="receiver Address"
                // styling
                fontSize="13px"
                border="none"
                flex="auto"
                // misc
                isReadOnly={true}
              />
            </InputGroup>
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default NetworkBar;

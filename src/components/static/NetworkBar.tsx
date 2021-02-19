import React, { FC } from 'react';
import { Stack, Text, Box, Divider, Input, Link } from '@chakra-ui/react';
import { arrow, CHAIN_DETAIL } from '../../constants';
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
            <Text fontSize="xs" casing="uppercase">
              {senderChainInfo.name}
            </Text>
            <Text fontSize="xs" casing="uppercase">
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
            <Text fontSize="xs" casing="uppercase">
              {receiverChainInfo.name}
            </Text>{' '}
            <Text fontSize="xs" casing="uppercase">
              <Link
                href={getExplorerLinkForAsset(
                  receiverChainInfo.chainId,
                  receiverChainInfo.assetId
                )}
                isExternal
              >
                {receiverChainInfo.assetName}
              </Link>
            </Text>
          </Box>
        </Box>

        {receiverAddress && (
          <Box display="flex" flexDirection="column">
            <Text fontSize="xs" casing="uppercase">
              Receiver Address
            </Text>
            <Box
              bg="#DEDEDE"
              w="100%"
              display="flex"
              flexDirection="row"
              alignItems="center"
              borderRadius="15px"
            >
              <Input
                id="address"
                name="address"
                placeholder={receiverAddress}
                inputMode="search"
                title="Receiver Address"
                // styling
                boxShadow="none!important"
                border="none"
                size="lg"
                flex="auto"
                // misc
                isReadOnly={true}
              />
            </Box>
          </Box>
        )}
      </Stack>
    </>
  );
};

export default NetworkBar;

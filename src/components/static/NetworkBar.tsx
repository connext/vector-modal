import React, { FC } from 'react';
import { Input, Link, InputGroup } from '@chakra-ui/react';
import styled from 'styled-components';

import { CHAIN_DETAIL } from '../../constants';
import { arrow } from '../../public';
import { getExplorerLinkForAsset } from '../../utils';
import { Stack, Box, Text } from './Theme';

interface NetworkBarProps {
  senderChainInfo: CHAIN_DETAIL;
  receiverChainInfo: CHAIN_DETAIL;
  receiverAddress?: string;
}
const NetworkBar: FC<NetworkBarProps> = props => {
  const { senderChainInfo, receiverChainInfo, receiverAddress } = props;
  return (
    <>
      <Divider />
      <Stack column={true}>
        <Stack justifyContent="space-between">
          <Box>
            <Text
              fontSize="0.75rem"
              textTransform="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              lineHeight="18px"
              letterSpacing="0.05em"
              color="#2964C5"
            >
              {senderChainInfo.name}
            </Text>
            <Text
              fontSize="1.25rem"
              textTransform="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              lineHeight="30px"
              letterSpacing="0.05em"
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
              fontSize="0.75rem"
              textTransform="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              lineHeight="18px"
              letterSpacing="0.05em"
              color="#2964C5"
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
                fontSize="1.25rem"
                textTransform="uppercase"
                fontFamily="Cooper Hewitt"
                fontWeight="700"
                lineHeight="30px"
                letterSpacing="0.05em"
              >
                {receiverChainInfo.assetName}
              </Text>
            </Link>
          </Box>
        </Stack>

        {receiverAddress && (
          <Stack column={true} spacing={1}>
            <Text
              fontWeight="400"
              fontSize="12px"
              textTransform="capitalize"
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

const Divider = styled.hr`
  border: 0.25px solid rgb(102, 102, 102);
  margin-inline-start: 0px;
  box-sizing: content-box;
  height: 0px;
  overflow: visible;
  width: 100%;
  opacity: 0.6;
`;

import React, { FC } from "react";
import { CHAIN_DETAIL, getExplorerLinkForAsset } from "@connext/vector-sdk";
import styled from "styled-components";
import { Stack, Box, Text, Link, InputGroup, Input } from "../common";

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
      <Stack column={true} spacing={4}>
        <Stack justifyContent="space-between">
          <Box>
            <Text
              fontSize="0.75rem"
              textTransform="uppercase"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              lineHeight="18px"
              letterSpacing="0.05em"
              color="#26B1D6"
            >
              {senderChainInfo.name}
            </Text>
            <Link href={getExplorerLinkForAsset(senderChainInfo.chainId, senderChainInfo.assetId)} target="_blank">
              <Text
                fontSize="1.25rem"
                textTransform="uppercase"
                fontFamily="Cooper Hewitt"
                fontWeight="700"
                lineHeight="30px"
                letterSpacing="0.05em"
              >
                {senderChainInfo.assetName}
              </Text>
            </Link>
          </Box>
          <img src="https://cdn.connext.network/network_arrow.svg" alt="arrow" width="32" />
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
            </Text>{" "}
            <Link href={getExplorerLinkForAsset(receiverChainInfo.chainId, receiverChainInfo.assetId)} target="_blank">
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
            <Text fontWeight="400" fontSize="12px" textTransform="capitalize" color="#666666">
              Receiver Address
            </Text>
            <InputGroup>
              <Input
                id="address"
                name="address"
                value={receiverAddress}
                inputMode="search"
                title="receiver Address"
                // styled
                body="md"
                fontSize="13px"
                // misc
                readOnly={true}
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

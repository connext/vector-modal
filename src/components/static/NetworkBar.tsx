import React, { FC } from 'react';
import { Stack, Text, Box, Divider, Input } from '@chakra-ui/react';
import { arrow } from '../../constants';
interface NetworkBarProps {
  fromNetwork: string;
  fromNetworkAsset: string;
  toNetwork: string;
  toNetworkAsset: string;
  receiverAddress?: string;
}
const NetworkBar: FC<NetworkBarProps> = props => {
  const {
    fromNetwork,
    fromNetworkAsset,
    toNetwork,
    toNetworkAsset,
    receiverAddress,
  } = props;
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
              {fromNetwork}
            </Text>
            <Text fontSize="xs" casing="uppercase">
              {fromNetworkAsset}
            </Text>
          </Box>
          <img src={arrow} />
          <Box>
            <Text fontSize="xs" casing="uppercase">
              {toNetwork}
            </Text>{' '}
            <Text fontSize="xs" casing="uppercase">
              {toNetworkAsset}
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

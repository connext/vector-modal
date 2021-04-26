import React, { FC, useState, useEffect } from "react";
import { AddressZero } from "@ethersproject/constants";
import { isValidAddress } from "@connext/vector-sdk";

import { ModalContent, ModalBody, Text, Stack, Box, Button, InputGroup, Input } from "../common";
import { Header, Footer } from "../static";
export interface RecoveryProps {
  recover: (assetId: string, recipientAddress: string) => void;
  handleBack: () => void;
  handleOptions: () => void;
  tokenAddress?: string;
  userAddress?: string;
}

const Recover: FC<RecoveryProps> = props => {
  const { recover, handleBack, handleOptions, userAddress, tokenAddress } = props;

  const [recoverTokenAddress, setRecoverTokenAddress] = useState(tokenAddress ?? AddressZero);
  const [recoverTokenAddressError, setRecoverTokenAddressError] = useState(false);
  const [recoverWithdrawalAddress, setRecoverWithdrawalAddress] = useState("");
  const [recoverWithdrawalAddressError, setRecoverWithdrawalAddressError] = useState(false);

  useEffect(() => {
    if (userAddress) setRecoverWithdrawalAddress(userAddress);
  }, [userAddress]);

  return (
    <>
      <ModalContent id="modalContent">
        <Header title="Recover lost funds" handleBack={handleBack} options={handleOptions} />
        <ModalBody>
          <Stack column={true} spacing={5}>
            <Text fontSize="1rem" lineHeight="24px">
              Uh oh! Fill out the details below to attempt recovery of your assets from the state channels.
            </Text>
            <Box>
              <Stack column={true} spacing={5}>
                <Stack column={true} spacing={1}>
                  <Stack>
                    <Text fontSize="0.875rem" flex="auto" color="#666666" fontWeight="700">
                      Token Address
                    </Text>
                    <Text fontSize="0.875rem" color="crimson" fontFamily="Roboto Mono" fontWeight="700">
                      {recoverTokenAddressError && "Must be an Ethereum address"}
                    </Text>
                  </Stack>

                  <InputGroup colorScheme="white" borderRadius="15px">
                    <Input
                      id="tokenAddress"
                      name="Token Address"
                      type="search"
                      body="lg"
                      placeholder="0x..."
                      // styling
                      value={recoverTokenAddress}
                      onChange={event => {
                        setRecoverTokenAddress(event.target.value);
                        setRecoverTokenAddressError(!isValidAddress(event.target.value));
                      }}
                    />
                  </InputGroup>
                </Stack>

                <Stack column={true} spacing={1}>
                  <Stack>
                    <Text fontSize="0.875rem" flex="auto" color="#666666" fontWeight="700">
                      Withdrawal Address
                    </Text>
                    <Text fontSize="0.875rem" color="crimson" fontFamily="Roboto Mono" fontWeight="700">
                      {recoverWithdrawalAddressError && "Must be an Ethereum address"}
                    </Text>
                  </Stack>

                  <InputGroup colorScheme="white" borderRadius="15px">
                    <Input
                      id="withdrawalAddress"
                      name="Withdrawal Address"
                      type="search"
                      body="lg"
                      // styling
                      placeholder="0x..."
                      onChange={event => {
                        setRecoverWithdrawalAddress(event.target.value);
                        setRecoverWithdrawalAddressError(!isValidAddress(event.target.value));
                      }}
                      value={recoverWithdrawalAddress}
                    />
                  </InputGroup>
                </Stack>

                <Button
                  size="lg"
                  type="submit"
                  disabled={
                    recoverWithdrawalAddressError ||
                    recoverTokenAddressError ||
                    !recoverTokenAddress ||
                    !recoverWithdrawalAddress
                      ? true
                      : false
                  }
                  onClick={() => {
                    recover(recoverTokenAddress, recoverWithdrawalAddress);
                  }}
                >
                  Recover
                </Button>
              </Stack>
            </Box>
          </Stack>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default Recover;

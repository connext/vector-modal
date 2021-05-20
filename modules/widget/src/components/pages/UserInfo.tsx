import React, { FC, useState } from "react";
import { ConnextSdk } from "@connext/vector-sdk";

import {
  ModalContent,
  ModalBody,
  Text,
  Stack,
  IconButton,
  IconBox,
  CopyIcon,
  CheckCircleIcon,
  InputGroup,
  Input,
} from "../common";
import { Header, Footer } from "../static";
export interface UserInfoProps {
  connextSdk: ConnextSdk;
  options: () => void;
}

const UserInfo: FC<UserInfoProps> = props => {
  const { options, connextSdk } = props;
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  const info = {
    alice: connextSdk?.senderChainChannel?.aliceIdentifier!,
    bob: connextSdk?.senderChainChannel?.bobIdentifier!,
    senderChain: connextSdk?.senderChain?.name!,
    senderChainChannelAddress: connextSdk.senderChainChannelAddress,
    recipientChain: connextSdk?.recipientChain?.name!,
    recipientChainChannelAddress: connextSdk?.recipientChainChannelAddress,
    senderChannelState: "",
    recipientChannelState: "",
  };
  return (
    <>
      <ModalContent id="modalContent">
        <Header title={"User Info"} options={options} />
        <ModalBody>
          <Stack column={true} spacing={1}>
            <Stack justifyContent="space-between" colorScheme="antiquewhite">
              <Text fontSize="1.25rem" textTransform="capitalize" style={{ alignSelf: "center" }}>
                Share Info with Team
              </Text>
              <IconButton
                aria-label="Clipboard"
                onClick={async () => {
                  const senderChannel = await connextSdk?.browserNode!.getStateChannel({
                    channelAddress: info.senderChainChannelAddress,
                  });

                  const recipientChannel = await connextSdk?.browserNode!.getStateChannel({
                    channelAddress: info.recipientChainChannelAddress,
                  });
                  info.senderChannelState = JSON.stringify(senderChannel?.getValue()) ?? "";
                  info.recipientChannelState = JSON.stringify(recipientChannel?.getValue()) ?? "";

                  const message = JSON.stringify(info);
                  console.log(`Copying: ${message}`);
                  navigator.clipboard.writeText(message);
                  setCopiedMessage(true);
                  setTimeout(() => setCopiedMessage(false), 5000);
                }}
              >
                <IconBox width="1.5rem">{!copiedMessage ? <CopyIcon /> : <CheckCircleIcon />}</IconBox>
              </IconButton>
            </Stack>
            <Stack column={true} spacing={2}>
              <Stack column={true} spacing={1}>
                <Text fontSize="1rem" textTransform="capitalize">
                  Alice
                </Text>
                <InputGroup>
                  <Input
                    id="address"
                    name="address"
                    value={connextSdk?.senderChainChannel?.aliceIdentifier!}
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

              <Stack column={true} spacing={1}>
                <Text fontSize="1rem" textTransform="capitalize">
                  Bob
                </Text>
                <InputGroup>
                  <Input
                    id="address"
                    name="address"
                    value={connextSdk?.senderChainChannel?.bobIdentifier!}
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

              <Stack column={true} spacing={1}>
                <Text fontSize="1rem" textTransform="capitalize">
                  {info.senderChain} Channel Address
                </Text>
                <InputGroup>
                  <Input
                    id="address"
                    name="address"
                    value={connextSdk?.senderChainChannelAddress!}
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

              <Stack column={true} spacing={1}>
                <Text fontSize="1rem" textTransform="capitalize">
                  {info.recipientChain} Channel Address
                </Text>
                <InputGroup>
                  <Input
                    id="address"
                    name="address"
                    value={connextSdk?.recipientChainChannelAddress!}
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
            </Stack>
          </Stack>
        </ModalBody>
        <Footer />
      </ModalContent>
    </>
  );
};

export default UserInfo;

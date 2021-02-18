import React, { FC } from 'react';
import {
  ModalHeader,
  ModalCloseButton,
  IconButton,
  Spinner,
  Stack,
  Text,
  Box,
} from '@chakra-ui/react';
import { MoreVertical } from 'react-feather';
import { ArrowBackIcon, WarningTwoIcon } from '@chakra-ui/icons';
interface HeaderProps {
  title: string;
  subTitle?: React.ReactNode;
  warningIcon?: boolean;
  closeButton?: boolean;
  backButton?: boolean;
  moreButton?: boolean;
  spinner?: boolean;
}

const Header: FC<HeaderProps> = props => {
  const {
    title,
    subTitle,
    warningIcon,
    closeButton,
    backButton,
    moreButton,
    spinner,
  } = props;
  return (
    <>
      <ModalHeader>
        <Box w="100%" display="flex" flexDirection="row">
          <Stack direction="row" spacing={3} alignItems="center" flex="auto">
            {warningIcon && <WarningTwoIcon />}
            {spinner && (
              <Spinner
                thickness="3px"
                speed="0.65s"
                color="blue.500"
                size="lg"
              />
            )}
            <Text fontSize="2xl" casing="uppercase" flex="auto">
              {title}
            </Text>
          </Stack>
          {backButton && (
            <IconButton
              aria-label="back"
              border="none"
              bg="transparent"
              icon={<ArrowBackIcon boxSize={6} />}
            />
          )}
          {moreButton && (
            <IconButton
              aria-label="back"
              border="none"
              bg="transparent"
              icon={<MoreVertical />}
            />
          )}

          {closeButton && <ModalCloseButton />}
        </Box>
        {subTitle && <Box>{subTitle}</Box>}
      </ModalHeader>
    </>
  );
};

export default Header;

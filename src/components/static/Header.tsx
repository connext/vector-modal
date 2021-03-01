import React, { FC } from 'react';
import { ModalHeader, Spinner, Stack, Text, Box } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { success } from '../../public';
interface HeaderProps {
  title: string;
  onClose?: () => void;
  options?: () => void;
  handleBack?: () => void;
  subTitle?: React.ReactNode;
  warningIcon?: boolean;
  successIcon?: boolean;
  spinner?: boolean;
}

const Header: FC<HeaderProps> = props => {
  const {
    title,
    subTitle,
    warningIcon,
    successIcon,
    spinner,
    onClose,
    options,
    handleBack,
  } = props;
  return (
    <>
      <ModalHeader>
        <Box w="100%" display="flex" flexDirection="row">
          <Stack direction="row" spacing={3} alignItems="center" flex="auto">
            {warningIcon && <WarningTwoIcon />}
            {successIcon && <img src={success} />}
            {spinner && (
              <Spinner thickness="3px" speed="0.65s" color="blue" size="lg" />
            )}
            <Text
              fontSize="2xl"
              casing="uppercase"
              flex="auto"
              fontFamily="Cooper Hewitt"
              fontWeight="700"
              lineHeight="30px"
            >
              {title}
            </Text>
          </Stack>
          {handleBack && handleBack()}
          {options && options()}
          {onClose && onClose()}
        </Box>
        {subTitle && <Box>{subTitle}</Box>}
      </ModalHeader>
    </>
  );
};

export default Header;

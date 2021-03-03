import React, { FC } from 'react';
import { success } from '../../public';
import { Text, Stack, WarningIcon, ModalHeader, Spinner } from '../common';

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
        <Stack justifyContent="space-between">
          <Stack alignItems="center" spacing={2}>
            {warningIcon && <WarningIcon />}
            {successIcon && <img src={success} />}
            {spinner && <Spinner />}
            <Text
              fontWeight="700"
              fontFamily="Cooper Hewitt"
              textTransform="uppercase"
              fontSize="1.5rem"
              lineHeight="30px"
            >
              {title}
            </Text>
          </Stack>
          <Stack>
            {handleBack && handleBack()}
            {options && options()}
            {onClose && onClose()}
          </Stack>
        </Stack>
        {subTitle && <div>{subTitle}</div>}
      </ModalHeader>
    </>
  );
};

export default Header;

import React, { FC } from 'react';
import {
  ModalContent,
  ModalBody,
  Button,
  Text,
  Stack,
  Box,
  InputGroup,
  Input,
  FormHelperText,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import { styleModalContent, placeholder } from '../../constants';
import { EmailIcon, CheckIcon } from '@chakra-ui/icons';
import { Header, Footer } from '../static';

interface EmailProps {
  handleBack: () => void;
}
const Email: FC<EmailProps> = props => {
  const { handleBack } = props;
  const formik = useFormik({
    initialValues: { email: '' },
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <>
      <ModalContent
        id="modalContent"
        style={{
          ...styleModalContent,
          backgroundImage: `url(${placeholder})`,
          backgroundSize: '8rem',
          backgroundPositionX: 'left bottom',
        }}
      >
        <Header
          title="enter your email"
          subTitle={
            <Text fontSize="md">
              Or visit gmail.com to learn more about email.
            </Text>
          }
          handleBack={handleBack}
        />

        <ModalBody>
          <form onSubmit={formik.handleSubmit}>
            <Stack direction="column" spacing={5}>
              <Box>
                <InputGroup>
                  <InputLeftElement children={<EmailIcon />} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    size="lg"
                    placeholder="welcome@gmail.com"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                  />
                  <InputRightElement
                    children={<CheckIcon color="green.500" />}
                  />
                </InputGroup>
                <FormHelperText>We'll never share your email.</FormHelperText>
              </Box>
              <Button size="lg" type="submit">
                Submit
              </Button>
            </Stack>
          </form>
        </ModalBody>

        <Footer />
      </ModalContent>
    </>
  );
};

export default Email;

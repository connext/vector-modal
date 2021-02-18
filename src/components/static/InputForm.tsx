import React, { FC } from 'react';
import {
  Button,
  Text,
  Stack,
  NumberInput,
  NumberInputField,
  Box,
} from '@chakra-ui/react';
import { useFormik } from 'formik';

const InputForm: FC = () => {
  const formik = useFormik({
    initialValues: { amount: '' },
    onSubmit: values => {
      alert(JSON.stringify(values, null, 2));
    },
  });
  return (
    <>
      <form onSubmit={formik.handleSubmit}>
        <Stack direction="column" spacing={5}>
          <Box>
            <Text fontSize="xs" casing="uppercase" textAlign="end">
              Balance:
            </Text>
            <Box
              bg="white"
              w="100%"
              display="flex"
              flexDirection="row"
              alignItems="center"
              borderRadius="15px"
            >
              <NumberInput size="lg" flex="auto">
                <NumberInputField
                  id="amount"
                  name="amount"
                  placeholder="0.00"
                  inputMode="decimal"
                  title="Token Amount"
                  // styling
                  boxShadow="none!important"
                  border="none"
                  // text-specific options
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  //sanitation
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  // misc
                  onChange={formik.handleChange}
                  value={formik.values.amount}
                />
              </NumberInput>

              <Button
                size="sm"
                bg="#DEDEDE"
                borderRadius="5px"
                border="none"
                marginRight="10px"
                height="1.5rem"
              >
                max
              </Button>
            </Box>
          </Box>

          <Stack direction="column" spacing={2}>
            <Box display="flex">
              <Text fontSize="xs" casing="uppercase" flex="auto">
                Estimated Fees:
              </Text>
              <Text fontSize="xs" casing="uppercase">
                2345.33
              </Text>
            </Box>

            <Box display="flex">
              <Text fontSize="xs" casing="uppercase" flex="auto">
                You will receive:
              </Text>
              <Text fontSize="xs" casing="uppercase">
                2345.33
              </Text>
            </Box>
          </Stack>

          <Button size="lg" type="submit">
            Submit
          </Button>
        </Stack>
      </form>
    </>
  );
};

export default InputForm;

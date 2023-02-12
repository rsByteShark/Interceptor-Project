import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function TextButtons() {
    return (
        <Stack style={{ maxHeight: "35px" }} direction="row" spacing={2}>
            <Button disabled>Forward</Button>
            <Button disabled>Drop</Button>
            <Button>Intercept off</Button>
        </Stack>
    );
}
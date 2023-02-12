import * as React from 'react';
import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';

const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        right: -3,
        top: 13,
        border: `2px solid ${theme.palette.background.paper}`,
        padding: '0 4px',
    },
}));

const settingsCallHandler = () => {

    console.log("open settings")

}

export default function SettingsButton() {
    return (
        <IconButton onClick={settingsCallHandler} aria-label="cart">
            <StyledBadge color="secondary">
                <SettingsIcon />
            </StyledBadge>
        </IconButton>
    );
}
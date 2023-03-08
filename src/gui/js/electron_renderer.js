import React from 'react'
import { createRoot } from 'react-dom/client';
import App from '../components/App.js'

if (sessionStorage.getItem("DEV_START")) {
    console.log('WEB SERVER RELOAD');

} else {

    sessionStorage.setItem('DEV_START', true);

    console.log('FIRST RUN');

}


const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);






import './styles/globals.css';
import Head from 'next/head';
import config from '@/utils/config';
import { useEffect, useState } from 'react';
import AuthCheck from '../components/AuthCheck';

function MyApp({ Component, pageProps }) {
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

    useEffect(() => {
        if (!window.google && !googleMapsLoaded) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleApiKey}&libraries=places,geometry`;
            script.async = true;
            script.defer = true;
            script.onload = () => setGoogleMapsLoaded(true);
            document.head.appendChild(script);
        }
    }, [googleMapsLoaded]);

    return (
        <>
            <AuthCheck />
            <Head>
                <title>Arrow Connect</title>
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;

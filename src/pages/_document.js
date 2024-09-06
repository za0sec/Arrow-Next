import { Html, Head, Main, NextScript } from 'next/document';
import config from '@/pages/utils/config'; // Asegúrate de importar correctamente la configuración

export default function Document() {
    return (
        <Html>
            <Head>
                <script
                    src={`https://maps.googleapis.com/maps/api/js?key=${config.googleApiKey}&libraries=places`}
                    async
                    defer
                ></script>
            </Head>
            <body>
            <Main />
            <NextScript />
            </body>
        </Html>
    );
}

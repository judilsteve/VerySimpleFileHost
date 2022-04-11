import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <meta charSet="utf-8" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="apple-mobile-web-app-title" content="VSFH" />
      <meta name="application-name" content="VSFH" />
      <meta name="msapplication-TileColor" content="#111111" />
      <meta name="theme-color" content="#111111" />
      <meta name="viewport" content="width=device-width" initial-scale="1" />
      <meta name="description" content="Very Simple File Host" />
      <title>VSFH</title>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

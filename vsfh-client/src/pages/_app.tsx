import '@fontsource/lato';
import '../../semantic/dist/components/reset.min.css';
// TODO_JU I think this imports everything, can we be more selective?
// Would be nice to import on a per-page basis
import '../../semantic/dist/semantic.min.css';
import IconLink from '../Components/IconLink';

interface VerySimpleFileHostProps {
    Component: (props: any) => JSX.Element;
    pageProps: any;
}

function VerySimpleFileHost(props: VerySimpleFileHostProps) {

    const { Component, pageProps } = props;

    return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <noscript>Enable JavaScript to use VSFH</noscript>{/* TODO_JU Pretty this up a bit? */}
        <Component {...pageProps} />
        <div style={{ width: '100%', padding: '5px', textAlign: 'right', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <IconLink aria-label="VerySimpleFileHost GitHub (Source Code)" href="https://github.com/judilsteve/VerySimpleFileHost" name="github" size="large" />
        </div>
    </div>;
}

export default VerySimpleFileHost;

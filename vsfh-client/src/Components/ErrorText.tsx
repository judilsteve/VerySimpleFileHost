import { h } from 'preact';

export interface ErrorTextProps {
    children: preact.ComponentChildren;
};

function ErrorText(props: ErrorTextProps) {
    const { children } = props;

    return <p style={{ color: '#CC0000' }}>
        {children}
    </p>
}

export default ErrorText;
export interface ErrorTextProps {
    children: React.ReactNode;
};

function ErrorText(props: ErrorTextProps) {
    const { children } = props;

    return <p style={{ color: '#CC0000' }}>
        {children}
    </p>
}

export default ErrorText;
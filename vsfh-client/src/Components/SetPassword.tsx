import { useEffect } from "react";
import { Form, Input, LabelProps } from "semantic-ui-react";
import zxcvbn from "zxcvbn";
import { AuthConfigDto } from "../API";
import ErrorText from "./ErrorText";

const zxcvbnScores: LabelProps[] = [
    {
        color: 'brown',
        content: 'Catastrophic'
    },
    {
        color: 'orange',
        content: 'Woeful'
    },
    {
        color: 'yellow',
        content: 'Lukewarm'
    },
    {
        color: 'green',
        content: 'Sturdy'
    },
    {
        color: 'teal',
        content: 'Adamantine',
        icon: 'diamond'
    }
];

export interface SetPasswordProps {
    password: string;
    setPassword: (newPassword: string) => void;
    checkPassword: string;
    setCheckPassword: (newPassword: string) => void;
    authConfig: AuthConfigDto | undefined;
    passwordPlaceholder: string;
    setPasswordValid: (valid: boolean) => void;
    startTabIndex: number;
    currentPassword?: string;
    disabled: boolean;
    trySubmit: () => void;
}

function SetPassword(props: SetPasswordProps) {
    const {
        password, setPassword,
        checkPassword, setCheckPassword,
        authConfig,
        passwordPlaceholder,
        setPasswordValid,
        startTabIndex,
        currentPassword,
        disabled,
        trySubmit
    } = props;

    const passwordsMatch = password === checkPassword;

    const passwordStrength = password ? zxcvbn(password) : null;
    const passwordTooWeak = !!passwordStrength && !!authConfig
        && passwordStrength.score < authConfig.minimumPasswordScore!;

    const passwordIsSame = currentPassword && password && currentPassword === password;

    const passwordValid = !!password
        && !!checkPassword
        && passwordsMatch
        && !passwordTooWeak
        && !passwordIsSame;

    useEffect(() => {
        setPasswordValid(passwordValid)
    }, [passwordValid, setPasswordValid]);

    const submitOnEnter = (e: KeyboardEvent) => {
        if(e.key === 'Enter') trySubmit();
    };

    const passwordStrengthLabel = passwordStrength
        ? zxcvbnScores[passwordStrength.score]
        : null;

    return <>
        <Form.Field>
            {/*
              * Note: Passing `fluid` to the input prevents it from overflowing the
              * container on some displays when showing wide labels (e.g. "<>Adamantine")
              */}
            <Input tabIndex={startTabIndex} disabled={disabled}
                label={passwordStrengthLabel} fluid
                labelPosition="right"
                icon="key" iconPosition="left"
                type="password" placeholder={passwordPlaceholder}
                value={password} onChange={e => setPassword(e.target.value)} />
            {passwordIsSame && <ErrorText>New password cannot be the same as current password</ErrorText>}
            {passwordTooWeak && <ErrorText>{`Password strength must be at least '${zxcvbnScores[authConfig.minimumPasswordScore!].content}'`}</ErrorText>}
            {passwordStrength?.feedback.warning && <p><em>{passwordStrength.feedback.warning}</em></p>}
            {passwordStrength?.feedback.suggestions && passwordStrength.feedback.suggestions.map(s => <p key={s}><em>{s}</em></p>)}
        </Form.Field>
        <Form.Field>
            <Input
                tabIndex={startTabIndex + 1}
                onKeyUp={submitOnEnter}
                disabled={disabled}
                icon="key"
                iconPosition="left"
                type="password"
                placeholder="Confirm"
                value={checkPassword}
                onChange={e => setCheckPassword(e.target.value)} />
            {checkPassword && !passwordsMatch && <ErrorText>Passwords do not match</ErrorText>}
        </Form.Field>
    </>;
}

export default SetPassword;

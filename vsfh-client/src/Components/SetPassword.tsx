import { h, Fragment } from 'preact';
import { useEffect, useState } from "preact/hooks";
import 'fomantic-ui-less/definitions/collections/form.less';
import 'fomantic-ui-less/definitions/elements/input.less';
import 'fomantic-ui-less/definitions/elements/label.less';
import { Input, LabelProps } from "semantic-ui-react";
import { ZXCVBNResult } from "zxcvbn";
import { AuthConfigDto } from "../API";
import ErrorText from "./ErrorText";
import { FormField } from "../Components/SemanticForm";

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
    currentPassword?: string;
    disabled: boolean;
    trySubmit: () => void;
}

declare type zxcvbnFunc = (password: string) => ZXCVBNResult;

function SetPassword(props: SetPasswordProps) {
    const {
        password, setPassword,
        checkPassword, setCheckPassword,
        authConfig,
        passwordPlaceholder,
        setPasswordValid,
        currentPassword,
        disabled,
        trySubmit
    } = props;

    const passwordsMatch = password === checkPassword;

    const [zxcvbn, setzxcvbn] = useState<(zxcvbnFunc | null)>(null);
    useEffect(() => {
        let cancel = false;
        (async () => {
            const zxcvbn = (await import('zxcvbn')).default;
            if(!cancel) setzxcvbn((_state: zxcvbnFunc | null) => zxcvbn);
        })();
        return () => { cancel = true; };
    }, []);

    const passwordStrength = password && zxcvbn ? zxcvbn(password) : null;
    const passwordTooWeak = !!passwordStrength && !!authConfig
        && passwordStrength.score < authConfig.minimumPasswordScore!;

    const passwordIsSame = currentPassword && password && currentPassword === password;

    const passwordValid = !!password
        && !!zxcvbn
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
        <FormField>
            {/*
              * Note: Passing `fluid` to the input prevents it from overflowing the
              * container on some displays when showing wide labels (e.g. "<>Adamantine")
              */}
            <Input disabled={disabled}
                label={passwordStrengthLabel} fluid
                labelPosition="right"
                icon="key" iconPosition="left"
                type="password" placeholder={passwordPlaceholder}
                value={password} onChange={e => setPassword(e.target.value)} />
            {passwordIsSame && <ErrorText>New password cannot be the same as current password</ErrorText>}
            {passwordTooWeak && <ErrorText>{`Password strength must be at least '${zxcvbnScores[authConfig.minimumPasswordScore!].content}'`}</ErrorText>}
            {passwordStrength?.feedback.warning && <p><em>{passwordStrength.feedback.warning}</em></p>}
            {passwordStrength?.feedback.suggestions && passwordStrength.feedback.suggestions.map(s => <p key={s}><em>{s}</em></p>)}
        </FormField>
        <FormField>
            <Input
                onKeyUp={submitOnEnter}
                disabled={disabled}
                icon="key"
                iconPosition="left"
                type="password"
                placeholder="Confirm"
                value={checkPassword}
                onChange={e => setCheckPassword(e.target.value)} />
            {checkPassword && !passwordsMatch && <ErrorText>Passwords do not match</ErrorText>}
        </FormField>
    </>;
}

export default SetPassword;

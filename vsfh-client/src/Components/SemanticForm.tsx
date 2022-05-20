import { h, ComponentChildren, JSX } from 'preact';

// Mimicks basic layout/functionality of semantic-ui-react Form element but with a much smaller bundle
export function Form(props: { error: boolean, children: ComponentChildren, style?: JSX.CSSProperties }) {
    const { error, children, style } = props;

    return <div class={`ui form${error ? ' error' : ''}`} style={style}>{ children }</div>
}

// Mimicks basic layout/functionality of semantic-ui-react Form.Field element but with a much smaller bundle
export function FormField(props: { children: ComponentChildren }) {
    const { children, ...rest } = props;

    return <div class="field" {...rest}>
        { children }
    </div>
}
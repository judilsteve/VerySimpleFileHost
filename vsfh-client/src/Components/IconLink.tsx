import { Icon, IconProps } from "semantic-ui-react";

export interface IconLinkProps extends IconProps {
    href: string;
}

function IconLink(props: IconLinkProps) {
    const { href, newTab, ...iconProps } = props;

    // TODO_JU Remove inline styling for this
    return <a style={{ all: 'unset' }} href={href} target={newTab ? '_blank' : undefined} rel="noreferrer">
        <Icon link {...iconProps} />
    </a>;
}

export default IconLink;

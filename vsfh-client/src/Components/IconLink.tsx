import { Icon, IconProps } from "semantic-ui-react";

export interface IconLinkProps extends IconProps {
    href: string;
}

function IconLink(props: IconLinkProps) {
    const { href, ...iconProps } = props;

    return <a style={{ all: 'unset' }} href={href}>
        <Icon link {...iconProps} />
    </a>;
}

export default IconLink;

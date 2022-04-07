import './IconLink.less';
import { Icon, IconProps } from "semantic-ui-react";

export interface IconLinkProps extends IconProps {
    href: string;
}

function IconLink(props: IconLinkProps) {
    const { href, newTab, 'aria-label': ariaLabel, ...iconProps } = props;

    return <a aria-label={ariaLabel} className='iconlink' href={href} target={newTab ? '_blank' : undefined} rel="noreferrer">
        <Icon link {...iconProps} />
    </a>;
}

export default IconLink;

import { h } from 'preact';
import './IconLink.less';
import 'fomantic-ui-less/definitions/elements/icon.less';
import { Icon, IconProps } from "semantic-ui-react";

export interface IconLinkProps extends IconProps {
    href: string;
    download?: string;
    native?: boolean;
}

function IconLink(props: IconLinkProps) {
    const { href, download, newTab, 'aria-label': ariaLabel, native, ...iconProps } = props;

    return <a aria-label={ariaLabel} className='iconlink' href={href} download={download} target={newTab ? '_blank' : undefined} rel="noreferrer" native={!!native}>
        <Icon link {...iconProps} />
    </a>;
}

export default IconLink;

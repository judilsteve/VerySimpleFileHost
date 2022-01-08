export interface GlobalSidebarProps {
    open: boolean;
    children: React.ReactNode;
}

function GlobalSidebar(props: GlobalSidebarProps) {
    const { open, children } = props;

    const style: React.CSSProperties = {
        position: 'fixed',
        right: 0,
        height: '100vh',
        transform: `translate3d(${open ? 0 : '100%'}, 0, 0)`,
        transition: 'transform 0.2s',
        background: '#171717',
        padding: '1em',
        zIndex: 9999,
        width: '30vw',
        overflowY: 'scroll'
    };

    return  <div style={style}>
        {children}
    </div>
}

export default GlobalSidebar;
import './Browse.less';

import { ReactNode, useCallback, useEffect, useMemo, useState, MouseEvent, useRef } from "react";
import { useLocation } from "react-router";
import { Button, Checkbox, Container, Grid, Header, Icon, Input, List, Loader, Sticky } from "semantic-ui-react";
import { ArchiveFormat, DirectoryDto, FileDto } from "../API";
import { apiConfig } from "../apiInstances";
import FilesApi from "../ApiOverrides/FilesApi";
import IconLink from "../Components/IconLink";
import NavHeader from "../Components/NavHeader";
import { useIsMounted } from "../Hooks/useIsMounted";
import { usePageTitle } from "../Hooks/usePageTitle";
import { useSharedState } from "../Hooks/useSharedState";
import { archiveFormatState } from "../State/sharedState";
import tryHandleError from "../Utils/tryHandleError";
import GlobalSidebar from '../Components/GlobalSidebar';

const api = new FilesApi(apiConfig);

const fileSizeStepFactor = 1024;
const fileSizeSuffixes = ["B", "KiB", "MiB", "GiB", "TiB"];

const treeNode = "tree-node";
const showOnNodeHover="show-on-node-hover";

function log(value: number, base: number): number {
    return Math.log(value) / Math.log(base);
}

function humaniseBytes(bytes: number) {
    let step: number, displayValue: number;
    if (bytes === 0) { // Log would return infinity in this case
        step = 0;
        displayValue = 0;
    } else {
        step = Math.floor(Math.min(
        log(bytes, fileSizeStepFactor),
        fileSizeSuffixes.length - 1));
        displayValue = bytes / Math.pow(fileSizeStepFactor, step);
    }
    return `${displayValue.toFixed(step === 0 ? 0 : 2)}${fileSizeSuffixes[step]}`;
}

function combinePaths(...paths: string[]) {
    return paths.reduce((p, next) => p ? `${p}/${next}` : next);
}

function sanitisePath(path: string) {
    return path.replaceAll('?', '%3f').replaceAll('#', '%23');
}

interface DirectoryProps {
    path: string;
    displayName: string;
    archiveFormat: ArchiveFormat;
    expandedDirectories: Directories;
    selectDirectory: (path: string) => void;
    deselectDirectory: (path: string) => void;
    visiblePaths: Set<string>;
    onExpand: (d: DirectoryDto, prefix: string) => void;
    onCollapse: (prefix: string) => void;
}

// TODO_JU Files and directories need consistent hover highlighting/cursor behaviour
function Directory(props: DirectoryProps) {
    const {
        displayName,
        path,
        archiveFormat,
        expandedDirectories,
        selectDirectory,
        deselectDirectory,
        visiblePaths,
        onExpand,
        onCollapse
    } = props;

    const tree = expandedDirectories[path];
    const expanded = !!tree;
    const [loading, setLoading] = useState(false);
    const isMounted = useIsMounted();
    // TODO_JU Test spamming the button
    // TODO_JU Allow user to cancel loading: https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
    // TODO_JU If this throws then it immediately starts again
    // TODO_JU Clicking root node results in 2 requests for some reason
    const expand = useCallback(async () => {
        if(loading || expanded) return;
        setLoading(true);
        let newTree;
        try {
            newTree = await api.apiFilesListingPathGet({ path, depth: 1});
        } catch(e) {
            if(!await tryHandleError(e as Response)) {
                // TODO_JU Handle error
            }
            return;
        } finally {
            if(isMounted.current) setLoading(false);
        }
        if(isMounted.current) onExpand(newTree, path);
    }, [loading, expanded, isMounted, onExpand, path]);

    const { hash } = useLocation();
    useEffect(() => {
        const parsedHash = decodeURIComponent(hash).substring(1);
        if(!path || parsedHash.startsWith(`${path}/`)) {
            expand();
        } else if (parsedHash === path) {
            // Re-set the hash path to trigger CSS highlighting
            window.location.hash = path; // TODO_JU Maybe a dimmer while this is happening
        }
    }, [expand, hash, path]);

    const collapse = () => {
        if(loading || !expanded) return;
        onCollapse(path);
    };

    // By managing this state ourselves and using an effect to update the global list,
    // we avoid this component having a dependency on the set of selected paths.
    // This means we don't have to re-render the entire tree every time a path is
    // checked or unchecked
    const [selected, setSelected] = useState(false);
    useEffect(() => {
        (selected ? selectDirectory : deselectDirectory)(path);
    }, [selected, path, selectDirectory, deselectDirectory]);

    // Ensure that we deselect ourself when unmounting
    useEffect(() => {
        return () => deselectDirectory(path);
    }, [deselectDirectory, path]);

    if(path && !visiblePaths.has(path)) return <></>;

    const loc = window.location;
    const hashLink = `${loc.pathname}${loc.search}#${path}`;
    const downloadLink = `/api/Files/Download/${sanitisePath(path)}?archiveFormat=${archiveFormat}&asAttachment=true`;

    // TODO_JU Make it not ugly
    return <div>
        <List.Item>
            {/*
                TODO_JU
                Prevent selection if parent already selected
                Pull this out into some sort of "InlineSmallCheckbox" component that fits better with everything else
             */}
            <Checkbox checked={selected} onChange={_ => setSelected(!selected)} />
            <div className={treeNode}>
                <Icon fitted name={expanded || loading ? 'folder open' : 'folder'} onClick={expanded ? collapse : expand}/>
                <span className="anchor path" id={path} onClick={expanded ? collapse : expand}>{displayName}</span>
                <IconLink className={showOnNodeHover} name="download" fitted href={downloadLink} />
                <IconLink className={showOnNodeHover} href={hashLink} name="linkify" fitted />
            </div>
            {
                (!expanded && !loading) ? <></> : <List.List>
                    {loading ? <Loader indeterminate active inline size="tiny" /> : <>
                        {tree?.subdirectories!.map(d => <Directory
                            {...props}
                            key={d.displayName}
                            path={combinePaths(path, d.displayName!)}
                            displayName={d.displayName!} />)}
                        {tree?.files!.map(f => <File key={f.displayName}
                            {...f}
                            basePath={path}
                            visiblePaths={visiblePaths} />)}
                    </>}
                </List.List>
            }
        </List.Item>
    </div>;
}

interface FileProps extends FileDto {
    basePath: string;
    visiblePaths: Set<string>;
    
}

interface SneakyLinkProps {
    regularClickHref: string;
    altClickHref: string;
    children?: ReactNode;
}

function SneakyLink(props: SneakyLinkProps) {
    const { regularClickHref, altClickHref, children, ...rest } = props;

    const ref = useRef<HTMLAnchorElement>(null);

    const overrideHref = useCallback((e) => {
        // User is attempting to open the link in a new tab
        // Quickly set the href to altClickHref so they go to the right place
        ref.current!.href = altClickHref;
        // Set it back immediately after the browser has done its job
        window.setTimeout(() => ref.current!.href = regularClickHref, 0);
    }, [altClickHref, regularClickHref])

    const onClick = useCallback((e: MouseEvent) => {
        if(e.ctrlKey) overrideHref(e);
    }, [overrideHref]);

    const onMouseUp = useCallback((e: MouseEvent) => {
        if(e.button === 1) overrideHref(e);
    }, [overrideHref])

    return <a {...rest} ref={ref} href={regularClickHref} onClick={onClick} onMouseUp={onMouseUp}>
        { children }
    </a>
}

function File(props: FileProps) {
    const { basePath, displayName, sizeBytes, visiblePaths } = props;
    const path = combinePaths(basePath, displayName!);

    const loc = window.location;
    const hashLink = `${loc.pathname}${loc.search}#${path}`;

    const href = `/api/Files/Download/${sanitisePath(path)}`;

    const { hash } = useLocation();
    useEffect(() => {
        if (decodeURIComponent(hash).substring(1) === path) {
            // Re-set the hash path to trigger CSS highlighting
            window.location.hash = path;
        }
    }, [hash, path]);

    if(!visiblePaths.has(path)) return <></>;

    // TODO_JU Make it not ugly
    // TODO_JU Files don't seem to properly align with folders
    return <div>
        <List.Item className={treeNode}>
            {/*TODO_JU Multi-select checkbox (maybe fades in and out on hover [of parent]?)*/}
            <SneakyLink regularClickHref={`${href}?asAttachment=true`} altClickHref={href}>
                <Icon name="file" />
                <span className="anchor path" id={path}>{displayName}</span> ({humaniseBytes(sizeBytes!)})
            </SneakyLink>
            <IconLink className={showOnNodeHover} href={hashLink} name="linkify" fitted />
        </List.Item>
    </div>;
}

type Directories = { [path: string]: DirectoryDto };

function* getAllPaths(expandedDirectories: Directories) {
    for(const path in expandedDirectories) {
        yield path;
        const dir = expandedDirectories[path];
        for(const subdir of dir.subdirectories ?? []) {
            yield combinePaths(path, subdir.displayName!);
        }
        for(const file of dir.files ?? []) {
            yield combinePaths(path, file.displayName!);
        }
    }
}

type SelectedPaths = { [path: string]: boolean }; // Boolean value represents isDirectory

// TODO_JU Deal with container overflow (ellipsis rules don't seem to be working right for paths in the main tree)
function Browse() {
    usePageTitle('Browse');

    const [archiveFormat, setArchiveFormat] = useSharedState(archiveFormatState);

    const [textFilter, setTextFilter] = useState('');

    const [expandedDirectories, setExpandedDirectories] = useState<Directories>({});
    const addExpandedDirectory = useCallback((d: DirectoryDto, prefix: string) => setExpandedDirectories(expandedDirectories => ({
        ...expandedDirectories,
        [prefix]: d
    })), []);
    const removeExpandedDirectory = useCallback((prefix: string) => setExpandedDirectories(expandedDirectories => {
        const newExpandedDirectories: Directories = {};
        if(!prefix) return newExpandedDirectories;
        const testString = `${prefix}/`;
        for(const path in expandedDirectories) {
            if(path.startsWith(testString) || path === prefix) continue;
            newExpandedDirectories[path] = expandedDirectories[path];
        }
        return newExpandedDirectories;
    }), []);

    const visiblePaths = useMemo(() => {
        const loadedPaths = getAllPaths(expandedDirectories);
        if(!textFilter) return new Set(loadedPaths);
        const filteredPaths = new Set<string>();
        const textFilterLowerCase = textFilter.toLocaleLowerCase();
        for(let path of loadedPaths) {
            if(!path.toLocaleLowerCase().includes(textFilterLowerCase)) continue;
            // If a path matches the filter and should be visible,
            // then all its parent paths must be made visible too
            while(path) {
                if(filteredPaths.has(path)) {
                    // This path has already been granted visibility by a match in one of its child paths
                    // There is nothing to do here
                    break;
                }
                filteredPaths.add(path);
                path = path.substring(0, path.lastIndexOf('/'))
            }
        }
        return filteredPaths;
    }, [textFilter, expandedDirectories]);

    const stickyRef = useRef(null);

    const [selectedPaths, setSelectedPaths] = useState<SelectedPaths>({});
    const selectPath = useCallback((path: string, isDirectory: boolean) => setSelectedPaths(paths =>
        ({ ...paths, [path]: isDirectory })
    ), []);
    const deselectPath = useCallback((path: string) => setSelectedPaths(paths => {
        const newPaths: SelectedPaths = {};
        for(const oldPath in paths) {
            if(oldPath !== path)
                newPaths[oldPath] = paths[oldPath];
        }
        return newPaths;
    }), []);

    const selectDirectory = useCallback((path: string) => selectPath(path, true), [selectPath]);

    const downloadSelected = () => console.debug('TODO_JU');

    const selectedPathsArray = Object.keys(selectedPaths);

    return <>
        <GlobalSidebar open={!!selectedPathsArray.length}>
            <Header as="h2">Selected</Header>
            <List>
                {selectedPathsArray.map(p => <List.Item key={p} className="path" alt={p}>
                    <Icon name={selectedPaths[p] ? 'folder' : 'file'} />{p}{selectedPaths[p] ? '/' : ''}
                </List.Item>)}
            </List>
            <div style={{ float: 'right' }}>{/* TODO_JU These buttons look ugly when they stack */}
                <Button primary onClick={downloadSelected}><Icon name='download' />Download ({selectedPathsArray.length})</Button>
                <Button secondary onClick={() => setSelectedPaths({})}><Icon name='close' />Clear</Button>
            </div>
        </GlobalSidebar>
        <Container>
            <NavHeader pageTitle="Browse" />
            <div ref={stickyRef}>
                <Sticky context={stickyRef} offset={14}>
                    <Grid stackable>
                        <Grid.Column width={13}>
                            {/*
                                By not providing value={textFilter} in the input component below,
                                we let the browser use the native value. This means that if the user's
                                typing causes a lengthy update (i.e. if they're filtering a big tree)
                                then they don't have to wait for react's render cycle to complete before
                                they see the new characters appear in the text box. the onChange handler
                                is wrapped in a setTimeout just to stop react from complaining about
                                "setting components from controlled to uncontrolled" in the console.
                            */}
                            <Input autoFocus fluid icon="filter" iconPosition="left" placeholder="Filter"
                                onChange={e => window.setTimeout(() => setTextFilter(e.target.value), 0)} />
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Button.Group fluid style={{ height: '100%' }}>
                                <Button secondary active={archiveFormat === ArchiveFormat.Tar} onClick={() => setArchiveFormat(ArchiveFormat.Tar)}>Tar</Button>
                                <Button secondary active={archiveFormat === ArchiveFormat.Zip} onClick={() => setArchiveFormat(ArchiveFormat.Zip)}>Zip</Button>
                            </Button.Group>
                        </Grid.Column>
                    </Grid>
                </Sticky>
                <List>
                    <Directory
                        expandedDirectories={expandedDirectories}
                        visiblePaths={visiblePaths!}
                        selectDirectory={selectDirectory}
                        deselectDirectory={deselectPath}
                        displayName="<root>"
                        path=""
                        archiveFormat={archiveFormat}
                        onExpand={addExpandedDirectory}
                        onCollapse={removeExpandedDirectory} />
                </List>
            </div>
        </Container>
    </>;
}

export default Browse;

import './Browse.less';

import { ReactNode, useCallback, useEffect, useMemo, useState, MouseEvent, useRef, RefObject } from "react";
import { useLocation } from "react-router";
import { Button, Checkbox, Container, Grid, Header, Icon, Input, List, Loader, Sticky } from "semantic-ui-react";
import { ArchiveFormat, DirectoryDto } from "../API";
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
import { SelectedPaths, useSharedSelection, useSharedSelectionSource } from '../Hooks/useSharedSelection';

const api = new FilesApi(apiConfig);

const fileSizeStepFactor = 1024;
const fileSizeSuffixes = ["B", "KiB", "MiB", "GiB", "TiB"];

const treeNodeClassName = "tree-node";
const showOnNodeHoverClassName = "show-on-node-hover";
const pathClassName = "path";
const hashAnchorClassName = "hash-anchor";
const smallClassName = "small";
const fileSizeClassName = "file-size";
const directoryNodeClassName = "directory-node";

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
    parentSelected: boolean;
    selectPath: (
        path: string,
        isDirectory: boolean,
        deselect: () => void
    ) => void;
    deselectPath: (path: string) => void;
    selectedPaths: RefObject<SelectedPaths>;
    visiblePaths: Set<string>;
    onExpand: (d: DirectoryDto, prefix: string) => void;
    onCollapse: (prefix: string) => void;
}

function Directory(props: DirectoryProps) {
    const {
        displayName,
        path,
        archiveFormat,
        expandedDirectories,
        parentSelected,
        selectPath,
        deselectPath,
        selectedPaths,
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
    // TODO_JU Cannot collapse highlighted node
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
    const parsedHash = decodeURIComponent(hash).substring(1);
    useEffect(() => {
        if(!path || parsedHash.startsWith(`${path}/`)) {
            expand();
        } else if (parsedHash === path) {
            // Re-set the hash path to trigger autoscroll and CSS highlighting
            // TODO_JU We often inadvertently hit this while backing out a filter,
            // as this callback runs when the hash anchor becomes visible again
            window.location.hash = path; // TODO_JU Maybe a dimmer while this is happening
        }
    }, [expand, parsedHash, path]);

    const { selected, toggleSelect } = useSharedSelection(selectPath, deselectPath, selectedPaths, path, true);

    const fileNodes = useMemo(() => {
        const fileNodes = [];
        for(const file of tree?.files ?? []) {
            const filePath = combinePaths(path, file.displayName!);
            if(visiblePaths.has(filePath))
                fileNodes.push(<File
                    key={file.displayName}
                    displayName={file.displayName!}
                    sizeBytes={file.sizeBytes!}
                    path={filePath}
                    parentSelected={selected}
                    selectPath={selectPath}
                    deselectPath={deselectPath}
                    selectedPaths={selectedPaths} />);
        }
        return fileNodes;
    }, [path, tree, visiblePaths, selectPath, deselectPath, selectedPaths, selected]);

    const directoryNodes = [];
    for(const subdir of tree?.subdirectories ?? []) {
        const dirPath = combinePaths(path, subdir.displayName!);
        if(visiblePaths.has(dirPath))
            directoryNodes.push(<Directory
                key={subdir.displayName}
                path={dirPath}
                displayName={subdir.displayName!}
                archiveFormat={archiveFormat}
                expandedDirectories={expandedDirectories}
                selectPath={selectPath}
                deselectPath={deselectPath}
                selectedPaths={selectedPaths}
                parentSelected={selected}
                visiblePaths={visiblePaths}
                onExpand={onExpand}
                onCollapse={onCollapse}
            />);
    }

    const thisNode = useMemo(() => {
        const collapse = () => {
            if(loading || !expanded) return;
            onCollapse(path);
            if(parsedHash.startsWith(`${path}/`)) window.location.hash = '';
        };

        const hashLink = `#${path}`;
        const downloadLink = `/api/Files/Download/${sanitisePath(path)}?archiveFormat=${archiveFormat}&asAttachment=true`;

        return <div className={`${treeNodeClassName} ${pathClassName}`}>
            <Checkbox
                className={smallClassName}
                disabled={parentSelected}
                checked={selected || parentSelected}
                onChange={toggleSelect} />
            <div className={hashAnchorClassName} id={path}></div>
            <span className={directoryNodeClassName} onClick={expanded ? collapse : expand}>
                <Icon name={expanded || loading ? 'folder open' : 'folder'} />
                {displayName}&nbsp;
            </span>
            <IconLink className={showOnNodeHoverClassName} name="download" href={downloadLink} />
            <IconLink className={showOnNodeHoverClassName} href={hashLink} name="linkify" />
        </div>;
    }, [displayName, expanded, expand, loading, parentSelected, selected, toggleSelect, path, onCollapse, parsedHash, archiveFormat]);

    return <div>
        <List.Item>
            { thisNode }
            {
                (!expanded && !loading) ? <></> : <List.List>
                    {loading ? <Loader indeterminate active inline size="tiny" /> : <>
                        {directoryNodes}
                        {fileNodes}
                    </>}
                </List.List>
            }
        </List.Item>
    </div>;
}

interface SneakyLinkProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
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

interface FileProps {
    path: string;
    displayName: string;
    sizeBytes: number;
    selectPath: (
        path: string,
        isDirectory: boolean,
        deselect: () => void
    ) => void;
    deselectPath: (path: string) => void;
    selectedPaths: RefObject<SelectedPaths>;
    parentSelected: boolean;
}

function File(props: FileProps) {
    const {
        path,
        displayName,
        sizeBytes,
        selectPath,
        deselectPath,
        selectedPaths,
        parentSelected
    } = props;

    const hashLink = `#${path}`;

    const href = `/api/Files/Download/${sanitisePath(path)}`;

    const { hash } = useLocation();
    useEffect(() => {
        if (decodeURIComponent(hash).substring(1) === path) {
            // Re-set the hash path to trigger autoscroll and CSS highlighting
            window.location.hash = path;
        }
    }, [hash, path]);

    const { selected, toggleSelect } = useSharedSelection(selectPath, deselectPath, selectedPaths, path, false);

    return <div>
        <List.Item className={`${treeNodeClassName} ${pathClassName}`}>
            <Checkbox
                className={smallClassName}
                disabled={parentSelected}
                checked={selected || parentSelected}
                onChange={toggleSelect} />
            <SneakyLink regularClickHref={`${href}?asAttachment=true`} altClickHref={href}>
                <div className={hashAnchorClassName} id={path}></div>
                <span>
                    <Icon name="file" />
                    {displayName}&nbsp;
                </span>
            </SneakyLink>
            <span className={fileSizeClassName} >({humaniseBytes(sizeBytes)})&nbsp;</span>
            <IconLink className={showOnNodeHoverClassName} href={hashLink} name="linkify" />
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

    const {
        selectedPaths,
        selectedPathsRef,
        selectPath,
        deselectPath,
        clearPaths
    } = useSharedSelectionSource();

    const selectedPathsArray = Object.keys(selectedPaths);

    const root = useMemo(() => <Directory
        expandedDirectories={expandedDirectories}
        visiblePaths={visiblePaths!}
        selectPath={selectPath}
        deselectPath={deselectPath}
        selectedPaths={selectedPathsRef}
        parentSelected={false}
        displayName="<root>"
        path=""
        archiveFormat={archiveFormat}
        onExpand={addExpandedDirectory}
        onCollapse={removeExpandedDirectory} />
    , [
        expandedDirectories,
        visiblePaths,
        selectPath,
        deselectPath,
        selectedPathsRef,
        archiveFormat,
        addExpandedDirectory,
        removeExpandedDirectory]);

    return <>
        <GlobalSidebar open={!!selectedPathsArray.length}>
            <Header as="h2">{selectedPathsArray.length} Item{selectedPathsArray.length > 1 ? 's' : ''} Selected</Header>
            <List>
                {selectedPathsArray.map(p => <List.Item key={p} className={treeNodeClassName}>
                    <div style={{ display: 'flex' }}>
                        <Icon name={selectedPaths[p] ? 'folder' : 'file'} />
                        <span className={pathClassName}>
                            {p || '<root>'}{selectedPaths[p].isDirectory ? '/' : ''}&nbsp;
                        </span>
                        <Icon link className={showOnNodeHoverClassName} name="remove"
                            onClick={() => { deselectPath(p); }} />
                    </div>
                </List.Item>)}
            </List>
            <form action={`/api/Files/DownloadManyForm?archiveFormat=${archiveFormat}&asAttachment=true`} method="post">
                {/* Putting these input elements inside the List.Items was messing with their flow in weird ways */}
                {selectedPathsArray.map(p => <input key={p} type='hidden' name='paths' value={p} />)}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', rowGap: '0.25em' }}>
                    <Button primary type="submit"><Icon name='download' />Download</Button>
                    <Button secondary type="reset" onClick={clearPaths}><Icon name='close' />Clear</Button>
                </div>
            </form>
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
                    {root}
                </List>
            </div>
        </Container>
    </>;
}

export default Browse;

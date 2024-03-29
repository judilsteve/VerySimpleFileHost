import { h, Fragment } from 'preact';
import { useCallback, useEffect, useMemo, useState, useRef } from "preact/hooks";
import { RefObject } from "preact";
import 'semantic-ui-less/definitions/elements/button.less';
import 'semantic-ui-less/definitions/modules/checkbox.less';
import 'semantic-ui-less/definitions/elements/container.less';
import 'semantic-ui-less/definitions/collections/grid.less';
import 'semantic-ui-less/definitions/elements/header.less';
import 'semantic-ui-less/definitions/elements/icon.less';
import 'semantic-ui-less/definitions/elements/input.less';
import 'semantic-ui-less/definitions/elements/list.less';
import 'semantic-ui-less/definitions/elements/loader.less';
import 'semantic-ui-less/definitions/collections/message.less';
import 'semantic-ui-less/definitions/modules/modal.less';
import 'semantic-ui-less/definitions/modules/sticky.less';
import './Browse.less'; // Must go *after* checkbox.less/icon.less to enable style rules to apply correctly
import { Button, Checkbox, Container, Grid, Header, Icon, Input, List, Loader, Message, Modal, Sticky } from "semantic-ui-react";
import { ArchiveFormat, DirectoryDto } from "../API";
import { apiConfig } from "../apiInstances";
import FilesApi from "../ApiOverrides/FilesApi";
import IconLink from "../Components/IconLink";
import NavHeader from "../Components/NavHeader";
import { useIsMounted } from "../Hooks/useIsMounted";
import { useSharedState } from "../Hooks/useSharedState";
import { archiveFormatState, hashState } from "../State/sharedState";
import tryHandleError, { printResponseError } from "../Utils/tryHandleError";
import GlobalSidebar from '../Components/GlobalSidebar';
import { SelectedPaths, useSharedSelection, useSharedSelectionSource } from '../Hooks/useSharedSelection';
import CenteredSpinner from '../Components/CenteredSpinner';
import { routes } from '../routes';
import { usePageTitle } from '../Hooks/usePageTitle';

const api = new FilesApi(apiConfig);

const fileSizeStepFactor = 1024;
const fileSizeSuffixes = ["B", "KiB", "MiB", "GiB", "TiB"];

const treeNodeClassName = "tree-node";
const showOnNodeHoverClassName = "show-on-node-hover";
const pathClassName = "path";
const hashAnchorClassName = "hash-anchor";
const hashAnchorNodeClassName = "hash-anchor-node";
const smallClassName = "small";
const fileSizeClassName = "file-size";
const directoryNodeClassName = "directory-node";
const emptyListPlaceholderClassName = "empty-list-placeholder";
const underDirectoryClassName = "under-directory";

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
    navigatedToHash: RefObject<boolean>;
    onFoundHash: () => void;
    handleListingError: (path: string) => void;
}

function parseHash(hash: string) {
    return decodeURIComponent(hash).substring(1);
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
        onCollapse,
        navigatedToHash,
        onFoundHash,
        handleListingError
    } = props;

    const tree = expandedDirectories[path];
    const loaded = !!tree;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isMounted = useIsMounted();
    // TODO_JU Expand, collapse, and the hash-finder effect could all
    // be hoisted up into Browse, greatly simplifying this component.
    const expand = useCallback(async () => {
        setLoading(true); setError('');
        let newTree;
        try {
            newTree = await api.apiFilesListingPathGet({ path, depth: 1});
        } catch(e) {
            handleListingError(path);
            const responseError = e as Response;
            if(!await tryHandleError(responseError)) {
                await printResponseError(responseError, 'listing');
                if(isMounted.current) setError('An unexpected error occurred');
            }
            return;
        } finally {
            if(isMounted.current) setLoading(false);
        }
        if(isMounted.current) onExpand(newTree, path);
    }, [isMounted, onExpand, path, handleListingError]);

    const [hash, _] = useSharedState(hashState);
    const parsedHash = parseHash(hash);
    useEffect(() => {
        if(navigatedToHash.current) return;
        else if(parsedHash.startsWith(`${path}/`)) {
            expand();
        } else if (parsedHash === path) {
            // Re-set the hash path to trigger autoscroll and CSS highlighting
            window.location.hash = path;
            onFoundHash();
        }
    }, [expand, parsedHash, path, navigatedToHash, onFoundHash]);

    useEffect(() => {
        if(!path) expand();
    }, [path, expand]);

    const { selected, toggleSelect } = useSharedSelection(selectPath, deselectPath, selectedPaths, path, true);

    const { fileNodes, hiddenFileCount } = useMemo(() => {
        const fileNodes = [];
        let hiddenFileCount = 0;
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
                    selectedPaths={selectedPaths}
                    navigatedToHash={navigatedToHash}
                    onFoundHash={onFoundHash} />);
            else hiddenFileCount++;
        }
        return { fileNodes, hiddenFileCount };
    }, [path, tree, visiblePaths, selectPath, deselectPath, selectedPaths, selected, navigatedToHash, onFoundHash]);

    const directoryNodes = [];
    let hiddenDirectoryCount = 0;
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
                navigatedToHash={navigatedToHash}
                onFoundHash={onFoundHash}
                handleListingError={handleListingError}
            />);
        else hiddenDirectoryCount++;
    }

    const isHash = hash && decodeURIComponent(hash).substring(1) === path;
    const thisNode = useMemo(() => {
        const tryExpand = async () => {
            if(loading || loaded) return;
            await expand();
        }

        const tryCollapse = () => {
            if(error) setError('');
            else onCollapse(path);
        };

        const hashLink = `#${path}`;
        const downloadLink = `/api/Files/Download/${sanitisePath(path)}?archiveFormat=${archiveFormat}`;
        const archiveExtension = {
            [ArchiveFormat.Tar]: '.tar.gz',
            [ArchiveFormat.Zip]: '.zip'
        }[archiveFormat] ?? '';

        return <div className={`${treeNodeClassName} ${pathClassName}`}>
            <Checkbox
                aria-label="Select Directory"
                className={smallClassName}
                disabled={parentSelected}
                checked={selected || parentSelected}
                onChange={toggleSelect} />
            <div className={hashAnchorClassName} id={path}></div>
            {isHash && <Icon className={hashAnchorNodeClassName} name="angle double right" />}
            <span className={`${directoryNodeClassName}${isHash ? ' ' + hashAnchorNodeClassName : ''}`} onClick={loaded || error ? tryCollapse : tryExpand}>
                <Icon name={loaded || loading || error ? 'folder open' : 'folder'} />
                {displayName}&nbsp;
            </span>
            <IconLink aria-label="Download" className={showOnNodeHoverClassName} name="download" href={downloadLink} download={`${displayName}${archiveExtension}`} native />
            <IconLink aria-label="Link" className={showOnNodeHoverClassName} href={hashLink} name="linkify" />
        </div>;
    }, [displayName, isHash, loaded, expand, loading, parentSelected, selected, toggleSelect, path, onCollapse, archiveFormat]);

    let hiddenText = '';
    if(tree && !directoryNodes.length && !fileNodes.length) {
        if(tree.files.length + tree.subdirectories.length) hiddenText = 'No matches';
        else hiddenText = 'Empty';
    } else {
        if(hiddenFileCount) {
            hiddenText += `${hiddenFileCount} file${hiddenFileCount > 1 ? 's' : ''} `;
            if(hiddenDirectoryCount) hiddenText += `and `;
        }
        if(hiddenDirectoryCount) {
            hiddenText += `${hiddenDirectoryCount} director${hiddenDirectoryCount > 1 ? 'ies' : 'y'} `;
        }
        if(hiddenText) hiddenText += 'hidden by filter';
    }

    return <List.Item>
        { thisNode }
        {
            (!loaded && !loading) ? (error && <Message className={underDirectoryClassName} compact error header="Listing Failed" content={error} />) : <List>
                {loading ? <Loader className={underDirectoryClassName} indeterminate active inline size="tiny" /> : <>
                    {
                        (hiddenText) &&
                        <List.Item className={emptyListPlaceholderClassName}>
                            {hiddenText}
                        </List.Item>
                    }
                    {directoryNodes}
                    {fileNodes}
                </>}
            </List>
        }
    </List.Item>;
}

interface DownloadLinkProps {
    href: string;
    fileName: string;
    children?: preact.ComponentChildren;
}

function DownloadLink(props: DownloadLinkProps) {
    const { href, fileName, children } = props;

    const ref = useRef<HTMLAnchorElement>(null);

    const applyDownloadAttribute = useCallback((e) => {
        // User is attempting to open the link in a new tab
        // Quickly set the href to altClickHref so they go to the right place
        ref.current!.download = fileName;
        // Set it back immediately after the browser has done its job
        window.setTimeout(() => ref.current!.download = undefined, 0);
    }, [fileName])

    const onClick = useCallback((e: MouseEvent) => {
        if(!e.ctrlKey) applyDownloadAttribute(e);
    }, [applyDownloadAttribute]);

    const onMouseUp = useCallback((e: MouseEvent) => {
        if(e.button !== 1) applyDownloadAttribute(e);
    }, [applyDownloadAttribute])

    return <a ref={ref} href={href} onClick={onClick} onMouseUp={onMouseUp} native>
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
    navigatedToHash: RefObject<boolean>;
    onFoundHash: () => void;
}

function File(props: FileProps) {
    const {
        path,
        displayName,
        sizeBytes,
        selectPath,
        deselectPath,
        selectedPaths,
        parentSelected,
        navigatedToHash,
        onFoundHash
    } = props;

    const hashLink = `#${path}`;

    const href = `/api/Files/Download/${sanitisePath(path)}`;

    const [hash, _] = useSharedState(hashState);
    const isHash = hash && decodeURIComponent(hash).substring(1) === path;
    useEffect(() => {
        if(navigatedToHash.current) return;
        if (isHash) {
            // Re-set the hash path to trigger autoscroll and CSS highlighting
            window.location.hash = path;
            onFoundHash()
        }
    }, [isHash, path, navigatedToHash, onFoundHash]);

    const { selected, toggleSelect } = useSharedSelection(selectPath, deselectPath, selectedPaths, path, false);

    return <List.Item className={`${treeNodeClassName} ${pathClassName}`}>
        <Checkbox
            aria-label="Select File"
            className={smallClassName}
            disabled={parentSelected}
            checked={selected || parentSelected}
            onChange={toggleSelect} />
        <DownloadLink href={href} fileName={displayName}>
            <div className={hashAnchorClassName} id={path}></div>
            <span className={isHash ? hashAnchorNodeClassName : undefined}>
                {isHash && <Icon className={hashAnchorNodeClassName} name="angle double right" />}
                <Icon name="file" />
                {displayName}&nbsp;
            </span>
        </DownloadLink>
        <span className={fileSizeClassName} >({humaniseBytes(sizeBytes)})&nbsp;</span>
        <IconLink aria-label="Link" className={showOnNodeHoverClassName} href={hashLink} name="linkify" />
    </List.Item>;
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

interface CouldNotFindHashModalProps {
    parsedHash: string;
    open: boolean;
    close: () => void;
}

function CouldNotFindHashModal(props: CouldNotFindHashModalProps) {
    const {
        parsedHash,
        open,
        close
    } = props;

    return <Modal size="tiny" open={open} onClose={close}>
        <Modal.Header>Path Not Found</Modal.Header>
        <Modal.Content>
            <p>Either the path "{parsedHash}" did not exist, or an error occurred</p>
        </Modal.Content>
        <Modal.Actions>
            <Button primary onClick={close}>Resume Browsing</Button>
        </Modal.Actions>
    </Modal>;
}

function Browse() {
    usePageTitle(routes.browseFiles.title);

    const [navigatedToHash, setNavigatedToHash] = useState(true);
    const navigatedToHashRef = useRef(true);
    useEffect(() => {
        if(!!window.location.hash.substring(1)) {
            setNavigatedToHash(false);
            navigatedToHashRef.current = false;
        }
    }, []);
    const onFoundHash = useCallback(() => {
        setNavigatedToHash(true);
        navigatedToHashRef.current = true;
    }, []);

    const [couldNotFindHash, setCouldNotFindHash] = useState('');

    const handleListingError = useCallback((path: string) => {
        if(navigatedToHashRef.current) return;
        const parsedHash = parseHash(window.location.hash);
        if(!path || parsedHash.startsWith(`${path}/`)) {
            setCouldNotFindHash(parsedHash);
            setNavigatedToHash(true);
            navigatedToHashRef.current = true;
        }
    }, []);

    const [archiveFormat, setArchiveFormat] = useSharedState(archiveFormatState);

    const [textFilter, setTextFilter] = useState('');

    const [expandedDirectories, setExpandedDirectories] = useState<Directories>({});
    const addExpandedDirectory = useCallback((d: DirectoryDto, prefix: string) => setExpandedDirectories(expandedDirectories => {
        if(!navigatedToHashRef.current) {
            // Check to see if it's possible to actually reach the hash
            const parsedHash = parseHash(window.location.hash);
            const anyMatchingFiles = !!d.files!.find(f => combinePaths(prefix, f.displayName!) === parsedHash);
            if(!anyMatchingFiles) {
                const anyMatchingDirectories = !!d.subdirectories!.find(d => {
                    const dirPath = combinePaths(prefix, d.displayName!);
                    return dirPath === parsedHash || parsedHash.startsWith(`${dirPath}/`);
                });
                if(!anyMatchingDirectories) {
                    setCouldNotFindHash(parsedHash);
                    setNavigatedToHash(true);
                    navigatedToHashRef.current = true;
                }
            }
        }
        return {
            ...expandedDirectories,
            [prefix]: d
        };
    }), []);
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

    const selectedPathsArray = useMemo(() => Object.keys(selectedPaths), [selectedPaths]);

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
        onCollapse={removeExpandedDirectory}
        navigatedToHash={navigatedToHashRef}
        onFoundHash={onFoundHash}
        handleListingError={handleListingError} />
    , [
        expandedDirectories,
        visiblePaths,
        selectPath,
        deselectPath,
        selectedPathsRef,
        archiveFormat,
        addExpandedDirectory,
        removeExpandedDirectory,
        navigatedToHashRef,
        onFoundHash,
        handleListingError
    ]);

    return <>
        <CenteredSpinner active={!navigatedToHash} />{/* TODO_JU Not sure I like CenteredSpinner here */}
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
        <CouldNotFindHashModal parsedHash={couldNotFindHash} open={!!couldNotFindHash} close={() => setCouldNotFindHash('')} />
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

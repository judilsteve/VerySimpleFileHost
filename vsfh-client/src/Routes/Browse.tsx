import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Container, Grid, Icon, Input, List, Loader, Popup } from "semantic-ui-react";
import { ArchiveFormat, DirectoryDto, FileDto, FilesApi } from "../API";
import { apiConfig } from "../apiInstances";
import CenteredSpinner from "../Components/CenteredSpinner";
import CopyButton from "../Components/CopyButton";
import IconLink from "../Components/IconLink";
import NavHeader from "../Components/NavHeader";
import useEndpointData from "../Hooks/useEndpointData";
import { usePageTitle } from "../Hooks/usePageTitle";
import { useSharedState } from "../Hooks/useSharedState";
import { archiveFormatState } from "../State/sharedState";
import tryHandleError from "../Utils/tryHandleError";

const api = new FilesApi(apiConfig);

const fileSizeStepFactor = 1024;
const fileSizeSuffixes = ["B", "KiB", "MiB", "GiB", "TiB"];

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

interface DirectoryProps {
    path?: string;
    displayName: string;
    expandInitially: boolean;
    pathSeparator: string;
    archiveFormat: ArchiveFormat;
    textFilter: string;
}

// TODO_JU Global tree that each subdirectory writes to (maybe with a reducer) which can be filtered by this
// TODO_JU This might be simpler and more performant as a flat map of { '/absolute/path': DirectoryDto }
// With the latter, there's no nested assignment/rebuilding required when doing a setState, and each Directory
// component can manage its own visibility by scanning any path that startsWith its own
// No to that last part: It's more efficient to still maintain a global set of visible paths:
// - Do a single pass down the flat map of { '/absolute/path': LoadedDirectoryDto }
// - For each DirectoryDto
//   - If the dir is already in the global list of visible paths, bail early (this dir is the parent of another that has already been found to match)
//   - Check the name of the directory itself, names of subdirs, and names of files
//   - If any match, add this dir and all its parent dirs (in ascending order) to the global list of visible paths
//     - If any parent dir is already found in the global list of visible paths, bail early (if the parent is there, then the grandparent and so on must already be there too)
function filterTree(tree: DirectoryDto, filterLowerCase: string) {
    const filteredTree: DirectoryDto = { 
        displayName: tree.displayName,
        subdirectories: [],
        files: tree.files!.filter(f => 
            f.displayName!.toLocaleLowerCase().includes(filterLowerCase))
    };
    for(const subDirectory of tree.subdirectories ?? []) {
        const filteredSubDirectory = filterTree(subDirectory, filterLowerCase);
        if(filteredSubDirectory.displayName!.toLocaleLowerCase().includes(filterLowerCase)
            || filteredSubDirectory.files!.length
            || filteredSubDirectory.subdirectories!.length)
            filteredTree.subdirectories!.push(filteredSubDirectory);
    }
    return filteredTree;
}

function Directory(props: DirectoryProps) {
    const { displayName, path, expandInitially: initialExpanded, pathSeparator, archiveFormat, textFilter } = props;

    const [expanded, setExpanded] = useState(initialExpanded);
    const [tree, setTree] = useState<DirectoryDto | null>(null);
    useEffect(() => {
        setTree(null);
        if(!expanded) return;
        let cancel = false;
        (async () => {
            let newTree;
            try {
                newTree = await api.apiFilesListingGet({ path: path, depth: 1});
            } catch(e) {
                if(!await tryHandleError(e as Response)) {
                    // TODO_JU Handle error
                }
                return;
            } finally {
                if(!cancel) setTree(null);
            }
            if(!cancel) setTree(newTree);
        })();
        return () => { cancel = true; };
    }, [expanded, path]);

    const getHash = () => {
        const loc = window.location;
        return `${loc.origin}${loc.pathname}${loc.search}#${encodeURIComponent(path!)}`;
    };

    let downloadLink = `/api/Files/Download?archiveFormat=${archiveFormat}`;
    if(path) downloadLink += `&path=${encodeURIComponent(path)}`;

    // TODO_JU This won't work, what if a child matches but the parent does not?
    const [filteredSubDirectories, filteredFiles] = useMemo(() => {
        const unfiltered = [tree?.subdirectories!, tree?.files!];
        if(!textFilter) return unfiltered;
        const lowercaseTextFilter = textFilter.toLocaleLowerCase();
        return [
            tree?.subdirectories!?.filter(d => d.displayName!.toLocaleLowerCase().includes(lowercaseTextFilter)),
            tree?.files!?.filter(f => f.displayName!.toLocaleLowerCase().includes(lowercaseTextFilter))
        ];
    }, [tree, textFilter]);

    return <>
        {/*TODO_JU Multi-select checkbox*/}
        <div onClick={() => setExpanded(e => !e)}>
            <Icon fitted name={expanded ? 'folder open' : 'folder'} />
            {displayName}
        </div>
        <Popup trigger={<IconLink name="archive" fitted href={downloadLink} />} content={`Download .${archiveFormat.toLocaleLowerCase()}`} />
        <CopyButton getTextToCopy={getHash} button={<Icon link name="linkify" fitted />} />
        {
            !expanded ? null : !tree ? <Loader indeterminate active inline size="tiny" /> : <List.List>
                {filteredSubDirectories.map(d => <Directory key={d.displayName} {...props} path={`${path ? `${path}${pathSeparator}` : ''}${d.displayName}`} displayName={d.displayName!} expandInitially={false} />)}
                {filteredFiles.map(f => <List.Item>
                    <File key={f.displayName} {...f} basePath={path} pathSeparator={pathSeparator} />
                </List.Item>)}
            </List.List>
        }
    </>;
}

interface FileProps extends FileDto {
    basePath?: string;
    pathSeparator: string;
}

function File(props: FileProps) {
    const { basePath, pathSeparator, displayName, sizeBytes } = props;

    const encodedAbsolutePath = encodeURIComponent(`${basePath ? `${basePath}${pathSeparator}` : ''}${displayName}`);

    const getHash = () => {
        const loc = window.location;
        return `${loc.origin}${loc.pathname}${loc.search}#${encodedAbsolutePath}`;
    };

    return <>
        {/*TODO_JU Multi-select checkbox*/}
        <a style={{ all: 'unset' }} target="_blank" rel="noreferrer"
            href={`/api/Files/Download?path=${encodedAbsolutePath}`}>
            <Icon name="file" />
            {displayName} ({humaniseBytes(sizeBytes!)})
        </a>
        <CopyButton getTextToCopy={getHash} button={<Icon link name="linkify" fitted />} />
    </>;
}

const getPathSeparator = () => api.apiFilesPathSeparatorGet();

declare type DirectoryMap = { [path: string]: DirectoryDto };

function expandDirectory(
    expandedDirectories: DirectoryMap,
    newExpandedDirectory: DirectoryDto,
    path: string) {
    return {
        ...expandedDirectories,
        [path]: newExpandedDirectory
    };
}

function collapseDirectory(
    expandedDirectories: DirectoryMap,
    collapsePath: string) {
    const newDirectories: DirectoryMap = {};
    for(const [path, directory] of Object.entries(expandedDirectories)) {
        if(path !== collapsePath)
            newDirectories[path] = directory;
    }
    return newDirectories;
}

function Browse() {
    usePageTitle('Browse');

    // TODO_JU
    // Text filter
    // Toggle for archive download format
    // Hash parsing

    const [pathSeparator, , ] = useEndpointData(
        getPathSeparator,
        useCallback(async e => {
            if(!await tryHandleError(e as Response)) {
                // TODO_JU Handle error
            }
        }, []));

    const [archiveFormat, setArchiveFormat] = useSharedState(archiveFormatState);

    const [textFilter, setTextFilter] = useState('');

    const [expandedDirectories, setExpandedDirectories] = useState<DirectoryMap>({});
    const expand = useCallback((d: DirectoryDto, p: string) => expandDirectory(expandedDirectories, d, p), [expandedDirectories]);
    const collapse = useCallback((p: string) => collapseDirectory(expandedDirectories, p), [expandedDirectories]);

    // TODO_JU Sticky card for multi-select (show selected count, clear button, and download button)
    return <Container>
        <NavHeader pageTitle="Browse" />
        <Grid stackable>
            <Grid.Column width={13}>
                <Input autoFocus fluid icon="filter" iconPosition="left" placeholder="Filter"
                    value={textFilter} onChange={e => setTextFilter(e.target.value.toLocaleLowerCase())} />
            </Grid.Column>
            <Grid.Column width={3}>
                <Button.Group fluid style={{ height: '100%' }}>
                    <Button secondary active={archiveFormat === ArchiveFormat.Tar} onClick={() => setArchiveFormat(ArchiveFormat.Tar)}>Tar</Button>
                    <Button secondary active={archiveFormat === ArchiveFormat.Zip} onClick={() => setArchiveFormat(ArchiveFormat.Zip)}>Zip</Button>
                </Button.Group>
            </Grid.Column>
        </Grid>
        { !pathSeparator ? <CenteredSpinner /> : <List>
            <Directory textFilter={textFilter} displayName="<root>" expandInitially={true} pathSeparator={pathSeparator} archiveFormat={archiveFormat} expand={expand} collapse={collapse} />
        </List>}
    </Container>;
}

export default Browse;

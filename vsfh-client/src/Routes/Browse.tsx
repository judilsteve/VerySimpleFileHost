import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Container, Grid, Icon, Input, List, Loader, Popup } from "semantic-ui-react";
import { ArchiveFormat, DirectoryDto, FileDto, FilesApi } from "../API";
import { apiConfig } from "../apiInstances";
import CopyButton from "../Components/CopyButton";
import IconLink from "../Components/IconLink";
import NavHeader from "../Components/NavHeader";
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
    path: string;
    displayName: string;
    expandInitially: boolean;
    archiveFormat: ArchiveFormat;
    visiblePaths: Set<string>;
    addLoadedPaths: (d: DirectoryDto, prefix: string) => void;
    removeLoadedPaths: (prefix: string) => void;
}

function Directory(props: DirectoryProps) {
    const {
        displayName,
        path,
        expandInitially,
        archiveFormat,
        visiblePaths,
        addLoadedPaths,
        removeLoadedPaths
    } = props;

    const [expanded, setExpanded] = useState(expandInitially);
    const [tree, setTree] = useState<DirectoryDto | null>(null);
    useEffect(() => { // TODO_JU This shouldn't be an effect; we could end up with duplicate paths in loadedPaths
        setTree(null);
        if(!expanded) {
            removeLoadedPaths(path);
            return;
        }
        let cancel = false;
        (async () => {
            let newTree;
            try {
                newTree = await api.apiFilesListingPathGet({ path: path, depth: 1});
            } catch(e) {
                if(!await tryHandleError(e as Response)) {
                    // TODO_JU Handle error
                }
                return;
            } finally {
                if(!cancel) setTree(null);
            }
            if(!cancel) {
                setTree(newTree);
                addLoadedPaths(newTree, path);
            }
        })();
        return () => { cancel = true; };
    }, [expanded, path, addLoadedPaths, removeLoadedPaths]);

    const getHash = () => {
        const loc = window.location;
        return `${loc.origin}${loc.pathname}${loc.search}#${encodeURIComponent(path)}`;
    };

    let downloadLink = `/api/Files/Download${path}?archiveFormat=${archiveFormat}`;

    return <div id={path} style={visiblePaths.has(path) ? undefined : { display: "none" }}>
        {/*TODO_JU Multi-select checkbox*/}
        <div onClick={() => setExpanded(e => !e)}>
            <Icon fitted name={expanded ? 'folder open' : 'folder'} />
            {displayName}
        </div>
        <Popup trigger={<IconLink name="archive" fitted href={downloadLink} />} content={`Download .${archiveFormat.toLocaleLowerCase()}`} />
        <CopyButton getTextToCopy={getHash} button={<Icon link name="linkify" fitted />} />
        {
            !expanded ? null : !tree ? <Loader indeterminate active inline size="tiny" /> : <List.List>
                {tree.subdirectories!.map(d => <Directory
                    {...props}
                    key={d.displayName}
                    path={`${path}/${d.displayName}`}
                    displayName={d.displayName!}
                    expandInitially={false} />)}
                {tree.files!.map(f => <List.Item>
                    <File
                        key={f.displayName}
                        {...f}
                        basePath={path}
                        visiblePaths={visiblePaths} />
                </List.Item>)}
            </List.List>
        }
    </div>;
}

interface FileProps extends FileDto {
    basePath?: string;
    visiblePaths: Set<string>;
}

function File(props: FileProps) {
    const { basePath, displayName, sizeBytes, visiblePaths } = props;
    const path = `${basePath}/${displayName}`;

    const getHash = () => {
        const loc = window.location;
        return `${loc.origin}${loc.pathname}${loc.search}#${path}`;
    };

    return <div id={path} style={visiblePaths.has(path) ? undefined : { display: "none" }}>
        {/*TODO_JU Multi-select checkbox*/}
        {/*TODO_JU Replace the single download button with one for download and one for open (in new tab) */}
        <a style={{ all: 'unset' }} target="_blank" rel="noreferrer"
            href={`/api/Files/Download${path}`}>
            <Icon name="file" />
            {displayName} ({humaniseBytes(sizeBytes!)})
        </a>
        <CopyButton getTextToCopy={getHash} button={<Icon link name="linkify" fitted />} />
    </div>;
}

function Browse() {
    usePageTitle('Browse');

    const [archiveFormat, setArchiveFormat] = useSharedState(archiveFormatState);

    const [textFilter, setTextFilter] = useState('');

    const [loadedPaths, setLoadedPaths] = useState<string[]>([]);
    const addLoadedPaths = useCallback((d: DirectoryDto, prefix: string) => setLoadedPaths(loadedPaths => [
        ...loadedPaths,
        ...d.files!.map(f => `${prefix}/${f.displayName}`),
        ...d.subdirectories!.map(d => `${prefix}/${d.displayName}`)
    ]), []);
    const removeLoadedPaths = useCallback((prefix: string) => setLoadedPaths(loadedPaths => 
        loadedPaths.filter(p => !p.startsWith(`${prefix}/`))),
    []);

    const visiblePaths = useMemo(() => {
        if(!textFilter) return new Set(loadedPaths);
        const filteredPaths = new Set<string>();
        for(let path in loadedPaths) {
            if(!path.includes(textFilter)) {
                // This path has already been granted visibility by a match in one of its child paths
                // There is nothing to do here
                continue;
            }
            // If a path matches the filter and should be visible,
            // then all its parent paths must be made visible too
            while(path) {
                if(filteredPaths.has(path)) break;
                filteredPaths.add(path);
                path = path.substring(0, path.lastIndexOf('/'))
            }
        }
    }, [textFilter, loadedPaths]);

    // TODO_JU Sticky card for multi-select (show selected list/count, clear button, and download button)
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
        <List>
            <Directory
                visiblePaths={visiblePaths!}
                displayName="<root>"
                path=""
                expandInitially={true}
                archiveFormat={archiveFormat}
                addLoadedPaths={addLoadedPaths}
                removeLoadedPaths={removeLoadedPaths} />
        </List>
    </Container>;
}

export default Browse;

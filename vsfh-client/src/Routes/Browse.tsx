import { ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button, Container, Grid, Icon, Input, List, Loader } from "semantic-ui-react";
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

function combinePaths(...paths: string[]) {
    return paths.reduce((p, next) => p ? `${p}/${next}` : next);
}

interface DirectoryProps {
    path: string;
    displayName: string;
    archiveFormat: ArchiveFormat;
    visiblePaths: Set<string>;
    addLoadedPaths: (d: DirectoryDto, prefix: string) => void;
    removeLoadedPaths: (prefix: string) => void;
}

interface DirectoryRef {
    expandTo: (path: string) => Promise<void>;
}

// TODO_JU Files and directories need consistent hover highlighting/cursor behaviour
// TODO_JU Could probably avoid all or some of this imperative bs by doing something in the vein of useEffect(expandTree, [useLocation().hash])
function ForwardingDirectory(props: DirectoryProps, ref: ForwardedRef<DirectoryRef | undefined>) {
    const {
        displayName,
        path,
        archiveFormat,
        visiblePaths,
        addLoadedPaths,
        removeLoadedPaths
    } = props;

    console.log(`Rendering directory ${path}`);

    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tree, setTree] = useState<DirectoryDto | null>(null);
    const isMounted = useIsMounted();
    // TODO_JU Test spamming the button
    // TODO_JU Allow user to cancel loading: https://reactjs.org/docs/hooks-faq.html#is-there-something-like-instance-variables
    const expand = useCallback(async () => {
        if(loading || expanded) return;
        setLoading(true); setTree(null); setExpanded(true);
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
        if(!isMounted.current) return;
        setTree(newTree);
        addLoadedPaths(newTree, path);
    }, [loading, expanded, isMounted, addLoadedPaths, path]);

    useImperativeHandle(ref, () => ({
        expandTo: async () => console.debug('TODO_JU')
    }));

    const collapse = () => {
        if(loading || !expanded) return;
        setExpanded(false);
        removeLoadedPaths(path);
    };

    const loc = window.location;
    const hash = `${loc.pathname}${loc.search}#${path}`;
    const downloadLink = `/api/Files/Download/${path}?archiveFormat=${archiveFormat}`;

    // TODO_JU Make it not ugly
    return <div style={(!path || visiblePaths.has(path)) ? undefined : { display: "none" }}>
        <List.Item>
            {/*TODO_JU Multi-select checkbox (maybe fades in and out on hover [of parent]?)*/}
            <div style={{ display: 'inline' }} onClick={expanded ? collapse : expand}>
                <Icon fitted name={expanded ? 'folder open' : 'folder'} />
                <span className="anchor" id={path}>{displayName}</span>
            </div>
            {/*TODO_JU maybe these fade in and out on hover?*/}
            <IconLink name="download" fitted href={downloadLink} />
            <IconLink href={hash} name="linkify" fitted />
            {
                !expanded ? <></> : <List.List>
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

const Directory = forwardRef(ForwardingDirectory);

interface FileProps extends FileDto {
    basePath: string;
    visiblePaths: Set<string>;
}

function File(props: FileProps) {
    const { basePath, displayName, sizeBytes, visiblePaths } = props;
    const path = combinePaths(basePath, displayName!);

    const loc = window.location;
    const hash = `${loc.pathname}${loc.search}#${path}`;

    // TODO_JU Make it not ugly
    return <div style={visiblePaths.has(path) ? undefined : { display: "none" }}>
        <List.Item>
            {/*TODO_JU Multi-select checkbox (maybe fades in and out on hover [of parent]?)*/}
            {/*TODO_JU Use onClick trickery to download as attachment on regular click, but do a plain open on ctrl/middle click or "open in new tab"*/}
            <a target="_blank" rel="noreferrer"
                href={`/api/Files/Download/${path}`}>
                <Icon name="file" />
                <span className="anchor" id={path}>{displayName}</span> ({humaniseBytes(sizeBytes!)})
            </a>
            <IconLink href={hash} name="linkify" fitted />
        </List.Item>
    </div>;
}

function Browse() {
    usePageTitle('Browse');

    const [archiveFormat, setArchiveFormat] = useSharedState(archiveFormatState);

    const [textFilter, setTextFilter] = useState('');

    // TODO_JU Parse hash and expand tree as required
    // Then need to do `window.location.hash = window.location.hash` to activate :target styling

    const [loadedPaths, setLoadedPaths] = useState<string[]>([]);
    const addLoadedPaths = useCallback((d: DirectoryDto, prefix: string) => setLoadedPaths(loadedPaths => [
        ...loadedPaths,
        ...d.files!.map(f => combinePaths(prefix, f.displayName!)),
        ...d.subdirectories!.map(d => combinePaths(prefix, d.displayName!))
    ]), []);
    const removeLoadedPaths = useCallback((prefix: string) => setLoadedPaths(loadedPaths =>
        loadedPaths.filter(p => !p.startsWith(`${prefix}/`))), []);

    // TODO_JU Text box is unresponsive when filtering large trees
    // Profiling shows that filtering the path list is *not* the bottleneck; it's the re-rendering
    // Maybe need to look at doing serverside filtering or just a debounce; depends how it runs in a prod build
    const visiblePaths = useMemo(() => {
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
    }, [textFilter, loadedPaths]);

    const expander = useRef<DirectoryRef>();

    useEffect(() => {
        expander.current!.expandTo(window.location.hash);
    }, []);

    // TODO_JU Sticky card for multi-select (show selected list/count, clear button, and download button)
    return <Container>
        <NavHeader pageTitle="Browse" />
        <Grid stackable>
            <Grid.Column width={13}>
                <Input autoFocus fluid icon="filter" iconPosition="left" placeholder="Filter"
                    value={textFilter} onChange={e => setTextFilter(e.target.value)} />
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
                ref={expander}
                visiblePaths={visiblePaths!}
                displayName="<root>"
                path=""
                archiveFormat={archiveFormat}
                addLoadedPaths={addLoadedPaths}
                removeLoadedPaths={removeLoadedPaths} />
        </List>
    </Container>;
}

export default Browse;

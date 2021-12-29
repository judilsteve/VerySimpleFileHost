import { useEffect, useState } from "react";
import { Container, Icon, List, Loader } from "semantic-ui-react";
import { ArchiveFormat, DirectoryDto, FileDto, FilesApi } from "../API";
import { apiConfig } from "../apiInstances";
import CopyButton from "../Components/CopyButton";
import IconLink from "../Components/IconLink";
import NavHeader from "../Components/NavHeader";
import useErrorHandler from "../Hooks/useErrorHandler";
import { usePageTitle } from "../Hooks/usePageTitle";

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
    initialExpanded: boolean;
    pathSeparator: string;
    archiveFormat: ArchiveFormat;
}

function Directory(props: DirectoryProps) {
    const { displayName, path, initialExpanded, pathSeparator, archiveFormat } = props;

    const [expanded, setExpanded] = useState(initialExpanded);
    const [tree, setTree] = useState<DirectoryDto | null>(null);
    const errorHandler = useErrorHandler();
    useEffect(() => {
        setTree(null);
        if(!expanded) return;
        let cancel = false;
        (async () => {
            let newTree;
            try {
                newTree = await api.apiFilesListingGet({ path: path, depth: 1});
            } catch(e) {
                if(!await errorHandler(e as Response)) {
                    // TODO_JU Handle error
                }
                return;
            } finally {
                if(!cancel) setTree(null);
            }
            if(!cancel) setTree(newTree);
        })();
        return () => { cancel = true; };
    }, [expanded, errorHandler, path]);

    const getHash = () => {
        const loc = window.location;
        return `${loc.origin}${loc.pathname}${loc.search}#${encodeURIComponent(path!)}`;
    };

    let downloadLink = `/api/Files/Download?archiveFormat=${archiveFormat}`;
    if(path) downloadLink += `&path=${encodeURIComponent(path)}`;

    return <>
        {/*TODO_JU Multi-select checkbox*/}
        <div onClick={() => setExpanded(e => !e)}>
            <Icon fitted name={expanded ? 'folder open' : 'folder'} />
            {displayName}
        </div>
        <IconLink name="archive" fitted href={downloadLink} />
        <CopyButton getTextToCopy={getHash} button={<Icon link name="linkify" fitted />} />
        {
            !expanded ? null : !tree ? <Loader indeterminate active inline size="tiny" /> : <List.List>
                {tree.subdirectories!.map(d => <Directory key={d.displayName} {...props} path={`${path ? `${path}${pathSeparator}` : ''}${d.displayName}`} displayName={d.displayName!} initialExpanded={false} />)}
                {tree.files!.map(f => <List.Item>
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

function Browse() {
    usePageTitle('Browse');

    // TODO_JU
    // Text filter
    // Toggle for archive download format
    // Hash parsing

    // TODO_JU Sticky card for multi-select (show selected count, clear button, and download button)
    return <Container>
        <NavHeader pageTitle="Browse" />
        TODO_JU Do not hardcode path separator or archive format
        <List>
            <Directory displayName="<root>" initialExpanded={true} pathSeparator="/" archiveFormat={ArchiveFormat.Tar} />
        </List>
    </Container>;
}

export default Browse;

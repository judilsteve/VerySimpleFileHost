import { useCallback } from "react";
import { Container, Icon, List, Loader } from "semantic-ui-react";
import { ArchiveFormat, FilesApi } from "../API";
import { apiConfig } from "../apiInstances";
import IconLink from "../Components/IconLink";
import NavHeader from "../Components/NavHeader";
import useEndpointData from "../Hooks/useEndpointData";
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


function Browse() {
    usePageTitle('Browse');

    // TODO_JU
    // Text filter
    // Toggle for archive download format
    // Hash parsing

    const [tree, treeLoading, reloadTree] = useEndpointData(
        useCallback(() => api.filesListingGet({ depth: 1 }), []),
        useCallback(e => {
            // TODO_JU Handle error
        }, [])
    );

    const fileList = treeLoading ? <Loader indeterminate /> : <List size="large">
        {
            // TODO_JU In one line:
            // - Multi-select checkbox
            // - "folder [open]" icon (toggles expand when clicked)
            // - Name (toggles expand when clicked) (highlight matching text portion?)
            // - Archive icon (archive download link with popup for "Download as (tar|zip)")
            // - "linkify" icon (copies hash URL to clipboard when clicked)
            tree!.subdirectories?.map(d => <List.Item key={d.displayName}>
                {/* TODO_JU Checkboxes for multi-select */}
                
                <Icon fitted name="folder" />
                {d.displayName}
                <IconLink name="archive" fitted href={`${window.location.origin}/Files/Download?path=${encodeURIComponent(d.displayName!)}&archiveFormat=${ArchiveFormat.Tar}`} newTab />
            </List.Item>)
        }
        {
            // TODO_JU In one line:
            // - Multi-select checkbox
            // - "file" icon (download link)
            // - Name (download link) (highlight matching text portion?)
            // - "linkify" icon (copies hash URL to clipboard when clicked)
            tree!.files?.map(f => <List.Item key={f.displayName}>
                <List.Icon name="file" />
                <List.Content>{f.displayName} ({humaniseBytes(f.sizeBytes!)})</List.Content>
            </List.Item>)
        }
    </List>

    // TODO_JU Sticky card for multi-select (show selected count, clear button, and download button)
    return <Container>
        <NavHeader pageTitle="Browse" />
        {fileList}
    </Container>;
}

export default Browse;

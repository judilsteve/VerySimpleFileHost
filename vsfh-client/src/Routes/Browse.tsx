import { useCallback } from "react";
import { Icon, List, Loader } from "semantic-ui-react";
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
            tree!.subdirectories?.map(d => <List.Item>
                <Icon fitted name="folder" /> {/* TODO_JU Change to "folder open" when expanded */}
                {d.displayName /* TODO_JU Make this the link and/or the expand button for easier clicking? */}
                <IconLink name="download" fitted href={`${window.location.origin}/Files/Download?path=${encodeURIComponent(d.displayName!)}&archiveFormat=${ArchiveFormat.Tar}`} newTab />
            </List.Item>)
        }
        {
            tree!.files?.map(f => <List.Item>
                <List.Icon name="file" />
                <List.Content>{f.displayName} ({humaniseBytes(f.sizeBytes!)})</List.Content>
            </List.Item>)
        }
    </List>

    return <div style={{ marginLeft: "1em", marginRight: "1em" }}>
        <NavHeader pageTitle="Browse" />
        {fileList}
    </div>;
}

export default Browse;

using VerySimpleFileHost.Configuration;

namespace VerySimpleFileHost.Utils;

public static class PathUtils
{
    public static bool IsVisible(FileSystemInfo fileSystemInfo, FilesConfiguration config) =>
        IsVisible(fileSystemInfo.Attributes, config);

    private static bool IsVisible(FileAttributes fileAttributes, FilesConfiguration config)
    {
        if(fileAttributes.HasFlag(FileAttributes.Hidden)
            && !config.IncludeHiddenFilesAndDirectories)
            return false;
        if(fileAttributes.HasFlag(FileAttributes.System)
            && !config.IncludeSystemFilesAndDirectories)
            return false;
        return true;
    }

    public static bool ExistsAndIsVisible(string absolutePath, FilesConfiguration config, out bool isDirectory)
    {
        if(!absolutePath.StartsWith(config.RootSharedDirectory))
        {
            // This likely happened because the user is being cheeky and put ".."
            // in their requested path to try and escape the root shared directory
            isDirectory = false;
            return false;
        }

        FileAttributes attributes;
        try
        {
            attributes = System.IO.File.GetAttributes(absolutePath);
        }
        catch(FileNotFoundException)
        {
            isDirectory = false;
            return false;
        }
        catch(DirectoryNotFoundException)
        {
            isDirectory = false;
            return false;
        }
        // TODO_JU Catch read permission errors here
        isDirectory = attributes.HasFlag(FileAttributes.Directory);
        return IsVisible(attributes, config);
    }
}
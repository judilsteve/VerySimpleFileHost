using VerySimpleFileHost.Configuration;

namespace VerySimpleFileHost.Utils;

public static class PathUtils
{
    private static EnumerationOptions GetEnumerationOptions(FilesConfiguration config)
    {
        var enumerationOptions = new EnumerationOptions
        {
            IgnoreInaccessible = true
        };
        if(!config.IncludeHiddenFilesAndDirectories)
            enumerationOptions.AttributesToSkip |= FileAttributes.Hidden;
        if(!config.IncludeSystemFilesAndDirectories)
            enumerationOptions.AttributesToSkip |= FileAttributes.System;
        return enumerationOptions;
    }

    public static IEnumerable<FileInfo> EnumerateAccessibleFiles(this DirectoryInfo directoryInfo, FilesConfiguration config)
    {
        return directoryInfo.EnumerateFiles("*", GetEnumerationOptions(config));
    }

    public static IEnumerable<DirectoryInfo> EnumerateAccessibleDirectories(this DirectoryInfo directoryInfo, FilesConfiguration config)
    {
        return directoryInfo.EnumerateDirectories("*", GetEnumerationOptions(config));
    }

    public static bool ExistsAndIsAccessible(this string absolutePath, FilesConfiguration config, out bool isDirectory)
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
        catch(UnauthorizedAccessException)
        {
            isDirectory = false;
            return false;
        }

        isDirectory = attributes.HasFlag(FileAttributes.Directory);

        if(attributes.HasFlag(FileAttributes.Hidden) && !config.IncludeHiddenFilesAndDirectories)
            return false;
        if(attributes.HasFlag(FileAttributes.System) && !config.IncludeSystemFilesAndDirectories)
            return false;

        return true;
    }
}
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "path";
import crypto from "node:crypto"; // Added crypto for file hashing

type TSyncFilesAndFoldersV2Params = {
    sourceDirPath: string;
    targetDirPath: string;
    fileNamePatterns?: string[];
    deleteExtraFilesInTarget?: boolean;
};

// Define file details types at module level for consistency
type TFileDetails = {
    [fileName: string]: {
        sourceFilePath: string;
        mtime: number;
        localDate: string;
        hash?: string; // Hash property to store file content hash
    };
};

type TFileDetailsEntry = {
    sourceFilePath: string;
    mtime: number;
    fileName: string;
    hash: string; // Include hash in the entry type
};

// Utility function to calculate file hash
async function getFileHash(filePath: string): Promise<string> {
    try {
        const fileBuffer = await fsPromises.readFile(filePath);
        const hashSum = crypto.createHash('sha1');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (error: any) {
        console.error(`Error calculating hash for file ${filePath}:`, error);
        throw new Error(`Failed to calculate file hash: ${error.message}`);
    }
}

export async function syncFilesAndFolders({
    sourceDirPath,
    targetDirPath,
    fileNamePatterns = [],
    deleteExtraFilesInTarget = true,
}: TSyncFilesAndFoldersV2Params) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDirPath)) {
        try {
            await fsPromises.mkdir(targetDirPath, { recursive: true });
        } catch (error: any) {
            console.error(`Error creating target directory ${targetDirPath}:`, error);
            throw new Error(`Failed to create target directory: ${error.message}`);
        }
    }    // Load or initialize JSON file to store file details
    const jsonFilePath = path.join(targetDirPath, "file_details.json");

    let fileDetails: TFileDetails = {};
    let initialFileDetails: TFileDetails = {};
      if (fs.existsSync(jsonFilePath)) {
        try {
            const fileContent = await fsPromises.readFile(jsonFilePath, "utf8");
            // Handle empty file case
            if (fileContent.trim() === '') {
                fileDetails = {};
            } else {
                fileDetails = JSON.parse(fileContent);
            }
            initialFileDetails = { ...fileDetails };
        } catch (error) {
            console.error(`Error reading or parsing ${jsonFilePath}:`, error);
            // Reset file details if there's an error
            fileDetails = {};
            initialFileDetails = {};
            // Create a valid JSON file
            await fsPromises.writeFile(jsonFilePath, "{}");
        }    } else {
        await fsPromises.writeFile(jsonFilePath, "{}");
    }
      async function updateFileDetails({ fileName, sourceFilePath, mtime, hash }: TFileDetailsEntry) {
        // const stats = await fsPromises.stat(sourceFilePath);
        fileDetails[fileName] = {
            sourceFilePath,
            mtime,
            localDate: new Date(mtime).toLocaleString(),
            hash, // Store the hash in file details
        };

        if (
            JSON.stringify(fileDetails) !== JSON.stringify(initialFileDetails)
        ) {
            try {
                await fsPromises.writeFile(
                    jsonFilePath,
                    JSON.stringify(fileDetails, null, 2)
                );
            } catch (error: any) {
                console.error(`Error writing to file ${jsonFilePath}:`, error);
                // Continue execution since this is not critical
            }
        }
    }// Traverse through source directory
    let filesInSource;
    try {
        filesInSource = await fsPromises.readdir(sourceDirPath);
    } catch (error: any) {
        console.error(`Error reading directory ${sourceDirPath}:`, error);
        throw new Error(`Failed to read source directory: ${error.message}`);
    }
    
    for (const fileName of filesInSource) {
        const sourcePath = path.join(sourceDirPath, fileName);
        const targetPath = path.join(targetDirPath, fileName);        let stats;
        try {
            stats = await fsPromises.lstat(sourcePath);
        } catch (error: any) {
            console.error(`Error getting stats for ${sourcePath}:`, error);
            continue; // Skip this file/directory and move to next one
        }
        if (stats.isDirectory()) {
            // Recursively sync directories
            await syncFilesAndFolders({
                sourceDirPath: sourcePath,
                targetDirPath: targetPath,
                fileNamePatterns,
                deleteExtraFilesInTarget,
            });
        } else {
            // Check if file matches patterns
            if (
                fileNamePatterns.length === 0 ||
                fileNamePatterns.some((pattern) => fileName.includes(pattern))
            ) {                // Get source file hash and modified time
                let sourceStats;
                let sourceFileModifiedTime;
                let sourceFileHash;
                
                try {
                    sourceStats = await fsPromises.stat(sourcePath);
                    sourceFileModifiedTime = sourceStats.mtime.getTime();
                    sourceFileHash = await getFileHash(sourcePath);
                } catch (error: any) {
                    console.error(`Error getting file information for ${sourcePath}:`, error);
                    continue; // Skip this file and move to the next one
                }

                // Check if file exists in target and if it's modified or new
                const targetExists = fs.existsSync(targetPath);
                
                if (
                    !targetExists ||
                    !fileDetails[fileName] ||
                    !fileDetails[fileName]?.hash || // If hash doesn't exist (backwards compatibility)
                    fileDetails[fileName]?.hash !== sourceFileHash // Primary check: compare file hashes
                ) {                    // Copy or replace the file in the target directory
                    try {
                        await fsPromises.copyFile(sourcePath, targetPath);
                        console.log(
                            `Copied file: ${path.relative(sourceDirPath, sourcePath)}`
                        );
                    } catch (error: any) {
                        console.error(`Error copying file from ${sourcePath} to ${targetPath}:`, error);
                        // Continue with other files even if one fails
                    }
                    
                    // Update file details with hash included
                    await updateFileDetails({
                        fileName,
                        sourceFilePath: sourcePath,
                        mtime: sourceFileModifiedTime,
                        hash: sourceFileHash,
                    });
                }
            }
        }
    }

    async function cleanUpFilesAndDirs(fileDetails: TFileDetails, targetDir: string) {
        // Iterate over fileDetails to check if source paths exist
        for (const [fileName, detail] of Object.entries(fileDetails)) {
            const sourceFilePath = detail.sourceFilePath
            const targetFilePath = path.join(targetDir, fileName);

            // Check if the source file exists
            const sourceExists = fs.existsSync(sourceFilePath);
            if (!sourceExists) {                // Delete the file from the target directory
                if (fs.existsSync(targetFilePath)) {
                    try {
                        await fsPromises.unlink(targetFilePath);
                        // console.log(`Deleted target file: ${targetFilePath}`);
                    } catch (error: any) {
                        console.error(`Error deleting file ${targetFilePath}:`, error);
                        // Continue with other files even if deletion fails
                    }
                }

                // Delete the file entry from fileDetails
                delete fileDetails[fileName];
            }
        }        if (
            JSON.stringify(fileDetails) !== JSON.stringify(initialFileDetails)
        ) {
            try {
                await fsPromises.writeFile(
                    jsonFilePath,
                    JSON.stringify(fileDetails, null, 2)
                );
            } catch (error: any) {
                console.error(`Error writing to file ${jsonFilePath} in cleanup:`, error);
                // Continue execution since this is not critical
            }
        }
    }

    // Check for files in target directory that are not in source directory
    if (deleteExtraFilesInTarget) {
        await cleanUpFilesAndDirs(fileDetails, targetDirPath);
    }
}

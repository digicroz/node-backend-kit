import fs from "fs";
import { join } from "path";

import { createZodFiles } from "./moduleZodCreator.js";
import { syncFilesAndFolders } from "./syncProjectCommons.js";
import { createModuleFiles } from "./moduleFileCreator.js";
import { checkModuleRecords } from "./checkModuleRecords.js";
import { checkModuleZodRecords } from "./checkModuleZodRecords.js";
import { getTsFiles, updateImports } from "./stripExtensions.js";
import { TNbkProject } from "../types.js";

export const b2fPortalInit = async (b2fPortalProjects: TNbkProject[]) => {
  console.log("------------nbk Started-------------");

  let clientRootDirPath = process.cwd();
  //    console.log({clientRootDirPath});

  const srcDirPath = join(clientRootDirPath, "src");
  const distDirPath = join(clientRootDirPath, "dist");

  for (const project of b2fPortalProjects) {
    const serverB2fPath = join(srcDirPath, "serverB2f");
    // console.log('serverB2fPath', serverB2fPath);
    if (!fs.existsSync(serverB2fPath)) {
      console.log("serverB2fPath does not exist");
      console.log({ serverB2fPath });

      return;
    }

    const projectSrcPath = join(srcDirPath, project.projectBaseDirPath);
    // console.log('projectSrcpath', projectSrcPath);
    if (!fs.existsSync(projectSrcPath)) {
      console.log("projectSrcPath does not exist");
      console.log({ projectSrcPath });

      return;
    }
    const projectDistPath = join(distDirPath, project.projectBaseDirPath);
    // console.log('projectDistPath', projectDistPath);
    if (!fs.existsSync(projectDistPath)) {
      console.log("projectDistPath does not exist");
      console.log({ projectDistPath });
      return;
    }

    const projectPrismaClientPath = join(
      clientRootDirPath,
      "prisma",
      project.projectName,
      "generatedClient"
    );
    if (!fs.existsSync(projectPrismaClientPath)) {
      console.log("projectPrismaClientPath does not exist");
      console.log({ projectPrismaClientPath });
      return;
    }

    const projectB2fPath = join(projectSrcPath, "projectB2f");

    if (!fs.existsSync(projectB2fPath)) {
      console.log("projectB2fPath does not exist");
      console.log({ projectB2fPath });

      return;
    }

    if (project.sections.length === 0) {
      console.log("no sections in " + project.projectName);
      return;
    }

    for (const section of project.sections) {
      const sectionSrcPath = join(projectSrcPath, section.localPath);
      const sectionDistPath = join(projectDistPath, section.localPath);
      if (!fs.existsSync(sectionSrcPath)) {
        console.log("sectionSrcPath does not exist");
        console.log({ sectionSrcPath });
        return;
      }
      if (!fs.existsSync(sectionDistPath)) {
        console.log("sectionDistPath does not exist");
        console.log({ sectionDistPath });
        return;
      }

      const sectionB2fPath = join(sectionSrcPath, "sectionB2f");
      if (!fs.existsSync(sectionB2fPath)) {
        console.log("sectionB2fPath does not exist");
        console.log({ sectionB2fPath });
        return;
      }

      const sectionSrcTrpcApiPath = join(sectionSrcPath, "trpcApi");
      if (!fs.existsSync(sectionSrcTrpcApiPath)) {
        console.log("sectionSrcTrpcApiPath does not exist");
        console.log({ sectionSrcTrpcApiPath });
        return;
      }
      const sectionSrcTrpcApiModulePath = join(
        sectionSrcTrpcApiPath,
        "modules"
      );
      if (!fs.existsSync(sectionSrcTrpcApiModulePath)) {
        console.log("sectionSrcTrpcApiModulePath does not exist");
        console.log({ sectionSrcTrpcApiModulePath });
        return;
      }

      const sectionDistTrpcApiPath = join(sectionDistPath, "trpcApi");
      // console.log('sectionDistTrpcApiPath', sectionDistTrpcApiPath);

      if (!fs.existsSync(sectionDistTrpcApiPath)) {
        console.log("sectionDistTrpcApiPath does not exist");
        console.log({ sectionDistTrpcApiPath });
        return;
      }

      const sectionTrpcRouterTypesDeclarationPath = join(
        sectionDistPath,
        "trpcApi",
        "trpcRouter.d.ts"
      );
      if (!fs.existsSync(sectionTrpcRouterTypesDeclarationPath)) {
        console.log("sectionTrpcRouterTypesDeclarationPath does not exist");
        console.log({ sectionTrpcRouterTypesDeclarationPath });
        return;
      }

      const repositoryPath = join(clientRootDirPath, section.repository.path);
      if (!fs.existsSync(repositoryPath)) {
        console.log("repositoryPath does not exist");
        console.log({ repositoryPath });
        return;
      }

      if (!fs.existsSync(join(repositoryPath, ".git"))) {
        console.log("repositoryPath does not have .git");
        console.log({ repositoryPath });
        return;
      }
      const repositoryPackageJsonPath = join(repositoryPath, "package.json");
      if (!fs.existsSync(repositoryPackageJsonPath)) {
        console.log("repositoryPackageJsonPath does not exist");
        console.log({ repositoryPackageJsonPath });
        return;
      }
      const repositoryPackageJson = JSON.parse(
        fs.readFileSync(repositoryPackageJsonPath, "utf8")
      );
      if (!repositoryPackageJson.name) {
        console.log("repositoryPackageJson.name does not exist");
        console.log({ repositoryPackageJson });
        return;
      }
      if (repositoryPackageJson.name !== section.repository.name) {
        console.log("repositoryPackageJson.name does not match ");
        console.log({
          requiredName: section.repository.name,
          repositoryName: repositoryPackageJson.name,
        });
        return;
      }

      const repositoryBackedPortalDirPath = join(
        repositoryPath,
        section.repository.dirPath || "b2fPortal"
      );
      if (!fs.existsSync(repositoryBackedPortalDirPath)) {
        console.log("repositoryBackedPortalPath does not exist");
        console.log({
          repositoryBackedPortalPath: repositoryBackedPortalDirPath,
        });
        return;
      }
      const repositoryDistTrpcApiPath = join(
        repositoryBackedPortalDirPath,
        sectionDistTrpcApiPath.replace(clientRootDirPath, "")
      );

      const repositoryPrismaClientPath = join(
        repositoryBackedPortalDirPath,
        projectPrismaClientPath.replace(clientRootDirPath, "")
      );

      createModuleFiles(sectionSrcTrpcApiModulePath);
      // create zod files
      createZodFiles(sectionSrcTrpcApiModulePath);

      // check trpcRouterRecords and zodSchemas
      try {
        checkModuleRecords(sectionSrcTrpcApiPath);
        checkModuleZodRecords(sectionSrcTrpcApiPath);
      } catch (error) {
        console.warn(error);
      }

      // sync serverB2f
      const repositoryServerB2fPath = join(
        repositoryBackedPortalDirPath,
        "serverB2f"
      );

      await syncFilesAndFolders({
        sourceDirPath: serverB2fPath,
        targetDirPath: repositoryServerB2fPath,
      });

      // sync projectB2f
      const repositoryProjectB2fPath = join(
        repositoryBackedPortalDirPath,
        "projectB2f"
      );

      await syncFilesAndFolders({
        sourceDirPath: projectB2fPath,
        targetDirPath: repositoryProjectB2fPath,
      });

      // sync section common
      const repositorySectionB2fPath = join(
        repositoryBackedPortalDirPath,
        section.sectionName,
        "sectionB2f"
      );

      await syncFilesAndFolders({
        sourceDirPath: sectionB2fPath,
        targetDirPath: repositorySectionB2fPath,
      });

      // sync zod schemas
      const repositoryTrpcApiPath = join(
        repositoryBackedPortalDirPath,
        section.sectionName,
        "trpcApi"
      );

      await syncFilesAndFolders({
        sourceDirPath: sectionSrcTrpcApiPath,
        targetDirPath: repositoryTrpcApiPath,
        fileNamePatterns: ["Zod", "zodSchemas"],
      });

      await syncFilesAndFolders({
        sourceDirPath: sectionDistTrpcApiPath,
        targetDirPath: repositoryDistTrpcApiPath,
        fileNamePatterns: ["trpcRouter.d.ts"],
      });

      await syncFilesAndFolders({
        sourceDirPath: projectPrismaClientPath,
        targetDirPath: repositoryPrismaClientPath,
        fileNamePatterns: [
          // "index.js",
          // "index.d.ts",
          // "library.js",
          // "library.d.ts",
          ".d.ts",
        ],
      });

      if (section.needNextJsPatch) {
        // console.log("Next Js Patch started");
        const tsFiles = getTsFiles(repositoryBackedPortalDirPath);
        tsFiles.forEach((filePath) => {
          updateImports(filePath);
        });
        // console.log("Next Js Patch completed");
      }
    }
  }

  console.log("------------nbk  finished-------------");
};

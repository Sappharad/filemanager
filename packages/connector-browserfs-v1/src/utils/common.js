export function normalizeStats(stats, path) {
  if (stats && path) {
    var fileType = null;
    var capabilities = {};
    if(stats.isDirectory()){
      fileType = "dir";
      capabilities = {
        canAddChildren: true,
        canCopy: true,
        canDelete: true,
        canDownload: false,
        canEdit: false,
        canListChildren: true,
        canRemoveChildren: true,
        canRename: true
      };
    }
    else if(stats.isFile()){
      fileType = "file";
      capabilities = {
        canAddChildren: false,
        canCopy: true,
        canDelete: true,
        canDownload: true,
        canEdit: true,
        canListChildren: false,
        canRemoveChildren: false,
        canRename: true
      };
    }
    else if(stats.isSymbolicLink()){
      fileType = "symlink";
    }
    var fileName = path;
    if(fileName.length > 1){
      fileName = fileName.split('/').pop();
    }
    let parents = [];
    let unrollPath = path.substr(0, path.lastIndexOf('/'));
    while(unrollPath.length > 0){
        parents.push({id: unrollPath, name: unrollPath.split('/').pop()});
        unrollPath = unrollPath.substr(0, unrollPath.lastIndexOf('/'));
        if(unrollPath.lastIndexOf('/')<0){
          break;
        }
    }
    if(path.length > 1 && unrollPath.length == 0){
      parents.push({id: '/', name: '/'}); //All paths except / are children of /
    }
    return {
      capabilities: capabilities,
      createdTime: stats.ctime,
      id: path,
      modifiedTime: stats.mtime,
      name: fileName,
      type: fileType,
      size: stats.size,
      parentId: path.substr(0, path.lastIndexOf('/')+1),
      ancestors: parents.reverse()
    };
  } else {
    return {};
  }
}

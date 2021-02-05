import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { normalizeStats } from './utils/common';
import JSZip from 'jszip';
var _bfs = require('browserfs');
//var fs = require('fs');

/**
 * hasSignedIn
 *
 * @returns {boolean}
 */
function hasSignedIn() {
  return true;
}

/**
 * Init API
 *
 * @returns {Promise<{apiInitialized: boolean, apiSignedIn: boolean}>}
 */
function init() {
  return {
    apiInitialized: true,
    apiSignedIn: true
  };
}

function getCapabilitiesForResource(options, resource) {
  return resource.capabilities || [];
}

function getResourceById(options, id) {
  if(id === '' || id === undefined){
    id = '/';
  }
  return normalizeStats(fs.statSync(id), id);
}

function getChildrenForId(options, { id, sortBy = 'name', sortDirection = 'ASC' }) {
  if(id === ''){
    id = '/';
  }
  if(!fs.statSync(id).isDirectory()){
    return [];
  }
  var fileNames = fs.readdirSync(id).sort();
  var retval = [];
  if(id[id.length-1] !== '/'){
    id += '/';
  }
  for(var i=0;i<fileNames.length; i++){
    retval.push(getResourceById(null, id + fileNames[i]));
  }
  return retval;
}

function getParentsForId(options, id, result = []) {
  if (!id) {
    return result;
  }

  const resource = getResourceById(options, id);
  if (resource && resource.ancestors) {
    return resource.ancestors;
  }
  return result;
}

function getBaseResource(options) {
  return normalizeStats(fs.statSync('/'));
}

function getIdForPartPath(options, currId, pathArr) {
  const resourceChildren = getChildrenForId(options, { id: currId });
  for (let i = 0; i < resourceChildren.length; i++) {
    const resource = resourceChildren[i];
    if (resource.name === pathArr[0]) {
      if (pathArr.length === 1) {
        return resource.id;
      } else {
        return getIdForPartPath(options, resource.id, pathArr.slice(1));
      }
    }
  }

  return null;
}

function getIdForPath(options, path) {
  const resource = getBaseResource(options);
  const pathArr = path.split('/');

  if (pathArr.length === 0 || pathArr.length === 1 || pathArr[0] !== '') {
    return null;
  }

  if (pathArr.length === 2 && pathArr[1] === '') {
    return resource.id;
  }

  return getIdForPartPath(options, resource.id, pathArr.slice(1));
}

function getParentIdForResource(options, resource) {
  return resource.parentId;
}

function uploadBackend(parentId, file) {
  return new Promise(resolve => {
    var fr = new FileReader();
    fr.onload = function () {
      var createId = parentId + "/" + file.name;
      fs.writeFileSync(createId, Buffer.from(fr.result), {encoding: null});
      resolve(createId);
    };
    fr.readAsArrayBuffer(file.file);
  });
}

async function uploadFileToId({ apiOptions, parentId, file, onProgress }) {
  var result = await uploadBackend(parentId, file);
  onProgress(100);
  return normalizeStats(fs.statSync(result), result);
}

async function downloadResources({ apiOptions, resources, onProgress }) {
  if(resources.length === 1){
    return {direct: false, file: fs.readFileSync(resources[0].id), fileName: resources[0].name};
  }
  //Multiple files, ZIP them!
  const zip = new JSZip();
  // add generated files to a zip bundle
  resources.forEach((res) => zip.file(res.name, fs.readFileSync(res.id)));

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    direct: false,
    file: blob,
    fileName: apiOptions.archiveName || 'archive.zip'
  }
}

function createFolder(options, parentId, folderName) {
  var toCreate = parentId + "/" + folderName;
  fs.mkdirSync(toCreate);
  return toCreate;
}

function getResourceName(apiOptions, resource) {
  return resource.name;
}

function renameResource(options, id, newName) {
  var newId = id.substr(0, id.lastIndexOf('/')+1) + newName;
  fs.renameSync(id, newId);
  return true;
}

function removeResource(options, resource) {
  if(resource.type === "dir"){
    fs.rmdirSync(resource.id);
  }
  else{
    fs.unlinkSync(resource.id);
  }
}

function removeResources(options, selectedResources) {
  return Promise.all(selectedResources.map(resource => removeResource(options, resource)))
}

export default {
  init,
  hasSignedIn,
  getIdForPath,
  getResourceById,
  getCapabilitiesForResource,
  getChildrenForId,
  getParentsForId,
  getParentIdForResource,
  getResourceName,
  createFolder,
  downloadResources,
  renameResource,
  removeResources,
  uploadFileToId
};

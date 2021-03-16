var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var arguments_=[];var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof process.versions==="object"&&typeof process.versions.node==="string";ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;var nodeFS;var nodePath;if(ENVIRONMENT_IS_NODE){if(ENVIRONMENT_IS_WORKER){scriptDirectory=require("path").dirname(scriptDirectory)+"/"}else{scriptDirectory=__dirname+"/"}read_=function shell_read(filename,binary){if(!nodeFS)nodeFS=require("fs");if(!nodePath)nodePath=require("path");filename=nodePath["normalize"](filename);return nodeFS["readFileSync"](filename,binary?null:"utf8")};readBinary=function readBinary(filename){var ret=read_(filename,true);if(!ret.buffer){ret=new Uint8Array(ret)}assert(ret.buffer);return ret};if(process["argv"].length>1){thisProgram=process["argv"][1].replace(/\\/g,"/")}arguments_=process["argv"].slice(2);if(typeof module!=="undefined"){module["exports"]=Module}process["on"]("uncaughtException",function(ex){if(!(ex instanceof ExitStatus)){throw ex}});process["on"]("unhandledRejection",abort);quit_=function(status){process["exit"](status)};Module["inspect"]=function(){return"[Emscripten Module object]"}}else if(ENVIRONMENT_IS_SHELL){if(typeof read!="undefined"){read_=function shell_read(f){return read(f)}}readBinary=function readBinary(f){var data;if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){arguments_=scriptArgs}else if(typeof arguments!="undefined"){arguments_=arguments}if(typeof quit==="function"){quit_=function(status){quit(status)}}if(typeof print!=="undefined"){if(typeof console==="undefined")console={};console.log=print;console.warn=console.error=typeof printErr!=="undefined"?printErr:print}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(typeof document!=="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=function readBinary(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()};xhr.onerror=onerror;xhr.send(null)}}setWindowTitle=function(title){document.title=title}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime;if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(typeof WebAssembly!=="object"){abort("no native wasm support detected")}var wasmMemory;var ABORT=false;var EXITSTATUS=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||33554432;if(Module["wasmMemory"]){wasmMemory=Module["wasmMemory"]}else{wasmMemory=new WebAssembly.Memory({"initial":INITIAL_MEMORY/65536,"maximum":INITIAL_MEMORY/65536})}if(wasmMemory){buffer=wasmMemory.buffer}INITIAL_MEMORY=buffer.byteLength;updateGlobalBufferAndViews(buffer);var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}what+="";err(what);ABORT=true;EXITSTATUS=1;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);throw e}function hasPrefix(str,prefix){return String.prototype.startsWith?str.startsWith(prefix):str.indexOf(prefix)===0}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return hasPrefix(filename,dataURIPrefix)}var fileURIPrefix="file://";function isFileURI(filename){return hasPrefix(filename,fileURIPrefix)}var wasmBinaryFile="app.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(){try{if(wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(wasmBinaryFile)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)&&typeof fetch==="function"&&!isFileURI(wasmBinaryFile)){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary()})}return Promise.resolve().then(getBinary)}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmTable=Module["asm"]["b"];removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiatedSource(output){receiveInstance(output["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiatedSource,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiatedSource)})})}else{return instantiateArrayBuffer(receiveInstantiatedSource)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){wasmTable.get(func)()}else{wasmTable.get(func)(callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}__ATINIT__.push({func:function(){___wasm_call_ctors()}});var asmLibraryArg={"a":wasmMemory};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["c"]).apply(null,arguments)};var _Tk_set_mask_c4_0=Module["_Tk_set_mask_c4_0"]=function(){return(_Tk_set_mask_c4_0=Module["_Tk_set_mask_c4_0"]=Module["asm"]["d"]).apply(null,arguments)};var _Tk_pass_point_c6_0=Module["_Tk_pass_point_c6_0"]=function(){return(_Tk_pass_point_c6_0=Module["_Tk_pass_point_c6_0"]=Module["asm"]["e"]).apply(null,arguments)};var _Tk_pass_spring_c8_0=Module["_Tk_pass_spring_c8_0"]=function(){return(_Tk_pass_spring_c8_0=Module["_Tk_pass_spring_c8_0"]=Module["asm"]["f"]).apply(null,arguments)};var _Tk_reset_c10_0=Module["_Tk_reset_c10_0"]=function(){return(_Tk_reset_c10_0=Module["_Tk_reset_c10_0"]=Module["asm"]["g"]).apply(null,arguments)};var _Tk_compute_center_c12_0=Module["_Tk_compute_center_c12_0"]=function(){return(_Tk_compute_center_c12_0=Module["_Tk_compute_center_c12_0"]=Module["asm"]["h"]).apply(null,arguments)};var _Tk_compute_center_grad_c15_0_grad_grad=Module["_Tk_compute_center_grad_c15_0_grad_grad"]=function(){return(_Tk_compute_center_grad_c15_0_grad_grad=Module["_Tk_compute_center_grad_c15_0_grad_grad"]=Module["asm"]["i"]).apply(null,arguments)};var _Tk_nn1_c16_0=Module["_Tk_nn1_c16_0"]=function(){return(_Tk_nn1_c16_0=Module["_Tk_nn1_c16_0"]=Module["asm"]["j"]).apply(null,arguments)};var _Tk_nn1_grad_c19_0_grad_grad=Module["_Tk_nn1_grad_c19_0_grad_grad"]=function(){return(_Tk_nn1_grad_c19_0_grad_grad=Module["_Tk_nn1_grad_c19_0_grad_grad"]=Module["asm"]["k"]).apply(null,arguments)};var _Tk_nn2_c20_0=Module["_Tk_nn2_c20_0"]=function(){return(_Tk_nn2_c20_0=Module["_Tk_nn2_c20_0"]=Module["asm"]["l"]).apply(null,arguments)};var _Tk_nn2_grad_c23_0_grad_grad=Module["_Tk_nn2_grad_c23_0_grad_grad"]=function(){return(_Tk_nn2_grad_c23_0_grad_grad=Module["_Tk_nn2_grad_c23_0_grad_grad"]=Module["asm"]["m"]).apply(null,arguments)};var _Tk_apply_spring_force_c24_0=Module["_Tk_apply_spring_force_c24_0"]=function(){return(_Tk_apply_spring_force_c24_0=Module["_Tk_apply_spring_force_c24_0"]=Module["asm"]["n"]).apply(null,arguments)};var _Tk_apply_spring_force_grad_c27_0_grad_grad=Module["_Tk_apply_spring_force_grad_c27_0_grad_grad"]=function(){return(_Tk_apply_spring_force_grad_c27_0_grad_grad=Module["_Tk_apply_spring_force_grad_c27_0_grad_grad"]=Module["asm"]["o"]).apply(null,arguments)};var _Tk_advance_toi_c28_0=Module["_Tk_advance_toi_c28_0"]=function(){return(_Tk_advance_toi_c28_0=Module["_Tk_advance_toi_c28_0"]=Module["asm"]["p"]).apply(null,arguments)};var _Tk_advance_toi_grad_c31_0_grad_grad=Module["_Tk_advance_toi_grad_c31_0_grad_grad"]=function(){return(_Tk_advance_toi_grad_c31_0_grad_grad=Module["_Tk_advance_toi_grad_c31_0_grad_grad"]=Module["asm"]["q"]).apply(null,arguments)};var _Tk_compute_loss_c32_0=Module["_Tk_compute_loss_c32_0"]=function(){return(_Tk_compute_loss_c32_0=Module["_Tk_compute_loss_c32_0"]=Module["asm"]["r"]).apply(null,arguments)};var _Tk_compute_loss_grad_c35_0_grad_grad=Module["_Tk_compute_loss_grad_c35_0_grad_grad"]=function(){return(_Tk_compute_loss_grad_c35_0_grad_grad=Module["_Tk_compute_loss_grad_c35_0_grad_grad"]=Module["asm"]["s"]).apply(null,arguments)};var _Tk_clear_states_c36_0=Module["_Tk_clear_states_c36_0"]=function(){return(_Tk_clear_states_c36_0=Module["_Tk_clear_states_c36_0"]=Module["asm"]["t"]).apply(null,arguments)};var _Tk_render_c38_0=Module["_Tk_render_c38_0"]=function(){return(_Tk_render_c38_0=Module["_Tk_render_c38_0"]=Module["asm"]["u"]).apply(null,arguments)};var _Tk_increasing_c40_0=Module["_Tk_increasing_c40_0"]=function(){return(_Tk_increasing_c40_0=Module["_Tk_increasing_c40_0"]=Module["asm"]["v"]).apply(null,arguments)};var _Tk_clear_gradients_c42_0=Module["_Tk_clear_gradients_c42_0"]=function(){return(_Tk_clear_gradients_c42_0=Module["_Tk_clear_gradients_c42_0"]=Module["asm"]["w"]).apply(null,arguments)};var _Tk_copy_status_c44_0=Module["_Tk_copy_status_c44_0"]=function(){return(_Tk_copy_status_c44_0=Module["_Tk_copy_status_c44_0"]=Module["asm"]["x"]).apply(null,arguments)};var _Tk_optimize_c46_0=Module["_Tk_optimize_c46_0"]=function(){return(_Tk_optimize_c46_0=Module["_Tk_optimize_c46_0"]=Module["asm"]["y"]).apply(null,arguments)};var _Tk_optimize1_c48_0=Module["_Tk_optimize1_c48_0"]=function(){return(_Tk_optimize1_c48_0=Module["_Tk_optimize1_c48_0"]=Module["asm"]["z"]).apply(null,arguments)};var _Tk_hub_get_num_particles_c50_0=Module["_Tk_hub_get_num_particles_c50_0"]=function(){return(_Tk_hub_get_num_particles_c50_0=Module["_Tk_hub_get_num_particles_c50_0"]=Module["asm"]["A"]).apply(null,arguments)};var _Tk_hub_get_particles_c52_0=Module["_Tk_hub_get_particles_c52_0"]=function(){return(_Tk_hub_get_particles_c52_0=Module["_Tk_hub_get_particles_c52_0"]=Module["asm"]["B"]).apply(null,arguments)};var _Tk_get_num_springs_c54_0=Module["_Tk_get_num_springs_c54_0"]=function(){return(_Tk_get_num_springs_c54_0=Module["_Tk_get_num_springs_c54_0"]=Module["asm"]["C"]).apply(null,arguments)};var _Tk_get_spring_anchors_c56_0=Module["_Tk_get_spring_anchors_c56_0"]=function(){return(_Tk_get_spring_anchors_c56_0=Module["_Tk_get_spring_anchors_c56_0"]=Module["asm"]["D"]).apply(null,arguments)};var _Ti_root=Module["_Ti_root"]=3904;var _Ti_args=Module["_Ti_args"]=19152e3;var _Ti_earg=Module["_Ti_earg"]=19152064;var _Ti_ctx=Module["_Ti_ctx"]=3872;var _Ti_extr=Module["_Ti_extr"]=19152320;var calledRun;function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0)return;function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}noExitRuntime=true;run();

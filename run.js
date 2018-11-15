const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

class Util{
    static searchAllRelativeFile(srcPath, list, filter, mapper, options={includeSelf:true,level:0}){
        if(options.level==null) options.level=0;
        if(options.includeSelf==null) options.includeSelf=true;
    
        let files = fs.readdirSync(srcPath);
        let subDirs = [];
        for (let index in files) {
            let fileName = files[index];
            let filePath = path.join(srcPath, fileName);
            let info = fs.statSync(filePath);
            if (info.isDirectory()) {
                subDirs.push(filePath);
            } else {
                let add = false;
                if(options.level>0) add=true;
                else if(options.includeSelf) add=true;
    
                if(add){
                    let valid;
                    if(filter!=null){
                        valid = filter(filePath);
                    }else{
                        valid = true;
                    }
    
                    if(valid){
                        let item = mapper(filePath);
                        list.push(item);
                    }
                }
            }
        }
    
        options.level = options.level+1;
        for(let subDir of subDirs){
            Util.searchAllRelativeFile(subDir, list, filter, mapper, options);
        }
    }

    static loadJson(file){
        try{
            return JSON.parse(fs.readFileSync(file));
        }catch(e){
            console.log('load json failed:',file);
            return null;
        }
    }

    static saveJson(file,json){
        try{
            fs.writeFileSync(JSON.stringify(json,null,2));
        }catch(e){
            console.log('save json failed:',file);
        }
    }

    static run(item){
        let { program, args } = item;
        
        const executor=[];
        if(path.extname(program)==='.js'){
            program = `"${program}"`;
            executor.push('node');
        }
        
        const fixArgs=[];
        let needQuote=false;
        const quoteOptions=[
            '--package',
            '--dataDir',
            '--genesisConfig',
            '--genesis',
            '--run'
        ];
        for(let arg of args){
            if(arg.startsWith('--')){
                if(quoteOptions.indexOf(arg)>=0){
                    needQuote = true;
                }
                fixArgs.push(arg);
            }else{
                if(needQuote){
                    fixArgs.push(`"${arg}"`);
                }else{
                    fixArgs.push(arg);
                }
            }
        }

        const scripts = [...executor, program, ...fixArgs];
        const cmd = scripts.join(' ');

        console.log('');
        console.log('----------------');
        console.log('will run script:');
        console.log('----------------');
        console.log(cmd);
        console.log('');
        console.log('----------------');
        console.log('logs:');
        console.log('----------------');
        console.log('');
        
        Util.execCmdSync(cmd,__dirname);
       
    }

    static execCmdSync(cmd, workspace) {
        let cwd = workspace ? workspace : __dirname;
        try {
            console.log(`current workspace:${cwd}`);
            child_process.execSync(cmd, { stdio: 'inherit', cwd: cwd, env: process.env });
            return null; 
        } catch (e) {
            return e.message;
        }
    }
}

class CommandLine {
    static parse(options) {
        for (let i = 2; i < process.argv.length; i++) {
            for (let key in options) {
                if (process.argv[i] === ("-" + key)) {
                    let next = process.argv[i + 1];
                    if (next == null || next.startsWith('-')) {
                        options[key] = true;
                    } else {
                        options[key] = next;
                        i++;
                    }
                }
            }
        }

        return options;
    }
}

function main(){
    const rootDir = __dirname;
    const srcDir = path.join(rootDir,'src');

    // 1. search chain.json from src
    console.log(`=>search all chain.json in dir:`,srcDir);
    const chainConfigs = [];
    Util.searchAllRelativeFile(
        srcDir, chainConfigs,
        (f)=>path.basename(f)=='chain.json',
        (f)=>({
            "chain": path.basename(path.dirname(f)),
            "config": Util.loadJson(f)
        })
    );

    // 2. parse commands
    let options = CommandLine.parse({
        'chain': null,
        'action': null
    });

    if(options.chain==null||options.action==null){
        console.log('## useage: node chain.js -chain ${chainName} -action ${actionName}');
        console.log('* example: node chain.js -chain coin -action create');
        console.log('');
        return;
    }else{
        console.log(options);
    }

    // 3. run command
    for(const item of chainConfigs){
        //console.log(JSON.stringify(item,null,2));
        if(item.chain===options.chain){
            Util.run(item.config[options.action]);
            return;
        }
    }
}

main();
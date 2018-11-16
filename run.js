const child_process = require('child_process');
const fs = require('fs');
const path = require('upath');
const os = require('os');

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

    static run(chainConfig, sessionName, show, forceclean){
        const session = chainConfig[sessionName];
        if(session.type==='group'){
            for(let group of session.groups){

                const subSession = chainConfig[group.session];
                subSession.sync = group.sync;
                if(forceclean){
                    subSession.args.push('--forceclean');
                }
                Util.runSession(sessionName, subSession,show);
            }
        }else{
            if(forceclean){
                session.args.push('--forceclean');
            }
            Util.runSession(sessionName, session,show);
        }
    }

    static runSession(sessionName, session, show){
        //
        // description
        // ===========
        // * zh-ch: 添加双引号，防止路径中有空格
        // * en: add quote to avoid spaces in path
        //
        const quote = (v)=>`"${v}"`;

        let { program, args } = session;

        if(program.windows!=null){
            if(os.platform()==='win32'){
                program = program.windows;
            }else{
                program = program.linux;
            }
            console.log(os.platform());
        }

        if(session.type==='test'){
            args[0] = quote(args[0]);
        }
        
        const executor=[];
        if(path.extname(program)==='.js'){
            program = quote(program);
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
                    fixArgs.push(quote(arg));
                }else{
                    fixArgs.push(arg);
                }
            }
        }

        const scripts = [...executor, program, ...fixArgs];
        const cmd = scripts.join(' ');

        
        
        if(!show){
            console.log('');
            console.log('=>will run session script:');
            console.log(cmd);
            console.log('');
            console.log('=>logs:');
            console.log('');

            if(session.sync===false){
                Util.execCmd(sessionName, cmd, __dirname);
            }else{
                Util.execCmdSync(sessionName, cmd, __dirname);
            }
        }else{
            console.log('');
            console.log('----------------');
            console.log('=>the session script is:');
            console.log('----------------');
            console.log(cmd);
            console.log('');
        }
    }

    static execCmdSync(tag, cmd, workspace) {
        let cwd = workspace ? workspace : __dirname;
        try {
            console.log(`current workspace:${cwd}`);
            child_process.execSync(cmd, { stdio: 'inherit', cwd: cwd, env: process.env });
            return null; 
        } catch (e) {
            return e.message;
        }
    }

    static execCmd(tag, cmd, workspace) {
        let cwd = workspace ? workspace : __dirname;
        try {
            console.log(`current workspace:${cwd}`);
            child_process.exec(cmd, { stdio: 'inherit', cwd: cwd, env: process.env },(error, stdout, stderr) => {
                if (error) {
                  console.error(`exec error: ${error}`);
                  return;
                }

                if(stdout){
                    console.log(`${tag}-[info]: ${stdout}`);
                }
                
                if(stderr){
                    console.log(`${tag}-[error]: ${stderr}`);
                }
            });
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
                const level1Option = process.argv[i] === ("-" + key);
                const level2Option = process.argv[i] === ("--" + key);
                if (level1Option||level2Option) {
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
        'session': null,
        'show': false,
        'forceclean': null,
    });

    if(options.chain==null||options.session==null){
        console.log('## useage: node chain.js -chain ${chainName} -session ${sessionName}');
        console.log('* example: node chain.js -chain coin -session create');
        console.log('');
        return;
    }else{
        console.log(options);
    }

    // 3. run command
    for(const item of chainConfigs){
        //console.log(JSON.stringify(item,null,2));
        if(item.chain===options.chain){
            Util.run(item.config, options.session, options.show, options.forceclean);
            return;
        }
    }
}

main();
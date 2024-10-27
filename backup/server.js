
const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");


//chartserver http setupt
const chartserver = http.createServer((req, res) => {
    fs.readFile("chart.html", (err, data) => {
        if (err){
            res.writeHead(500, {"Content-Type": "text/html"});
            res.end("Server error");
            console.log("error with loading html file");
            return ;
        }

        res.writeHead(200,{"Content-Type": "text/html"});
        res.end(data);
    });
});

const chartPort = 3000;
chartserver.listen(chartPort, ()=> {
    console.log("chart server running");
});


//barsiede server setup
const barserver = http.createServer((req, res) => {
    fs.readFile("bar.html", (err, data) => {
        if (err){
            res.writeHead(500, {"Content-Type": "text/html"});
            res.end("Server error");
            console.log("error with loading html file");
            return ;
        }

        res.writeHead(200,{"Content-Type": "text/html"});
        res.end(data);
    });
});


const barport = 3002;
barserver.listen(barport, ()=> {
    console.log("bar server running");
});


//stockcenter program setup
const surce_node = "C:/Users/l.hefti/Downloads/node-v20.17.0-win-x64/node-v20.17.0-win-x64/node.exe"
const stock_center = spawn(surce_node, ["stockcenter.js"]);

let init_stock_c = false;
stock_center.stdout.on("data", (data) => {
    if (data.toString().trim() == "1" && !init_stock_c){
        console.log("stock center init sucessfuly");
        init_stock_c = true;
    } else if (data.toString().trim() != "1" && !init_stock_c) {
        console.log("stockcenter error " + data);
    }
});

stock_center.stdout.on("error", (err) => {
    console.log("stock center error");
    console.log(err);
});

//stockcenter respons server setupt
const scserver = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Alle Ursprünge zulassen
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Erlaubte Methoden
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Erlaubte Header

    let last_call_getjson = 0;
    var handelData = (data) => {

        if (init_stock_c && last_call_getjson == "data"){
            res.writeHead(200, { "Content-Type" : "application/json"});
            res.end(data); // not stringify data
            last_call_getjson = 0;
            stock_center.stdout.removeListener("data", handelData);
        }

        last_call_getjson = data.toString().trim();
    };

    stock_center.stdout.on("data", handelData);

    stock_center.stdin.write("getJsonData");
});

const scserverPort = 3001;
scserver.listen(scserverPort, () => {
    console.log("mcserver running");
});

//barside answer server

const barresponsServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method == "OPTIONS"){
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === "POST"){
        let body = "";

        req.on("data", chunk =>{
            body += chunk.toString();
        });

        req.on("end", ()=>{
            const parseData = JSON.parse(body);

            let result = 0;
            
            stock_center.stdout.once("data", (data) => {
                data = data.toString();

                if (data == "0"){
                    res.writeHead(405);
                    res.end();
                } else {
                    data = JSON.parse(data);
                    res.writeHead(200, {"Content-Type":"application/json"});
                    res.end(JSON.stringify(data));
                }
            });

            let stringdata = parseData.toString();
            stock_center.stdin.write(stringdata);
        });
    } else {
        res.writeHead(405, {"Content-Type":"text/plain"});
        res.end("mehtod not allowed");
    }
});

barresponsServer.listen(3003, () => {
    console.log("barrserver running");
});

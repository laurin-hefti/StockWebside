const http = require("http");
const fs = require("fs");
const { spawn } = require("child_process");

// -------------------------------------- chartserver setupt --------------------------------------------

let chartServerClients = [];

const chart_path = "C:/Users/l.hefti/Desktop/StockWebside/chart.html";

const chartserver = http.createServer((req, res) => {
    if (req.url === "/events"){
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        chartServerClients.push(res);

        res.write("data:hallo\n\n");

        req.on("close", () => {
            chartServerClients = chartServerClients.filter(client => client !== res);
        });
    } 
    /*
    else if (req.url === "/send"){
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("data:hallo/n/n");
        res.end();
    } 
    */
    else {
        fs.readFile(chart_path, (err, data) => {
            if (err){
                res.writeHead(500, {"Content-Type": "text/html"});
                res.end("Server error");
                console.log("error with loading html file");
                return ;
            }

            res.writeHead(200,{"Content-Type": "text/html"});
            res.end(data);
        });
    }
});

function broadCastCartSides(data){
    chartServerClients.forEach(element => {
        element.write("data:"+data+"\n\n");
    });
}

const chartPort = 3000;
chartserver.listen(chartPort, ()=> {
    console.log("chart server running");
});


//barsiede server setup --------------------------------------------------------------------------------
let barSErverClients = [];

const bar_location = "C:/Users/l.hefti/Desktop/StockWebside/bar.html";

const barserver = http.createServer((req, res) => {

    if (req.url == "/events"){
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        barSErverClients.push(res);

        res.write("data:hallo\n\n");

        req.on("close", () => {
            barSErverClients = barSErverClients.filter(client => client !== res);
        });
    }

    else {
        fs.readFile(bar_location, (err, data) => {
            if (err){
                res.writeHead(500, {"Content-Type": "text/html"});
                res.end("Server error");
                console.log("error with loading html file");
                return ;
            }

            res.writeHead(200,{"Content-Type": "text/html"});
            res.end(data);
        });
    }
});

function broadCastBarSides(data){
    barSErverClients.forEach(element => {
        element.write("data:"+data+"\n\n");
    });
}

const barport = 3002;
barserver.listen(barport, ()=> {
    console.log("bar server running");
});


//stockcenter program setup ----------------------------------------------------------------------------

const surce_node = "node.exe"
const stock_center = spawn(surce_node, ["C:/Users/l.hefti/Desktop/StockWebside/stockcenter.js"]);

let init_stock_c = false;
stock_center.stdout.on("data", (data) => {
    if (data.toString().trim() == "1" && !init_stock_c){
        console.log("stock center init sucessfuly");
        init_stock_c = true;
    } 
    else if (data.toString().trim() != "1" && !init_stock_c) {
        console.log("stockcenter error " + data);
    }
});     
//remove listener

stock_center.stdout.on("error", (err) => {
    console.log("stock center error");
    console.log(err);
});

/*
stock_center.stdout.on("data", (data) => {      //should be always acive
    if (data.toString().trim() == "reload"){
        console.log("relaod");
    }
});
*/
const Time_to_res = 1000;
const newTime = 1000 * 60;

async function pingStockCenter(){
    return new Promise((resolve) =>{
        let resolved = false;

        stock_center.stdout.once("data", (data) => {
            if (!resolved){
                if (data.toString().trim() == "1"){
                    resolved = true;
                    resolve(true);
                } else { 
                    resolved = true;
                    resolve(false);
                }
            }
        });
        stock_center.stdin.write("ping");


        setTimeout(()=>{
            if (resolved != true){
                resolved = true;
                resolve(false);
            }
        },Time_to_res);
    });
}

function newTimeServerCall(){
    stockServerHandler.process("newTimeStamp");
    broadCastBarSides("reload");
    broadCastCartSides("reload");
    let now = new Date();
    console.log(now.getHours() + " " + now.getMinutes());
}

const auto_init = true;

setTimeout(() => {
    if (init_stock_c && auto_init){
        console.log("start auto restart");
        setInterval(() => {
            newTimeServerCall();
        }, newTime);
    } else if (!init_stock_c){
        console.log("error with sever start up");
    } else if (!auto_init){
        console.log("no auto restart");
    }
},1000);


//handel server ------------------------------------------------------------------------------------

class ServerHandler {
    init(server){
        this.server = server;
        this.requestList = [];
    }

    addRequest(request){
        this.requestList.push(request);
    }

    async waitListEmpty(list){
        return new Promise((resolve) =>{
            const interval = setInterval(() => {
                if (list.length == 0){
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    async process(request){
        if (this.requestList.length != 0){
            await this.waitListEmpty(this.requestList);
        }

        this.requestList.push(request);

        if (await pingStockCenter()){                           //not modular

            return new Promise((resolve) => {
                this.server.stdout.once("data", (data)=>{resolve(data);
                    this.requestList.shift();
                });                                             //still not the best butt better

                this.server.stdin.write(this.requestList[0]);
            });
        } 
        else {
            console.log("--> server error with ping");
            return new Promise((resolve, reject) => {
                resolve("0");
            });
        }  
    }
}

const stockServerHandler = new ServerHandler();
stockServerHandler.init(stock_center);


//stockcenter respons server setupt ---------------------------------------------------------------------

const scserver = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');                  // Alle Ursprünge zulassen
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');     // Erlaubte Methoden
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');      // Erlaubte Header

    var handelData = (data) => {

        try{
            let jsondata = JSON.parse(data);
        } catch {
            res.writeHead(500);
            res.end();
        }

        if (data.toString() == "0"){
            res.writeHead(500);
            res.end();
        }

        else{
            res.writeHead(200, { "Content-Type" : "application/json"});
            res.end(data);              // not stringify data
            //stock_center.stdout.removeListener("data", handelData);           //may needed
        }
    };

    let data = await stockServerHandler.process("getJsonData");
    handelData(data);

    //stock_center.stdout.once("data", handelData);

    //stock_center.stdin.write("getJsonData");
});

const scserverPort = 3001;
scserver.listen(scserverPort, () => {
    console.log("mcserver running");
});


// barside answer server --------------------------------------------------------------------------

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

        req.on("end", async ()=>{
            let processData = (data) => {
                data = data.toString().trim();

                if (data == "0"){
                    res.writeHead(500);
                    res.end();
                } else if (data == "reload"){
                    broadCastCartSides("reload");
                    broadCastBarSides("reload");
                    res.writeHead(200);
                    res.end("1");
                } else {
                    data = JSON.parse(data);
                    res.writeHead(200, {"Content-Type":"application/json"});
                    res.end(JSON.stringify(data));
                }
            };

            
            const parseData = JSON.parse(body);
            let stringdata = parseData.toString();

            if (stringdata == "changeStyle"){
                broadCastCartSides("changeStyle");
                res.writeHead(200);
                res.end();
                return 1;
            }

            let newData = await stockServerHandler.process(stringdata);

            processData(newData);
            //stock_center.stdout.once("data", processData);

            //stock_center.stdin.write(stringdata);
        });
    } else {
        res.writeHead(405, {"Content-Type":"text/plain"});
        res.end("mehtod not allowed");
    }
});

barresponsServer.listen(3003, () => {
    console.log("barrserver running");
});

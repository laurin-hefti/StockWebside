//stockcenter

const fs = require("fs").promises;
const fs2 = require("fs");

// global server variables
const presentation = "relativ"; //relativ
let targetPriceMode = false;
let relativPrices = false;


// global functions

function round(num, fac){
	let f = Math.pow(10,fac);
	return Math.round(num * f) / f;
}

function round50(value){
	return Math.round(value * 200) / 200;
}

function log(text){
	fs2.appendFileSync("serverLog.txt", text + "\n");
}

// ------------------------------ Drink class -------------------------------------------------------
const drink_num_to_integrate = 5;
const drink_buffersize = 20;
const drink_rel_size_of_upper_lower_gap = 5;
const drink_speed_to_target_privce = 5; 		//higher means slower
const drink_price_buffer_size = 20;

class Drink {
	constructor(name, start_price, minPrice, maxPrice, targetPrice){
		this.name = name;
		this.price = start_price;
		this.maxPrice = maxPrice;
		this.minPrice = minPrice;
		this.targetPrice = targetPrice;

		if (maxPrice < minPrice){console.log("error min price is bigger than max price " + minPrice +  " " + maxPrice);}

		this.buffer_next_count = 0;

		this.buffer = [];
		this.num_to_integrate = drink_num_to_integrate;
		this.buffersize = drink_buffersize;

		this.price_buffer = [];
		this.price_buffer_size = drink_price_buffer_size;

		this.price_buffer.push(this.price);

		this.total_sales = 0;
		this.total_mony = 0;
	}

	printStock(){
		console.log(this.name + " " + this.price);
	}

	updateBuffer(){
		this.total_sales += this.buffer_next_count;
		this.total_mony += this.buffer_next_count * this.price;

		this.buffer.push(this.buffer_next_count);

		if (this.buffersize < this.buffer.length){
			this.buffer.shift();
		}

		this.buffer_next_count = 0;
	}

	getBufferValue(){
		let sum = 0;
		let lower_boundery = this.buffer.length-this.num_to_integrate;
		if (lower_boundery < 0){lower_boundery = 0;}

		let upper_boundery = this.buffer.length;

		for(let i = lower_boundery; i < upper_boundery; i++){
			sum += this.buffer[i] ;// * ((i+1)/(upper_boundery+1));				//may not
		}

		let numtodiv = upper_boundery-lower_boundery;
		if (numtodiv == 0){numtodiv = 1;}

		let s = sum / numtodiv;
		return s;
	}

	updatePriceBuffer(){
		let new_p = this.getPrice();	//calls everything to make the new price

		this.price_buffer.push(new_p);

		if (this.price_buffer_size < this.price_buffer.length){
			this.price_buffer.shift();
		}
	}

	sigmoid(x) {
		return 1 / (1 + Math.exp(-x));
	}

	mapRange(value, inMin, inMax, outMin, outMax) {
		return outMin + ( (value - inMin) * (outMax - outMin) ) / (inMax - inMin);
	}

	// ------------------- check ---------------------------
	
	getBorder(f){
		let numofup = Math.round(this.buffer.length/drink_rel_size_of_upper_lower_gap);
		let l = [];
		let copy = [...this.buffer];

		for (let i = 0; i < numofup; i++){
			let num = f(...copy);
			l.push(num);
			let index = copy.indexOf(num);
			if (index != -1){
				copy.slice(index, 1);
			}
		}

		return l;
	}

	// ----------------- check -----------------------

	getPrice(){
		
		let stockrequest = this.getBufferValue();

		if (stockrequest < 0){
			stockrequest = 0;
		}

		let divPrice = this.maxPrice - this.minPrice;

		let upperB = this.getBorder(Math.max);
		let lowerB = this.getBorder(Math.min);

		if (upperB.length == 0){ //check if better option
			upperB = [0];
		}
		if (lowerB.length == 0){
			lowerB = [0];
		} 
		var upperV = upperB[Math.round(upperB.length/2-0.1)]; //formel to so 0.5 will be 0
		var lowerV = lowerB[Math.round(lowerB.length/2-0.1)];

		if (lowerV == upperV){
			lowerV = 0;
		}
		if (upperV == 0){ //not correct math
			upperV = 1;
		}

		let request = this.mapRange(stockrequest, lowerV, upperV, -6, 6);

		let price = this.minPrice + this.sigmoid(request) * divPrice; //map stockrequest to sigmoid

		if (targetPriceMode){
			let ts = this.total_sales;
			if (this.total_sales == 0){ts = 1;}

			price += (this.targetPrice - (this.total_mony/ts)) / drink_speed_to_target_privce;

			if (price > this.maxPrice){
				price = this.maxPrice;
			}
			if (price < this.minPrice){
				price = this.minPrice;
			}
		}

		price = round(price, 2);

		price = round50(price);
		
		this.price = price;

		return price;
	}

	newTimeStamp(){
		// update all Bufers so the price can be calculated
		this.updateBuffer();

		this.updatePriceBuffer();
	}
}

const SM_p1 = "stocks.txt";
const SM_p2 = "stocks2.txt";
const SM_backup = "backup.txt";
const SM_time_buffer_size = 20;

class StockMarket {
	async init(){

		this.stocks = [];

		this.times = [];

		this.total_request = [];
		
		this.drinks_path = SM_p1;
		this.drinks_path2 = SM_p2;
		
		this.current_drink_path = this.drinks_path;

		let data = await fs.readFile(this.current_drink_path, "utf8");

		data = data.replace(" ", "");
		data = data.replace("\r", "");
		data = data.replace("\t", "");

		let lines = data.split("\n");

		for (let line of lines){
			let fragments = line.split(",");
			//console.log(fragments)

			// name, startprice, minprice, maxprice, targetprice
			this.stocks.push(new Drink(fragments[0], 
				parseFloat(fragments[1]),
				parseFloat(fragments[2]),
				parseFloat(fragments[3]),
				parseFloat(fragments[4])
			));
		}

		this.setTime();
	}

	async initBackup(){
		let data = await fs.readFile(SM_backup, "utf8");

		data = data.replace(" ", "");
		data = data.replace("\t", "");

		let lines = data.split("\n");

		if (lines.length < 1 ){
			return;
		}

		let i = 0;
		for (let line of lines){
			let fragments = line.split(",");

			if (fragments.length != 3){continue;}

			// total sales, total mony, current sales
			let ts = parseFloat(fragments[0]);
			let tm = parseFloat(fragments[1]);
			let p = parseFloat(fragments[2]);

			if (isNaN(ts) || isNaN(ts) || isNaN(p)){
				fs2.writeFileSync(SM_backup, "");
				return;
			}


			this.stocks[i].total_sales = ts;
			this.stocks[i].total_mony = tm;
			this.stocks[i].price = p;

			i += 1;
		}
	}

	async reloadStocks(){
		let data = await fs.readFile(this.current_drink_path, "utf8");

		data = data.replace(" ", "");
		data = data.replace("\r", "");
		data = data.replace("\t", "");

		let lines = data.split("\n");

		let i = 0;
		for (let line of lines){
			let fragments = line.split(",");

			// name, startprice, minprice, maxprice, targetprice

			this.stocks[i].name = fragments[0];
			//this.stocks[i].price = parseFloat(fragments[1]);
			this.stocks[i].minPrice = parseFloat(fragments[2]);
			this.stocks[i].maxPrice = parseFloat(fragments[3]);
			this.stocks[i].targetPrice = parseFloat(fragments[4]);

			i += 1;
		}
	}

	writeBackup(){
		let content = "";
		for (let s of this.stocks){
			content += s.total_sales + "," + s.total_mony + "," + s.price + "\n";
		}

		fs2.writeFileSync(SM_backup, content);
	}

	printStocks(){
		console.log("Stocks : ");
		for(let s of this.stocks){
			s.printStock();
		}
	}

	buystock(name){
		for (let s of this.stocks){
			if (name == s.name){
				s.buffer_next_count += 1;
				return 1;
			}
		}
		log("found not drink : " + name);
		return 0;
	}

	sellStock(name){
		for (let s of this.stocks){
			if (name == this.name){
				s.buffer_next_count -= 1;
				return 1;
			}
		}
		log("found not drink : " + name);
		return 0;
	}

	newTimes(){
		this.setTime();

		//only for relativ prices
		let req = 0;						//not in use
		let old_prices = [];
		for (let s of this.stocks){
			old_prices.push(s.price);
			req += this.buffer_next_count;
		}
		this.total_request.push(req);
		if (this.total_request.length >= SM_time_buffer_size){
			this.total_request.shift();
		}
		// -----

		for (let s of this.stocks){
			s.newTimeStamp();
		}

		//realativ p
		let new_prices = [];
		let new_prive_div = 0;			//not in use
		let i = 0;
		for (let s of this.stocks){
			new_prices.push(s.price);

			new_prive_div += s.price - old_prices[i];
			i += 1;
		}

		let sum = 0;
		for (let i = 0; i < old_prices.length; i++){
			sum += new_prices[i]-old_prices[i];
		}
		let average = round(sum / old_prices.length, 2);
		average = round50(average);

		for(let i = 0; i < new_prices.length; i++){
			new_prices[i] -= average;
		}

		if (relativPrices){
			let i = 0;
			for (let e of this.stocks){
				if (e.price_buffer.length != 0){
					if(new_prices[i] < e.minPrice){
						e.price_buffer[e.price_buffer.length-1] = e.minPrice;
						e.price = e.minPrice;
					} else if (new_prices[i] > e.maxPrice){
						e.price_buffer[e.price_buffer.length-1] = e.maxPrice;
						e.price = e.maxPrice;
					} else{
						e.price_buffer[e.price_buffer.length-1] = new_prices[i]; // may only this one
						e.price = new_prices[i];
					}
				}
				i += 1;
			}
		}
		// ----------


		this.writeBackup();
		return 1;
	}

	setTime(){
		const now = new Date();
		const h = now.getHours();
		const m = now.getMinutes();

		let t = h.toString() + ":" + m.toString();
		t = t.toString();
		this.times.push(t);

		if (SM_time_buffer_size < this.times.length){
			this.times.shift();
		}
	}

	async fullinit(){
		await this.init().then(this.initBackup());
	}

	creatingRandomData(){
		for (let s of this.stocks){
			s.buffer_next_count = Math.floor(Math.random() * 10);
		}
	}

	creatingJsonData(){
		let data = {drinks: []};

		for (let drink of this.stocks){
			data.drinks.push({name: drink.name, 
				prices: drink.price_buffer, 
				times: this.times});
		}

		const static_test_data = {"drinks": [
			{
				"name": "cola",
				"prices": [1,2,3,4,3],
				"time": [1,2,3,4,5]
			},
			{
				"name": "sprite",
				"prices": [1,1,2,3,2],
				"time": [1,2,3,4,5]
			},
			{
				"name": "wasser",
				"prices": [1,2,2,1,2],
				"time": [1,2,3,4,5]
			}
		]};

		return JSON.stringify(data);
	}

	creatingJsonSetings(){
		let data = {drinks: []};

		for (let drink of this.stocks){
			data.drinks.push({name: drink.name,
				minPrice: drink.minPrice,
				maxPrice: drink.maxPrice,
				price: drink.price,
				targetPrice: drink.targetPrice
			});
		}

		return JSON.stringify(data);
	}

	creatingJsonStatistics(){
		let data = {drinks: []};

		for (let drink of this.stocks){
			data.drinks.push({name: drink.name,
				totalSels: drink.total_sales,
				totalMony: drink.total_mony
			});
		}

		return JSON.stringify(data);
		//return data;
	}
}

let sm = new StockMarket();
sm.fullinit().then(() => {

	log("server init");

	console.log("1");

	var data = "";

	process.stdin.on("data", (rdata) =>{
		try {
		data = rdata.toString().trim();

		var slices = data.split(",");
		
		if (data == "getJsonData"){
			console.log(sm.creatingJsonData());
		}

		else if (data == "getJsonSetings"){
			console.log(sm.creatingJsonSetings());
		}

		else if (data == "getJsonStatistics"){
			console.log(sm.creatingJsonStatistics());
		}

		else if (data == "newTimeStamp"){
			sm.newTimes();
			console.log("reload");
		}

		else if (data == "randomData"){
			sm.creatingRandomData();
			console.log(1)
		}

		else if (data == "ping"){
			console.log(1);
		}

		else if (data == "getPriceMode"){
			console.log(JSON.stringify({data: targetPriceMode}));
		}

		else if (data == "setPTMode"){
			if (targetPriceMode == false){
				targetPriceMode = true;
			} else {
				targetPriceMode = false;
			}
			console.log(1);
		}

		else if (data == "loadDrinkList"){
			sm.reloadStocks();
			log("reaload Drink List");
			console.log("reload");
		}

		else if (data == "getDrinkPath"){
			if (sm.drinks_path == sm.current_drink_path){
				console.log(JSON.stringify({data: 1}));
			} else {
				console.log(JSON.stringify({data: 2}));
			}
		}

		else if (data == "changeDrinkPath"){
			sm.writeBackup();
			if (sm.drinks_path == sm.current_drink_path){
				sm.current_drink_path = sm.drinks_path2;
			} else {
				sm.current_drink_path = sm.drinks_path;
			}
			sm.reloadStocks();
			sm.newTimes();
			log("change Drink Path : " + sm.current_drink_path);
			console.log("reload");
		}

		else if (data == "getRelativPriceMode"){
			console.log(JSON.stringify({data: relativPrices}));
		}

		else if (data == "setRPMode"){
			//may reload
			if (relativPrices){
				relativPrices = false;
			} else {
				relativPrices = true;
			}
			log("Relative Price Mode : " + relativPrices);
			console.log("reload");
		}

		else if (slices[0] == "buy"){
			sm.buystock(slices[1]);
			console.log(1);
		}

		else if (slices[0] == "sell"){
			sm.sellStock(slices[1]);
			console.log(1);
		}

		else if (slices[0] == "newTimes"){
			sm.newTimes();
			console.log(1);
		}

		else if(slices[0] == "setMode"){
			targetPriceMode == (slices[1] === "true");
			log("set target Price mode : " + targetPriceMode);
			console.log(1);
		}

		else {
			log("command not found : " + data);
			console.log("0");
		}
	} catch {
		log("error with : " + data);
	}
	});
});


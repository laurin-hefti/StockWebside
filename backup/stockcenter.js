//stockcenter

const fs = require("fs").promises;
const fs2 = require("fs");

//Drink class

class Drink {
	constructor(name, start_price, minPrice, maxPrice){
		this.name = name;
		this.price = start_price;
		this.maxPrice = maxPrice;
		this.minPrice = minPrice;

		if (maxPrice < minPrice){console.log("error min price is bigger than max price");}

		this.buffer_next_count = 0;

		this.buffer = [];
		this.num_to_integrate = 3; //default;	
		this.buffersize = 3;

		this.price_buffer = [];
		this.price_buffer_size = 10;

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
			sum += this.buffer[i];
		}
		
		return sum / (upper_boundery-lower_boundery);
	}

	updatePriceBuffer(){
		let new_p = this.getPrice();

		this.price_buffer.push(new_p);

		if (this.price_buffer_size < this.price_buffer){
			this.price_buffer.shift();
		}
	}

	sigmoid(x) {
		return 1 / (1 + Math.exp(-x));
	}

	round(num, fac){
		let f = Math.pow(10,fac);
		return Math.round(num * f) / f;
	}

	getPrice(){
		
		let stockrequest = this.getBufferValue();

		let divPrice = this.maxPrice - this.minPrice;

		let C = 1; //some constant

		let price = this.minPrice + this.sigmoid(stockrequest/C) * divPrice; //map stockrequest to sigmoid

		price = this.round(price, 2);

		return price;
	}

	newTimeStamp(){
		this.updateBuffer();

		this.updatePriceBuffer();
	}
}

class StockMarket {
	async init(){

		this.stocks = [];

		this.times = [];

		// init sotck

		let data = await fs.readFile("stocks.txt", "utf8");

		data = data.replace(" ", "");
		data = data.replace("/r", "");

		let lines = data.split("/n");

		for (let line of lines){
			let fragments = line.split(",");
			// name, startprice, minprice, maxprice
			this.stocks.push(new Drink(fragments[0], 
				parseFloat(fragments[1]),
				parseFloat(fragments[2]),
				parseFloat(fragments[3])));
		}

		this.setTime();

		//console.log("init of stock complet");
	}

	async initBackup(){
		let data = await fs.readFile("backup.txt", "utf8");

		data = data.replace(" ", "");
		let lines = data.split("/n");

		if (lines.length < 1 ){
			return;
		}

		let i = 0;
		for (let line of lines){
			let fragments = line.split(",");

			if (fragments.length != 3){continue;}

			// total sales, total mony, current sales
			this.stocks[i].total_sales = parseFloat(fragments[0]);
			this.stocks[i].total_mony = parseFloat(fragments[1]);
			this.stocks[i].price = parseFloat(fragments[2]);

			i += 1;
		}
	}

	writeBackup(){
		let content = "";
		for (let s of this.stocks){
			content += s.total_sales + "," + s.total_mony + "," + s.price + "/n";
		}

		fs2.writeFileSync("C:/Users/l.hefti/Desktop/StockWebside/backup.txt", content);
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
				return ;
			}
		}
		//console.log("error");
	}

	sellStock(name){
		for (let s of this.stocks){
			if (name == this.name){
				s.buffer_next_count -= 1;
				return ;
			}
		}
		//console.log("error");
	}

	newTimes(){
		this.setTime();

		for (let s of this.stocks){
			s.newTimeStamp();
		}

		this.writeBackup();
	}

	setTime(){
		const now = new Date();
		const h = now.getHours();
		const m = now.getMinutes();

		let t = h.toString() + ":" + m.toString();
		t = t.toString();
		this.times.push(t);

		if (10 < this.times.length){
			this.times.shift();
		}
	}

	async fullinit(){
		await this.init().then(this.initBackup());
	}

	creatingRandomData(){
		for (let s of this.stocks){
			s.buffer_next_count = Math.floor(Math.random() * 101);
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
				price: drink.price
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
	console.log("1");

	process.stdin.on("data", (rdata) =>{
		const data = rdata.toString().trim();

		var slices = data.split(",");
		
		if (data == "getJsonData"){
			console.log("data");
			console.log(sm.creatingJsonData());
		}

		else if (data == "getJsonSetings"){
			//console.log("settings");
			console.log(sm.creatingJsonSetings());
		}

		else if (data == "getJsonStatistics"){
			//console.log("statistics");
			console.log(sm.creatingJsonStatistics());
		}

		else if (data == "newTimeStamp"){
			sm.newTimes();
			console.log(1)
		}

		else if (data == "randomData"){
			sm.creatingRandomData();
			console.log(1)
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

		else {
			console.log("0");
		}
	});
});


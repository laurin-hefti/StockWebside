[1mdiff --git a/stockcenter.js b/stockcenter.js[m
[1mindex 2d5c360..74e1c5e 100644[m
[1m--- a/stockcenter.js[m
[1m+++ b/stockcenter.js[m
[36m@@ -17,17 +17,17 @@[m [mfunction round(num, fac){[m
 }[m
 [m
 function round50(value){[m
[31m-	return Math.round(value * 20) / 20;[m
[32m+[m	[32mreturn Math.round(value * 2) / 2;[m
 }[m
 [m
 function log(text){[m
[31m-	fs2.appendFileSync("C:/Users/l.hefti/Desktop/StockWebside/serverLog.txt", text + "\n");[m
[32m+[m	[32mfs2.appendFileSync("serverLog.txt", text + "\n");[m
 }[m
 [m
 // ------------------------------ Drink class -------------------------------------------------------[m
[31m-const drink_num_to_integrate = 6;[m
[32m+[m[32mconst drink_num_to_integrate = 5;[m
 const drink_buffersize = 20;[m
[31m-const drink_rel_size_of_upper_lower_gap = 5;[m
[32m+[m[32mconst drink_rel_size_of_upper_lower_gap = 5;	//rela higher means lower[m
 const drink_speed_to_target_privce = 5; 		//higher means slower[m
 const drink_price_buffer_size = 20;[m
 [m
[36m@@ -39,7 +39,7 @@[m [mclass Drink {[m
 		this.minPrice = minPrice;[m
 		this.targetPrice = targetPrice;[m
 [m
[31m-		if (maxPrice < minPrice){console.log("error min price is bigger than max price");}[m
[32m+[m		[32mif (maxPrice < minPrice){console.log("error min price is bigger than max price " + minPrice +  " " + maxPrice);}[m
 [m
 		this.buffer_next_count = 0;[m
 [m
[36m@@ -80,14 +80,12 @@[m [mclass Drink {[m
 [m
 		let upper_boundery = this.buffer.length;[m
 [m
[31m-		let numtodiv = 0;[m
 		for(let i = lower_boundery; i < upper_boundery; i++){[m
[31m-			sum += this.buffer[i] * i*i;[m
[31m-			numtodiv += i*i;[m
[32m+[m			[32msum += this.buffer[i] ;// * ((i+1)/(upper_boundery+1));				//may not[m
 		}[m
 [m
[31m-		//let numtodiv = upper_boundery-lower_boundery;[m
[31m-		if (numtodiv == 0){numtodiv = 1;}[m
[32m+[m		[32mlet numtodiv = upper_boundery-lower_boundery;[m
[32m+[m		[32mif (numtodiv <= 0){numtodiv = 1;}[m
 [m
 		let s = sum / numtodiv;[m
 		return s;[m
[36m@@ -135,6 +133,7 @@[m [mclass Drink {[m
 	getPrice(){[m
 		[m
 		let stockrequest = this.getBufferValue();[m
[32m+[m		[32mlog(stockrequest); 		//delet this[m
 [m
 		if (stockrequest < 0){[m
 			stockrequest = 0;[m
[36m@@ -153,7 +152,6 @@[m [mclass Drink {[m
 		} [m
 		var upperV = upperB[Math.round(upperB.length/2-0.1)]; //formel to so 0.5 will be 0[m
 		var lowerV = lowerB[Math.round(lowerB.length/2-0.1)];[m
[31m-		lowerV = 0;[m
 [m
 		if (lowerV == upperV){[m
 			lowerV = 0;[m
[36m@@ -197,9 +195,9 @@[m [mclass Drink {[m
 	}[m
 }[m
 [m
[31m-const SM_p1 = "C:/Users/l.hefti/Desktop/StockWebside/stocks.txt";[m
[31m-const SM_p2 = "C:/Users/l.hefti/Desktop/StockWebside/stocks2.txt";[m
[31m-const SM_backup = "C:/Users/l.hefti/Desktop/StockWebside/backup.txt";[m
[32m+[m[32mconst SM_p1 = "stocks.txt";[m
[32m+[m[32mconst SM_p2 = "stocks2.txt";[m
[32m+[m[32mconst SM_backup = "backup.txt";[m
 const SM_time_buffer_size = 20;[m
 [m
 class StockMarket {[m
[36m@@ -220,11 +218,13 @@[m [mclass StockMarket {[m
 [m
 		data = data.replace(" ", "");[m
 		data = data.replace("\r", "");[m
[32m+[m		[32mdata = data.replace("\t", "");[m
 [m
 		let lines = data.split("\n");[m
 [m
 		for (let line of lines){[m
 			let fragments = line.split(",");[m
[32m+[m			[32m//console.log(fragments)[m
 [m
 			// name, startprice, minprice, maxprice, targetprice[m
 			this.stocks.push(new Drink(fragments[0], [m
[36m@@ -242,6 +242,8 @@[m [mclass StockMarket {[m
 		let data = await fs.readFile(SM_backup, "utf8");[m
 [m
 		data = data.replace(" ", "");[m
[32m+[m		[32mdata = data.replace("\t", "");[m
[32m+[m
 		let lines = data.split("\n");[m
 [m
 		if (lines.length < 1 ){[m
[36m@@ -278,6 +280,7 @@[m [mclass StockMarket {[m
 [m
 		data = data.replace(" ", "");[m
 		data = data.replace("\r", "");[m
[32m+[m		[32mdata = data.replace("\t", "");[m
 [m
 		let lines = data.split("\n");[m
 [m

/*
*    main.js
*/

	var color_bars = "#190061";
	//Scatter Plot

	// attributes
	var circle_color = "#d3d3d3";
	var circle_highlight = "#3500d3";

	$( "#parallel" ).hide();
	$( "#volume-slider" ).hide()
	$( "#hide-parallel" ).hide();


   	// set the dimensions and margins of the graph
	var margin = {top: 10, right: 10, bottom: 10, left: 10},
	    width = window.innerWidth - margin.left - margin.right - 330,
	    height = window.innerHeight - margin.top - margin.bottom;


	//Track Info
	var features = ["acousticness","danceability", "energy", "instrumentalness" ,"loudness","speechiness","valence","tempo"];

	var feature_range = {"acousticness": [0,1], "danceability": [0,1], "energy": [0,1], "instrumentalness": [0,1],
	 		"loudness": [-60,0],"speechiness": [0,1],"valence": [0,1],"tempo": [0,250]};

	// set the dimensions and margins of the graph
	var track_margin = {top: 5, right: 10, bottom: 20, left: 5},
	  track_width = 300 - track_margin.left - track_margin.right,
	  track_height = 500 - track_margin.top - track_margin.bottom;

	var track_svg = d3.select("#track-chart")
		.append("svg")
			.attr("width", track_width + track_margin.left + track_margin.right)
		  	.attr("height", track_height + track_margin.top + track_margin.bottom)
		.append("g")
    		.attr("transform", "translate(" + track_margin.left + "," + track_margin.top + ")");


	//Parallel Graph
	
	// set the dimensions and margins of the graph
	var parallel_margin = {top: 60, right: 0, bottom: 10, left: 10},
	  parallel_width = 700 - parallel_margin.left - parallel_margin.right,
	  parallel_height = 300 - parallel_margin.top - parallel_margin.bottom;

	// append the svg object to the body of the page
	var parallel_svg = d3.select("#parallel")
	.append("svg")
	  .attr("width", parallel_width + parallel_margin.left + parallel_margin.right)
	  .attr("height", parallel_height + parallel_margin.top + parallel_margin.bottom)
	.append("g")
	  .attr("transform",
	        "translate(" + parallel_margin.left + "," + parallel_margin.top + ")");

d3.csv("data/phindie.csv").then(function(data){

	var track_hidden = false;
	var parallel_hidden = false;
	var slider_hidden = true;

	d3.graphScroll()
	  .sections(d3.selectAll('#sections .step'))
	  .on('active', function(i){
	  	if (i==3){
	  		$( "#hide-parallel" ).show();
	  		$( "#parallel" ).show();
	  	 }
	  	});

	//Scatter Plot
	var svg = d3.select("#track-scatterplot")
	  .append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .call(d3.zoom()
	  	.extent([[0, 0], [width, height]])
      	.scaleExtent([0.5, 50])
	  	.on("zoom", zoomed))
	  .append("g")
	    .attr("transform",
	          "translate(" + margin.left + "," + margin.top + ")");
	 //zoom
	function zoomed() {
    	var newX = d3.event.transform.rescaleX(x);
    	var newY = d3.event.transform.rescaleY(y);

	    // update axes with these new boundaries
	    xAxis.call(d3.axisBottom(newX))
	    yAxis.call(d3.axisLeft(newY))

	    // update circle position
	    scatter
	      .selectAll("circle")
	      .attr('cx', function(d) {return newX(d.zero)})
	      .attr('cy', function(d) {return newY(d.one)});
  	}	

	// create a tooltip
	var tooltip = d3.select("#track-scatterplot")
	  .append("tooltip")
	  .attr("id","tooltip")
	    .style("visibility", "hidden");

	// Add X axis
	  var x = d3.scaleLinear()
	    .domain([-3.5, 7])
	    .range([ -3.5, width]);
	  var xAxis = svg.append("g")
	    .attr("transform", "translate(0," + height + ")")
	    .style("opacity", 0)
	    .call(d3.axisBottom(x));

	// Add Y axis
	  var y = d3.scaleLinear()
	    .domain([-4, 4])
	    .range([ height, -4]);
	  var yAxis = svg.append("g")
	  	.style("opacity", 0)
	    .call(d3.axisLeft(y));

	var scatter = svg.append("g");
	var rect = track_svg.append("g"); 

	var isPlaying = false;
	var idPlaying;

	// Add circles
	  scatter.selectAll("circle")
      	.data(data)
	    .enter()
	    .append("circle")
	      .attr("r", 5)
	      .attr("cx", function (d) { return x(d.zero); } )
	      .attr("cy", function (d) { return y(d.one); } )
	      .attr("id", function(d) { return "circle-"+d.id })
	      .attr("class", function(d) {return "album-"+d.album_id})
	      .attr("stroke", "white")
	      .style("opacity", 0.5)
	      .style("fill", circle_color)
	      // hover effects
	      .on('mouseover', function (d) {
		     d3.select(this).transition()
		          .duration('100')
		          .attr("r", 8)
		          .style("opacity", 1);
		     tooltip
		     	.style("visibility","visible");

		     tooltip.text(d.name + " by "+ d.artist_name)
		     	.style("left", (d3.event.pageX-300) + "px")			 
				.style("top", (d3.event.pageY-10) + "px");


		})
		.on('mouseout', function (d) {
		     d3.select(this).transition()
		          .duration('200')
		          .attr("r", 5)
		          .style("opacity", 0.5);
		     tooltip
		     .style("visibility","hidden");
		})

		.on('click', function(d) { 

			d3.select("#track-name").text("Song: " +d.name);
			d3.select("#track-artist").text("Artist: " +d.artist_name);
			updateTrackInfo(d);
			checkPlaying(d.preview_url, d.id, this);

		});

		function checkPlaying(url, track_id, item){
			if (isPlaying && track_id == idPlaying) {
				sound.stop();
			}

			else if (!isPlaying){
				playAudio(url, track_id, item);
			}

			else {
				sound.stop();
				playAudio(url, track_id, item);
			}

		}

		volume_value =  (d3.select("#volume").node().value)/100;

		function playAudio(url, track_id, circle) {
			sound = new Howl({ src: url, format: ['mp3'], volume: volume_value,
					onplay: function(){
						isPlaying = true;
						idPlaying = track_id;

						 d3.select(circle)
		          			.style('fill',circle_highlight);

		          		
					},
					onstop: function(){
						isPlaying = false;

						d3.select(circle)
		          			.style('fill',circle_color);
					},
					onend: function() {
						isPlaying = false;

						d3.select(circle)
		          			.style('fill',circle_color);
					}
				});
			sound.play();
			}



	d3.select("#volume").on("input", function() {
    		updateVolume(this.value);
    	});

	// update the elements
	function updateVolume(volume) {

	  // adjust the text on the range slider
	  d3.select("#volume-value").text(volume);
	  d3.select("#volume").property("value", volume);

	  sound.volume(volume/100);
	}



	// Prepare a color palette
  	var color = d3.scaleLinear()
      .domain([0, 75]) // Max Popularity
      .range(["transparent",  circle_color])

    //function to return update plot w color scale scatter.attr("fill", function(d) { return color(d.length); })

//Track Info
	//function default empty track, update

		var x_feature = {}
		for (i in features) {
			feature = features[i]
			x_feature[feature] = d3.scaleLinear()
			.domain (feature_range[feature])
			.range([0, track_width])
		}

		var y_feature = d3.scalePoint()
		    .range([0, track_height])
		    .padding(0.4)
		    .domain(features);

	//var color = d3.scale.ordinal().range([color_bars, "grey"]);
		features.map(function(p) { 
			var xAxis = track_svg.append("g")
			    .attr("transform", "translate(0," + (15+y_feature(p)) + ")")
			    .call(d3.axisBottom(x_feature[p]).tickValues(x_feature[p].domain()).tickFormat(d3.format(".0f")));
			rect
			.append("rect")
			  		.attr("x", 0)
			  		.attr("y", y_feature(p))
			  		.attr("width", x_feature[p](d3.min(feature_range[p])))
			    	.attr("height", 15)
			    	.attr("fill", color_bars)
			    	.attr("class", "rect-"+p)
			rect
			.append("rect")
		  		.attr("x", x_feature[p](d3.min(feature_range[p])))
		  		.attr("y", y_feature(p))
		    	.attr("width", track_width - x_feature[p](d3.min(feature_range[p])))
		    	.attr("height", 15)
		    	.attr("fill", "gray")
		    	.attr("class", "rect-gray-"+p)
		    rect
		    .append("text")
				.style("text-anchor", "right")
				.attr("dy", y_feature(p) - 5)
				.attr("fill", "white")
				.text(p)
		    rect
		    .append("text")
				.style("text-anchor", "left")
				.attr("dy", y_feature(p) + 13)
				.attr("x", x_feature[p](d3.min(feature_range[p])) + 5)
				.attr("fill", "white")
				.attr("font-size", "14px")
				.text(d3.min(feature_range[p]))
				.attr("class","text-"+p)

		})

	function updateTrackInfo(d){
		features.map(function(p) { 
			rect.select(".rect-"+p).transition()
			  		.attr("width", x_feature[p](d[p]))
			rect.select(".rect-gray-"+p).transition()
		  		.attr("x", x_feature[p](d[p]))
		    	.attr("width", track_width - x_feature[p](d[p]))
		    rect.select(".text-"+p).transition()
				.attr("x", x_feature[p](d[p]) + 5)
				.text(d[p]);	
			})
	}
		

//Parallel 
	  var parallel_y = {}
	  for (i in features) {
	    name = features[i]
	    parallel_y[name] = d3.scaleLinear()
	      .domain( d3.extent(data, function(d) { return +d[name]; }) )
	      .range([parallel_height, 0])
	  }

	  // Build the X scale -> it find the best position for each Y axis
	  parallel_x = d3.scalePoint()
	    .range([0, parallel_width])
	    .padding(0.5)
	    .domain(features);

	   // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
	  function path(d) {
	      return d3.line()(features.map(function(p) { return [parallel_x(p), parallel_y[p](d[p])]; }));
	  }

	// Draw the axis:
	  parallel_svg.selectAll("myAxis")
	    // For each dimension of the dataset I add a 'g' element:
	    .data(features).enter()
	    .append("g")
	    // I translate this element to its right position on the x axis
	    .attr("transform", function(d) { return "translate(" + parallel_x(d) + ")"; })
	    // And I build the axis with the call function
	    .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(parallel_y[d])); })
	    // Add axis title
	    .append("text")
	      .style("text-anchor", "middle")
	      .attr("y", -9)
	      .text(function(d) { return d; })
	      .style("fill", "white")

	

//Most Similar Songs & Most Popular Songs
	$('#song-wsk').click(function(){
		checkPlaying(data[1557].preview_url, data[1557].id, d3.select("#circle-"+data[1557].id).node())
		updateTrackInfo(data[1557]);
		d3.select("#track-name").text("Song: " +data[1557].name);
		d3.select("#track-artist").text("Artist: " +data[1557].artist_name);
	});

	$('#song-apollo11').click(function(){
		checkPlaying(data[1813].preview_url, data[1813].id, d3.select("#circle-"+data[1813].id).node())
		updateTrackInfo(data[1813]);
		d3.select("#track-name").text("Song: " +data[1813].name);
		d3.select("#track-artist").text("Artist: " +data[1813].artist_name);
	});

	$('#song-favdonut').click(function(){
		checkPlaying(data[844].preview_url, data[844].id, d3.select("#circle-"+data[844].id).node())
		updateTrackInfo(data[844]);
		d3.select("#track-name").text("Song: " +data[844].name);
		d3.select("#track-artist").text("Artist: " +data[844].artist_name);
	});

	$('#song-loveme').click(function(){
		checkPlaying(data[1481].preview_url, data[1481].id, d3.select("#circle-"+data[1481].id).node())
		updateTrackInfo(data[1481]);
		d3.select("#track-name").text("Song: " +data[1481].name);
		d3.select("#track-artist").text("Artist: " +data[1481].artist_name);
	});

	$('#song-magkunwari').click(function(){
		checkPlaying(data[168].preview_url, data[168].id, d3.select("#circle-"+data[168].id).node())
		updateTrackInfo(data[168]);
		d3.select("#track-name").text("Song: " +data[168].name);
		d3.select("#track-artist").text("Artist: " +data[168].artist_name);
	});

	$('#song-liveagain').click(function(){
		checkPlaying(data[502].preview_url, data[502].id, d3.select("#circle-"+data[502].id).node())
		updateTrackInfo(data[502]);
		d3.select("#track-name").text("Song: " +data[502].name);
		d3.select("#track-artist").text("Artist: " +data[502].artist_name);
	});

	$('#song-jopay').click(function(){
		checkPlaying(data[126].preview_url, data[126].id, d3.select("#circle-"+data[126].id).node())
		updateTrackInfo(data[126]);
		d3.select("#track-name").text("Song: " +data[126].name);
		d3.select("#track-artist").text("Artist: " +data[126].artist_name);
	});

	$('#song-runaway').click(function(){
		checkPlaying(data[1696].preview_url, data[1696].id, d3.select("#circle-"+data[1696].id).node())
		updateTrackInfo(data[1696]);
		d3.select("#track-name").text("Song: " +data[1696].name);
		d3.select("#track-artist").text("Artist: " +data[1696].artist_name);
	});

	$('#song-bulong-reid').click(function(){
		checkPlaying(data[1179].preview_url, data[1179].id, d3.select("#circle-"+data[1179].id).node())
		updateTrackInfo(data[1179]);
		d3.select("#track-name").text("Song: " +data[1179].name);
		d3.select("#track-artist").text("Artist: " +data[1179].artist_name);
	});

	$('#song-moonstruck').click(function(){
		checkPlaying(data[1495].preview_url, data[1495].id, d3.select("#circle-"+data[1495].id).node())
		updateTrackInfo(data[1495]);
		d3.select("#track-name").text("Song: " +data[1495].name);
		d3.select("#track-artist").text("Artist: " +data[1495].artist_name);
	});

	$('#song-sana').click(function(){
		checkPlaying(data[1455].preview_url, data[1455].id, d3.select("#circle-"+data[1455].id).node())
		updateTrackInfo(data[1455]);
		d3.select("#track-name").text("Song: " +data[1455].name);
		d3.select("#track-artist").text("Artist: " +data[1455].artist_name);
	});

	$('#song-hindi-na-nga').click(function(){
		checkPlaying(data[838].preview_url, data[838].id, d3.select("#circle-"+data[838].id).node())
		updateTrackInfo(data[838]);
		d3.select("#track-name").text("Song: " +data[838].name);
		d3.select("#track-artist").text("Artist: " +data[838].artist_name);
	});

	$('#song-maybe-the-night').click(function(){
		checkPlaying(data[2181].preview_url, data[2181].id, d3.select("#circle-"+data[2181].id).node())
		updateTrackInfo(data[2181]);
		d3.select("#track-name").text("Song: " +data[2181].name);
		d3.select("#track-artist").text("Artist: " +data[2181].artist_name);
	});

	$('#song-kung-di-rin-lang-ikaw').click(function(){
		checkPlaying(data[172].preview_url, data[172].id, d3.select("#circle-"+data[172].id).node())
		updateTrackInfo(data[172]);
		d3.select("#track-name").text("Song: " +data[172].name);
		d3.select("#track-artist").text("Artist: " +data[172].artist_name);
	});

	$('#song-huling-sandali').click(function(){
		checkPlaying(data[166].preview_url, data[166].id, d3.select("#circle-"+data[166].id).node())
		updateTrackInfo(data[166]);
		d3.select("#track-name").text("Song: " +data[166].name);
		d3.select("#track-artist").text("Artist: " +data[166].artist_name);
	});

	$('#song-kahit-ayaw-mo-na').click(function(){
		checkPlaying(data[837].preview_url, data[837].id, d3.select("#circle-"+data[837].id).node())
		updateTrackInfo(data[837]);
		d3.select("#track-name").text("Song: " +data[837].name);
		d3.select("#track-artist").text("Artist: " +data[837].artist_name);
	});

	$('#song-di-na-babalik').click(function(){
		checkPlaying(data[833].preview_url, data[833].id, d3.select("#circle-"+data[833].id).node())
		updateTrackInfo(data[833]);
		d3.select("#track-name").text("Song: " +data[833].name);
		d3.select("#track-artist").text("Artist: " +data[833].artist_name);
	});

	$('#song-dahan').click(function(){
		checkPlaying(data[843].preview_url, data[843].id, d3.select("#circle-"+data[843].id).node())
		updateTrackInfo(data[843]);
		d3.select("#track-name").text("Song: " +data[843].name);
		d3.select("#track-artist").text("Artist: " +data[843].artist_name);
	});

	$('#song-bulong').click(function(){
		checkPlaying(data[173].preview_url, data[173].id, d3.select("#circle-"+data[173].id).node())
		updateTrackInfo(data[173]);
		d3.select("#track-name").text("Song: " +data[173].name);
		d3.select("#track-artist").text("Artist: " +data[173].artist_name);
	});

	$('#song-balang-araw').click(function(){
		checkPlaying(data[1454].preview_url, data[1454].id, d3.select("#circle-"+data[1454].id).node())
		updateTrackInfo(data[1454]);
		d3.select("#track-name").text("Song: " +data[1454].name);
		d3.select("#track-artist").text("Artist: " +data[1454].artist_name);
	});

//Album Variation
	var album_selected;
	var album_highlighted = false;

	function album_variation(album_id){
		var album_id_html = ".album-"+album_id;

		if (album_selected == album_id_html && album_highlighted){
			d3.selectAll(album_selected).style("fill", circle_color).style("opacity", 0.5);
			album_highlighted = false;
			parallel_svg.selectAll(".myPath").remove();
		}

		else{
			d3.selectAll(album_selected).style("fill", circle_color).style("opacity", 0.5);
			d3.selectAll(album_id_html).style("fill","red").style("opacity", 1);
			album_highlighted = true;
			parallel_svg.selectAll(".myPath").remove();

			parallel_svg.selectAll("myPath")
			    .data(data.filter(function(d){return d.album_id == album_id;}))
			    .enter().append("path")
			    .attr("class", "myPath")
			    .attr("d",  path)
			    .attr("opacity", 0.6)
			    .style("fill", "none")
			    .style("stroke", "red");

		}
		album_selected = album_id_html;

	}

	$('#album-points').click(function(){
		album_variation("4cx6CRSKWfQ90pSIbptsQh");

	});

	$('#album-zilch').click(function(){
		album_variation("2KzwyXW4u2MewGOnioHyT0");

	});


	$('#album-emprise').click(function(){
		album_variation("0ab6fhMmKWtTfczaxprpiy");

	});

	$('#album-cheats').click(function(){
		album_variation("7fy9ViwHRwWAEmG4upZLn9");

	});

	$('#album-soully').click(function(){
		album_variation("3SrqGYBJ6MaJ7QZu8yTZSN");

	});

	$('#album-fatigue').click(function(){
		album_variation("7i8cfv0rwUaJ0Q1KTTl7IM");

	});

	$('#album-traces').click(function(){
		album_variation("3LWiguQVKE7gAP1PsAyrwv");

	});

	$('#album-summer').click(function(){
		album_variation("7z2DVbUC9iLaBZe8mTmmE1");

	});

	$('#album-taeng').click(function(){
		album_variation("13vapJJUG4b1an7XNR56Hz");

	});

	$('#album-palm').click(function(){
		album_variation("0EPue1OBoRjRYpgQ3wLreE");

	});

	$('#album-naritokanangapala').click(function(){
		album_variation("1fhIqZTgAKsfEeNfzVHyZ6");

	});

	$('#album-pastilan').click(function(){
		album_variation("4jZMhB0AgTzISkuSoy0nsd");

	});


	$('#album-soberhaul').click(function(){
		album_variation("08nQUfuftB2KzgfTZNld8A");

	});


	$('#album-of-the-bed').click(function(){
		album_variation("2tP8y1GDr7DNomBkcJI0H0");

	});

	$('#album-grandma').click(function(){
		album_variation("60qph1sDjhgZtPR4IEnu5Y");

	});

	$('#album-rockstar').click(function(){
		album_variation("7dp1bIZwLjuQcSXbj9kICi");

	});

	$('#album-for-the-rest').click(function(){
		album_variation("5p6vpvFIalvE294hauTVbp");

	});

	$('#album-gusto-ko').click(function(){
		album_variation("2ccGiBe4kDrOdnRA0IMLlo");

	});

	$('#album-glaiza').click(function(){
		album_variation("6P5nlUfWzOj8zHxRcZ772x");

	});

	$('#album-orchid').click(function(){
		album_variation("4n7JDVgx22y8S3can1mSjk");

	});

	

	d3.select("#hide-track").on("click", function() {
		if (track_hidden){
    		$( "#track-info" ).show();
    		track_hidden = false;
		}
		else{
			$( "#track-info" ).hide();
			track_hidden = true;
		}
    	});

	d3.select("#hide-parallel").on("click", function() {
		if (parallel_hidden){
    		$( "#parallel" ).show();
    		parallel_hidden = false;
		}
		else{
			$( "#parallel" ).hide();
			parallel_hidden = true;
		}
    	});

	d3.select("#volume-icon").on("click", function() {
		if (slider_hidden){
    		$( "#volume-slider" ).show();
    		slider_hidden = false;
		}
		else{
			$( "#volume-slider" ).hide();
			slider_hidden = true;
		}
    	});




})



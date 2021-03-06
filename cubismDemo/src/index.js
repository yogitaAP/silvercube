$(document).ready(function() {
    
    function random(name) {
  var value = 0,
      values = [],
      i = 0,
      last;
  return context.metric(function(start, stop, step, callback) {
    start = +start, stop = +stop;
    if (isNaN(last)) last = start;
    while (last < stop) {
      last += step;
      value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += .2)));
      
          values.push(value);
      
    }
    callback(null, values = values.slice((start - stop) / step));
  }, name);
}

var context = cubism.context()
    .step(60 * 1000)
    .size(980)
    .serverDelay(0)
    .clientDelay(0);

var foo = random("foo"),
    bar = random("bar");

d3.select("#cat-1").call(function(div) {

  div.append("div")
      .attr("class", "axis")
      .call(context.axis().ticks(10).orient("top"));

  div.selectAll(".horizon")
      .data([foo, bar, foo.add(bar), foo.subtract(bar)])
    .enter().append("div")
      .attr("class", "horizon")
      .call(context.horizon().height(40).extent([-20, 20]));

  div.append("div")
      .attr("class", "rule")
      .call(context.rule());

});

//d3.select("#example2a").call(function(div) {
//  div.datum(foo);
//
//  div.append("div")
//      .attr("class", "horizon")
//      .call(context.horizon()
//        .height(120)
//        .mode("mirror")
//        .colors(["#bdd7e7","#bae4b3"])
//        .title("Area (120px)")
//        .extent([-10, 10]));
//
//  div.append("div")
//      .attr("class", "horizon")
//      .call(context.horizon()
//        .height(30)
//        .mode("mirror")
//        .colors(["#bdd7e7","#bae4b3"])
//        .title("Area (30px)")
//        .extent([-10, 10]));
//});
//
//d3.select("#example2b").call(function(div) {
//  div.datum(foo);
//
//  div.append("div")
//      .attr("class", "horizon")
//      .call(context.horizon()
//        .height(120)
//        .colors(["#bdd7e7","#bae4b3"])
//        .title("Horizon, 1-band (120px)")
//        .extent([-10, 10]));
//
//  div.append("div")
//      .attr("class", "horizon")
//      .call(context.horizon()
//        .height(60)
//        .colors(["#6baed6","#bdd7e7","#bae4b3","#74c476"])
//        .title("Horizon, 2-band (60px)")
//        .extent([-10, 10]));
//
//  div.append("div")
//      .attr("class", "horizon")
//      .call(context.horizon()
//        .height(40)
//        .colors(["#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354"])
//        .title("Horizon, 3-band (40px)")
//        .extent([-10, 10]));
//
//  div.append("div")
//      .attr("class", "horizon")
//      .call(context.horizon()
//        .height(30)
//        .colors(["#08519c","#3182bd","#6baed6","#bdd7e7","#bae4b3","#74c476","#31a354","#006d2c"])
//        .title("Horizon, 4-band (30px)")
//        .extent([-10, 10]));
//
//});

// On mousemove, reposition the chart values to match the rule.
context.on("focus", function(i) {
  d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
});

});

Chart.defaults.global.responsive = true;
var colors = [
  "rgba(78,191,126,.5)",
  "rgba(4,191,219,.5)",
  "rgba(7,31,82,.5)",
  "rgba(65,119,78,.5)",
  "rgba(3,135,81,.5)",
];
var colorMap = {};

var Loser = React.createClass({
  mixins: [ReactFireMixin],
  componentWillMount: function () {
    this.bindAsArray(new Firebase("https://loserboard.firebaseio.com/weights/"), "weights");
  },
  addWeight: function (e) {
    e.preventDefault();
    var newWeight = this.refs.newWeight.getDOMNode().value.trim();
    this.firebaseRefs["weights"].push({
      weight: parseInt(newWeight, 10),
      date: (new Date()).toJSON(),
      loser: this.props.loser.name
    });
  },
  render: function () {
    var styles = {
      'background-color': colorMap[this.props.loser.name]
    };
    return (
      <div key={this.props.loser} className="list-group-item" style={styles}>
        <span className="title">{this.props.loser.name}</span>
        <button onClick={this.addWeight} className="pull-right btn btn-success">add</button>
        <input ref="newWeight" type="number" step="0.01" className="pull-right add-weight-input" />
      </div>
    );
  },
});

var Loserboard = React.createClass({
  mixins: [ReactFireMixin],
  componentWillMount: function () {
    this.bindAsArray(new Firebase("https://loserboard.firebaseio.com/losers/"), "losers");
    this.weightsRef = new Firebase("https://loserboard.firebaseio.com/weights/");
    this.bindAsArray(this.weightsRef , "weights");

    this.weightsRef.on('child_added', function (snap) {
      snap = snap.val();
      var potentialWeight = this.relativeWeightFor(snap.loser, snap.weight);
      if(!isNaN(potentialWeight) && !!this.chart) {
        this.chart.addData([potentialWeight], snap.loser);
      }
    }.bind(this));
    this.weightsRef.on('value', function (snap) {
      this.initializeChart();
    }.bind(this));
  },

  startOver: function () {
    this.firebaseRefs["weights"].remove();
  },

  componentWillUnmount: function () {
    this.weightsRef.off();
  },

  componentDidMount: function() {
    this.initializeChart(this.props);
  },

  startingWeights: function () {
    var startingWeights = {};
    var weights = this.rawWeights();
    for(var name in weights) {
      startingWeights[name] = weights[name][0];
    }
    return startingWeights;
  },

  rawWeights: function () {
    var weights = {};
    this.state.weights.map(function(weight, i) {
      if(!weights[weight.loser]) {
        weights[weight.loser] = []
      }
      weights[weight.loser].push(weight.weight);
      return weight.weight;
    }.bind(this));
    return weights;
  },

  relativeWeightFor: function (name, weight) {
    var weights = this.startingWeights();
    var start = weights[name];
    return (-1 * (100 * ((start - weight) / start)));
  },

  relativeWeights: function () {
    var weights = this.rawWeights();
    for(var name in weights) {
      var measurements = weights[name];
      var ws = [0];
      for(var i = 1; i < measurements.length; i++) {
        ws.push(this.relativeWeightFor(name, measurements[i]));
      }
      weights[name] = ws;
    }
    console.log(weights);
    return weights;
  },

  getChartData: function () {
    var data = { datasets: [] };
    var weights = this.relativeWeights();
    var i = 0, color;
    for(var loser in this.relativeWeights()) {
      color = colorMap[loser];
      data.datasets.push({
         label: loser,
         data: weights[loser],
         strokeColor: color,
         pointColor: color,
         fillColor: color,
         pointStrokeColor: "#fff",
         pointHighlightFill: "#fff",
         pointHighlightStroke: color,
      });
      i += 1;
    }
    data.labels = ["week1", "week2", "week3", "week4", "week5", "week2"];
    return data;
  },

  initializeChart: function () {
    var data = this.getChartData();
    if(data.datasets.length > 0) {
      var ctx = document.getElementById("weightsChart").getContext("2d");
      this.chart = new Chart(ctx).Line(data, {});
    }
  },

  getInitialState: function() {
    return { losers: [], weights: [] };
  },

  handleSubmit: function (e) {
    e.preventDefault();
    this.firebaseRefs["losers"].push({
      name: this.refs.newLoser.getDOMNode().value.trim(),
      weights: []
    });
  },

  render: function () {
    var losers = this.state.losers.map(function(loser, i) {
      if(!colorMap[loser.name]) {
        colorMap[loser.name] = colors.shift();
      }
      return (
        <Loser loser={loser} />
      );
    }.bind(this));

    return (
      <div>
        <h1>Losers</h1>
        <div className="list-group">
          {losers}
        </div>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <input type="text" ref="newLoser" className="form-control" />
          </div>
          <button className="btn btn-success">Add Loser</button>
        </form>
        <div className="form-group">
          <button className="btn btn-danger" onClick={this.startOver}>Start Over!</button>
        </div>
      </div>
    );
  },
});

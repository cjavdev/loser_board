var Loserboard = React.createClass({
  getInitialState: function() {
    return { losers: [] };
  },
  handleSubmit: function (e) {
    e.preventDefault();
    this.firebaseRefs["losers"].push({
      name: this.refs.newLoser.getDOMNode().value.trim()
    });
  },
  mixins: [ReactFireMixin],
  render: function () {
    var losers = this.state.losers.map(function(loser, i) {
      return (
        <div key={loser}>
          {loser}
        </div>
      );
    }.bind(this));
    return (
      <div>
        <h1>Losers</h1>
        {losers}
        <form onSubmit={this.handleSubmit}>
          <input type="text" ref="newLoser" />
          <button>Add Loser</button>
        </form>
      </div>
    );
  },
  componentWillMount: function () {
    this.bindAsArray(new Firebase("https://loserboard.firebaseio.com/losers/"), "losers");
  },
});

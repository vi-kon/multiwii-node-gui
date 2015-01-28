var Connection = function () {
    this.interval = null;
};

Connection.prototype.start = function (name) {
    var self = this;

    console.log('Conn: Start');

    this.interval = setInterval(function () {
        Meteor.call('mspRawImu', name, function (error, resource) {
            if (error) {
                notify('Conn: Error during connection');
                self.stop();
            }
            self.dispatchEvent(new CustomEvent('rawImu.update', {
                detail: resource
            }));
        });
    }, 100);
};

Connection.prototype.stop = function () {
    console.log('Conn: Stop');

    if (this.interval !== null) {
        clearInterval(this.interval);
        this.interval = null;
    }
};

ActiveConnection = new Connection()
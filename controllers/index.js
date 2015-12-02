'use strict';

module.exports = function (router) {

    router.get('/', function (req, res) {
        res.send('<code><pre>' + "HELLO - Welcome to My API" + '</pre></code>');   
    });

};

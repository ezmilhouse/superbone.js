Modernizr.load([

    {
        load     : ('//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js'),
        complete : function() {
            if (!window.jQuery) {
                Modernizr.load('/js/libs/jquery/jquery-1.7.1.min.js');
            }
        }
    },
    {
        load : ('/js/libs/flow/lib/flow.min.js')
    },
    {
        load : ('/js/libs/json2/json2.js')
    },
    {
        load : ('/js/libs/underscore/underscore-1.3.1.min.js')
    },
    {
        load : ('/js/libs/backbone/backbone-0.9.2.min.js')
    },
    {
        load : ('/js/libs/jade/jade.min.js')
    },
    {
        load : ('/js/libs/superagent/superagent.min.js')
    },
    {
        load : ('/js/src/superbone.js')
    },
    {
        load : ('/js/app.js')
    }
]);
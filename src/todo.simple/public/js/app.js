$(function() {

    var data = [
        {
            id     : 1,
            text   : 'Task',
            isDone : false
        },
        {
            id     : 2,
            text   : 'Task',
            isDone : false
        },
        {
            id     : 3,
            text   : 'Task',
            isDone : false
        }
    ];

    // ---

    superbone.Controller
        .create('todo')
        .is('isDone', function(err, evt, ctx){
            // toggles item's state depending on
            // current state
            var state = ctx.id.hasClass('isDone');
            if (state) return ctx.id.removeClass('isDone');
            ctx.id.addClass('isDone');
        })
        .end();

    // ---

    superbone.Model
        .create('todoItem')
        .end();

    superbone.Collection
        .create('todoList')
        .of('todoItem')
        .end();

    superbone.View
        .create('todo')
        .of('todoList')
        .on('click input[type:checkbox]', 'todo:isDone')
        .end();

    // ---

    superbone.collections
        .get('todoList')
        .reset(data);

    superbone.views
        .get('todo')
        .render();

    // ---

    log('Superbone.js', superbone.version);

});
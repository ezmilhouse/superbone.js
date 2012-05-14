# Superbone.js
a convenient wrapper for Backbone.js

## Motivation
Backbone did a great job by injecting the core MVC idea into our daily JS work, but the code of Backbone projects can easily become a terrifying mess.

Superbone.js is a convenient wrapper library to make your Backbone life a lot
 easier by introducing a dead-simple API to handle your models, collections, views and controllers.

## Quickstart

Let's create a little 'Todo' app:

* create model & collection

```js


    superbone.Model
        .create('todoItem')
        .end();

    superbone.Collection
        .create('todoList')
        .of('todoItem') // bind model
        .end();

```

* create view

```js


    superbone.View
        .create('todo')
        .of('todoList') // bind collection
        .on('click input', 'todo:isDone') // bind controller
        .end();

```

* create controller

```js


    superbone.Controller
        .create('todo')
        .is('isDone', function(err, evt, ctx){
            // toggles item's state
            var state = ctx.id.hasClass('isDone');
            if (state) return ctx.id.removeClass('isDone');
            ctx.id.addClass('isDone');
        })
        .end();

```

* fill up collection with some static demo data and render view

```js


    var data = [
        {
            id     : 1,
            text   : 'Task 1',
            isDone : false
        },
        {
            id     : 2,
            text   : 'Task 2',
            isDone : false
        }
    ];

    // ---

    superbone.collections
        .get('todoList')
        .reset(data);

    superbone.views
        .get('todo')
        .render();

```